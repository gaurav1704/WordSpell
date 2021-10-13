from datetime import datetime
from flask import Flask
from flask.wrappers import Response
from flask_socketio import SocketIO, send, emit, join_room, leave_room
from flask_cors import CORS, cross_origin
import json
from Classes import Room


chats = []
colors = ['#9cff75', '#ffd375', '#ffd375', '#ffd375', '#ef91fa']
rooms={}
now = datetime.now()

Rooms = Room.Rooms()


app = Flask(__name__)
app.config["SECRET_KEY"] = "secretkey"
socketio = SocketIO(app, cors_allowed_origins="*")

@socketio.on('connect')
def connected(data):
    print("connected")
    emit( "connectResponse","You are connected", broadcast = True)

@socketio.on('message')
def handleMessage(message):
    print(type(message))
    print("recieved message -> ", message['sender'])
    emit( "messageResponse","hi "+message["sender"], broadcast = True)


@socketio.on("joinRoom")
def joinRoom(playerName, roomId):
    response = Rooms.JoinRoom(roomId, playerName)
    join_room(roomId)
    emit("roomJoined", response, to=roomId)

    

@socketio.on('createRoom')
def createRoom(numPlayers, playerName, gridSize):
    response = Rooms.createRoom(numPlayers, playerName, gridSize)
    join_room(response["roomId"])
    emit("roomCreated", response, to=response["roomId"])


@socketio.on('chat')
def handleChat(roomId, chat):
    response = Rooms.newMessage(roomId, chat["Sender"], chat["Time"], chat["Message"])
    emit("chatResponse", response, to=roomId)

@socketio.on('updateBoard')
def handleUpdateBoard(roomId, val, i, j):
    response = Rooms.updateBoard(roomId, val, i, j)
    print(response)
    emit("updateBoardResponse", response, to=roomId)

if __name__ == "__main__":
    socketio.run(app)