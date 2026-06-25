import json
import sys
import os
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from redis_client import client as redis_client

colors = ['#9cff75', '#ffd375', '#ef91fa', '#ffc0cb', '#7fffd4']


class Rooms:
    def createRoom(self, numPlayers, playerName, gridSize, playerHash):
        now = datetime.now()
        roomId = playerName + now.strftime("%d%m%Y%H%M%S")
        grid_data = [['' for _ in range(gridSize)] for _ in range(gridSize)]

        redis_client.hset(f"room:{roomId}", mapping={
            "numPlayers": numPlayers,
            "gridSize": gridSize,
            "playerCount": 1
        })
        redis_client.set(f"room:{roomId}:grid", json.dumps(grid_data))
        redis_client.set(f"room:{roomId}:currentTurn", 0)
        redis_client.rpush(f"room:{roomId}:players",
                           json.dumps({"name": playerName, "score": 0, "color": colors[0], "hash": playerHash}))
        redis_client.sadd("rooms:index", roomId)

        return {
            "roomId": roomId,
            "playerName": playerName,
            "playerData": self.getPlayersData(roomId),
            "gameData": grid_data,
            "currentTurn": 0,
            "currentPlayer": playerName
        }

    def JoinRoom(self, roomId, playerName, playerHash):
        if not redis_client.exists(f"room:{roomId}"):
            return {"status": "room not found"}

        playerCount = int(redis_client.hget(f"room:{roomId}", "playerCount"))
        numPlayers = int(redis_client.hget(f"room:{roomId}", "numPlayers"))

        if playerCount >= numPlayers:
            return {"status": "room is already full"}

        redis_client.rpush(f"room:{roomId}:players",
                           json.dumps({"name": playerName, "score": 0, "color": colors[playerCount], "hash": playerHash}))
        redis_client.hincrby(f"room:{roomId}", "playerCount", 1)

        currentTurn = int(redis_client.get(f"room:{roomId}:currentTurn"))
        players = self.getPlayersData(roomId)

        return {
            "status": "player joined successfully",
            "roomId": roomId,
            "gameData": json.loads(redis_client.get(f"room:{roomId}:grid")),
            "playerName": playerName,
            "playerData": players,
            "currentTurn": currentTurn,
            "currentPlayer": players[currentTurn]["name"]
        }

    def findPlayerByHash(self, roomId, playerHash):
        players = self.getPlayersData(roomId)
        for p in players:
            if p.get("hash") == playerHash:
                return p
        return None

    def getPlayersData(self, roomId):
        players = redis_client.lrange(f"room:{roomId}:players", 0, -1)
        return [json.loads(p) for p in players]

    def newMessage(self, roomId, sender, time, message):
        chat_data = {"Sender": sender, "Time": time, "Message": message}
        redis_client.rpush(f"room:{roomId}:chats", json.dumps(chat_data))
        chats = redis_client.lrange(f"room:{roomId}:chats", 0, -1)
        return [json.loads(c) for c in chats]

    def updateBoard(self, roomId, val, i, j):
        grid = json.loads(redis_client.get(f"room:{roomId}:grid"))
        grid[i][j] = val
        redis_client.set(f"room:{roomId}:grid", json.dumps(grid))
        return {"gameData": grid, "i": i, "j": j}

    def validateTurn(self, roomId, playerName):
        currentTurn = int(redis_client.get(f"room:{roomId}:currentTurn"))
        players = self.getPlayersData(roomId)
        return players[currentTurn]["name"] == playerName

    def validateTurnByHash(self, roomId, playerHash):
        currentTurn = int(redis_client.get(f"room:{roomId}:currentTurn"))
        players = self.getPlayersData(roomId)
        return players[currentTurn].get("hash") == playerHash

    def advanceTurn(self, roomId):
        playerCount = int(redis_client.hget(f"room:{roomId}", "playerCount"))
        currentTurn = int(redis_client.get(f"room:{roomId}:currentTurn"))
        nextTurn = (currentTurn + 1) % playerCount
        redis_client.set(f"room:{roomId}:currentTurn", nextTurn)
        players = self.getPlayersData(roomId)
        return {
            "currentTurn": nextTurn,
            "currentPlayer": players[nextTurn]["name"]
        }

    def getCurrentTurn(self, roomId):
        currentTurn = int(redis_client.get(f"room:{roomId}:currentTurn"))
        players = self.getPlayersData(roomId)
        return {
            "currentTurn": currentTurn,
            "currentPlayer": players[currentTurn]["name"]
        }

    def setLastCell(self, roomId, i, j, playerHash):
        data = json.dumps({"i": i, "j": j, "playerHash": playerHash})
        redis_client.set(f"room:{roomId}:lastCell", data)

    def getLastCell(self, roomId):
        raw = redis_client.get(f"room:{roomId}:lastCell")
        if raw is None:
            return None
        return json.loads(raw)

    def clearClaimPhase(self, roomId):
        redis_client.delete(f"room:{roomId}:lastCell")
        redis_client.delete(f"room:{roomId}:claimDeadline")

    def addScore(self, roomId, playerHash, points):
        players = self.getPlayersData(roomId)
        for i, p in enumerate(players):
            if p.get("hash") == playerHash:
                players[i]["score"] += points
                redis_client.lset(f"room:{roomId}:players", i, json.dumps(players[i]))
                break
        return players

    def wordExistsInLine(self, roomId, word, i, j):
        grid = json.loads(redis_client.get(f"room:{roomId}:grid"))
        size = len(grid)
        word = word.upper()
        print(f"[DEBUG wordExistsInLine] word={word} anchor=({i},{j}) grid size={size}")

        dirs = [
            (0, 1),
            (1, 0),
            (1, 1)
        ]

        for di, dj in dirs:
            ci, cj = i, j
            while 0 <= ci - di < size and 0 <= cj - dj < size:
                ci -= di
                cj -= dj

            line = []
            line_cells = []
            while 0 <= ci < size and 0 <= cj < size:
                line.append(grid[ci][cj])
                line_cells.append((ci, cj))
                ci += di
                cj += dj

            print(f"[DEBUG wordExistsInLine] dir=({di},{dj}) line_cells={line_cells}")

            anchor_idx = next(
                (idx for idx, (li, lj) in enumerate(line_cells) if li == i and lj == j),
                None
            )
            if anchor_idx is None:
                print(f"[DEBUG wordExistsInLine] anchor not in this direction")
                continue
            print(f"[DEBUG wordExistsInLine] anchor_idx={anchor_idx}")

            for start_idx in range(0, anchor_idx + 1):
                for end_idx in range(anchor_idx + 1, len(line) + 1):
                    candidate = "".join(line[start_idx:end_idx])
                    print(f"[DEBUG wordExistsInLine] check cells[{start_idx}:{end_idx}] -> '{candidate}'")
                    if candidate == word:
                        print(f"[DEBUG wordExistsInLine] FOUND!")
                        return {
                            "found": True,
                            "cells": line_cells[start_idx:end_idx],
                            "word": word
                        }

        print(f"[DEBUG wordExistsInLine] NOT FOUND")
        return {"found": False}
