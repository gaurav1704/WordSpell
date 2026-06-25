import threading
import json
import time
import hashlib
import hmac
import requests
from flask import Flask
from flask_socketio import SocketIO, emit, join_room

from redis_client import client as redis_client, pubsub
from Classes import Room

Rooms = Room.Rooms()
app = Flask(__name__)
app.config["SECRET_KEY"] = "secretkey"
socketio = SocketIO(app, cors_allowed_origins="*")

TURN_TIMEOUT = 30
CLAIM_TIMEOUT = 15


def make_hash(playerName):
    return hmac.new(
        app.config["SECRET_KEY"].encode(),
        playerName.lower().strip().encode(),
        hashlib.sha256
    ).hexdigest()


def redis_listener():
    pubsub.psubscribe("room:*")
    for message in pubsub.listen():
        if message["type"] == "pmessage":
            try:
                data = json.loads(message["data"])
                socketio.emit(data["event"], data["data"], to=data["roomId"])
            except Exception as e:
                print(f"Redis pub/sub error: {e}")


threading.Thread(target=redis_listener, daemon=True).start()


def publish(roomId, event, data):
    redis_client.publish(f"room:{roomId}", json.dumps({
        "event": event,
        "data": data,
        "roomId": roomId
    }))


def publish_turn_update(roomId, turnData, timeout=TURN_TIMEOUT):
    deadline = time.time() + timeout
    redis_client.set(f"room:{roomId}:turnDeadline", deadline)
    publish(roomId, "turnUpdate", {**turnData, "deadline": deadline})


def turn_timeout_checker():
    while True:
        time.sleep(1)
        try:
            for roomId in redis_client.smembers("rooms:index"):
                deadline = redis_client.get(f"room:{roomId}:turnDeadline")
                if deadline and float(deadline) < time.time():
                    Rooms.clearClaimPhase(roomId)
                    turnData = Rooms.advanceTurn(roomId)
                    publish_turn_update(roomId, turnData)
        except Exception as e:
            print(f"Timeout checker error: {e}")


threading.Thread(target=turn_timeout_checker, daemon=True).start()


@socketio.on('connect')
def connected(data):
    print("connected")
    emit("connectResponse", "You are connected", broadcast=True)


@socketio.on('message')
def handleMessage(message):
    print("received message ->", message['sender'])
    emit("messageResponse", "hi " + message["sender"], broadcast=True)


@socketio.on("joinRoom")
def joinRoom(playerName, roomId):
    playerHash = make_hash(playerName)
    response = Rooms.JoinRoom(roomId, playerName, playerHash)
    response["playerHash"] = playerHash
    join_room(roomId)
    publish(roomId, "roomJoined", response)
    turnData = Rooms.getCurrentTurn(roomId)
    publish_turn_update(roomId, turnData)


@socketio.on('createRoom')
def createRoom(numPlayers, playerName, gridSize):
    playerHash = make_hash(playerName)
    response = Rooms.createRoom(numPlayers, playerName, gridSize, playerHash)
    response["playerHash"] = playerHash
    join_room(response["roomId"])
    publish(response["roomId"], "roomCreated", response)
    publish_turn_update(response["roomId"], {
        "currentTurn": response["currentTurn"],
        "currentPlayer": response["currentPlayer"]
    })


@socketio.on('chat')
def handleChat(roomId, chat):
    response = Rooms.newMessage(roomId, chat["Sender"], chat["Time"], chat["Message"])
    publish(roomId, "chatResponse", response)


@socketio.on('updateBoard')
def handleUpdateBoard(roomId, val, i, j, playerHash):
    if not Rooms.validateTurnByHash(roomId, playerHash):
        emit("turnError", {"message": "It's not your turn"})
        return

    response = Rooms.updateBoard(roomId, val, i, j)
    response["playerHash"] = playerHash
    publish(roomId, "updateBoardResponse", response)

    Rooms.setLastCell(roomId, i, j, playerHash)
    currentTurn = Rooms.getCurrentTurn(roomId)
    publish_turn_update(roomId, currentTurn, timeout=CLAIM_TIMEOUT)
    publish(roomId, "claimPhase", {
        "i": i, "j": j,
        "playerHash": playerHash,
        "deadline": time.time() + CLAIM_TIMEOUT
    })


@socketio.on('reconnectRoom')
def handleReconnectRoom(roomId, playerHash):
    if not redis_client.exists(f"room:{roomId}"):
        emit("reconnectError", {"error": "room not found"})
        return
    player = Rooms.findPlayerByHash(roomId, playerHash)
    if not player:
        emit("reconnectError", {"error": "player not found"})
        return
    join_room(roomId)
    try:
        players = Rooms.getPlayersData(roomId)
        raw_grid = redis_client.get(f"room:{roomId}:grid")
        if raw_grid is None:
            emit("reconnectError", {"error": "game data corrupted"})
            return
        grid = json.loads(raw_grid)
        currentTurn = int(redis_client.get(f"room:{roomId}:currentTurn") or 0)
        deadline = redis_client.get(f"room:{roomId}:turnDeadline")
        result = {
            "roomId": roomId,
            "playerName": player["name"],
            "playerHash": playerHash,
            "playerData": players,
            "gameData": grid,
            "currentTurn": currentTurn,
            "currentPlayer": players[currentTurn]["name"]
        }
        if deadline:
            result["deadline"] = float(deadline)
        emit("roomReconnected", result)
    except Exception as e:
        print(f"Reconnect error for room {roomId}: {e}")
        emit("reconnectError", {"error": "reconnect failed"})


@socketio.on('claimWord')
def handleClaimWord(roomId, playerHash, word):
    if not redis_client.exists(f"room:{roomId}:lastCell"):
        emit("claimError", {"error": "no active claim phase"})
        return

    lastCell = Rooms.getLastCell(roomId)
    if lastCell["playerHash"] != playerHash:
        emit("claimError", {"error": "not your word to claim"})
        return

    if len(word) < 2:
        emit("claimError", {"error": "word must be at least 2 letters"})
        return

    li = lastCell["i"]
    lj = lastCell["j"]
    print(f"[DEBUG claimWord] room={roomId} word='{word}' playerHash={playerHash[:8]}... lastCell=({li},{lj})")
    result = Rooms.wordExistsInLine(roomId, word, lastCell["i"], lastCell["j"])
    print(f"[DEBUG claimWord] wordExistsInLine result: {result}")
    if not result["found"]:
        emit("claimError", {"error": "word not found in a straight line through your new letter"})
        return

    try:
        resp = requests.get(f"https://api.dictionaryapi.dev/api/v2/entries/en/{word.lower().strip()}", timeout=5)
        if resp.status_code != 200:
            emit("claimError", {"error": "not a valid English word"})
            return
    except Exception as e:
        print(f"Dictionary API error during claim: {e}")
        emit("claimError", {"error": "could not verify word"})
        return

    player = Rooms.findPlayerByHash(roomId, playerHash)
    score = len(word)
    updated_players = Rooms.addScore(roomId, playerHash, score)
    Rooms.clearClaimPhase(roomId)

    word_data = {"word": word, "playerName": player["name"], "score": score}
    redis_client.rpush(f"room:{roomId}:words", json.dumps({**word_data, "found": True, "data": None}))
    publish(roomId, "wordClaimed", {**word_data, "playerData": updated_players})

    turnData = Rooms.advanceTurn(roomId)
    publish_turn_update(roomId, turnData)


@socketio.on('skipClaim')
def handleSkipClaim(roomId, playerHash):
    if not redis_client.exists(f"room:{roomId}:lastCell"):
        emit("claimError", {"error": "no active claim phase"})
        return

    lastCell = Rooms.getLastCell(roomId)
    if lastCell["playerHash"] != playerHash:
        emit("claimError", {"error": "not your turn to skip"})
        return

    Rooms.clearClaimPhase(roomId)
    turnData = Rooms.advanceTurn(roomId)
    publish_turn_update(roomId, turnData)


@socketio.on('lookupWord')
def handleLookupWord(roomId, word):
    word = word.strip().lower()
    try:
        resp = requests.get(f"https://api.dictionaryapi.dev/api/v2/entries/en/{word}", timeout=5)
        if resp.status_code == 200:
            data = resp.json()
            result = {"word": word, "found": True, "data": data[0]}
        else:
            result = {"word": word, "found": False, "data": None}
    except Exception as e:
        print(f"Dictionary API error: {e}")
        result = {"word": word, "found": False, "data": None}

    redis_client.rpush(f"room:{roomId}:words", json.dumps(result))
    publish(roomId, "wordLookupResponse", result)


if __name__ == "__main__":
    socketio.run(app, port=5001, allow_unsafe_werkzeug=True)


