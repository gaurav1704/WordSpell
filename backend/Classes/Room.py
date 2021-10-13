from .Player import Player
from .Chat import Chats
from datetime import datetime


class Room:
    def __init__(self, roomId, numPlayers, playerName, gridSize) -> None:
        self.colors = ['#9cff75', '#ffd375', '#ef91fa', '#ffc0cb', '#7fffd4']
        self.roomId = roomId
        self.players = [Player(playerName, self.colors[0])]
        self.numPlayers = numPlayers
        self.gridSize = gridSize
        self.chats = Chats()
        self.gridData = [['' for i in range(self.gridSize)] for j in range(self.gridSize)]

    def getRoomId(self):
        return self.roomId

    def newChat(self, sender, time, message):
        return self.chats.newChat(sender, time, message)

    def updateScore(self, playerName, scoreObtained):
        
        for player in self.players:
            if player.name == playerName:
                player.setScore(scoreObtained)
                return {player.getData()}

    def updateBoard(self, val, i, j):
        self.gridData[i][j] = val
        return self.gridData

    def getPlayersData(self):
        res = []
        for player in self.players:
            res.append(player.getData())
        return res

    def addPlayer(self, playerName):
        print(len(self.players))
        if len(self.players) < self.numPlayers:
            self.players.append(Player(playerName, self.colors[len(self.players)]))
            return {"success": "player joined successfully"}
        else:
            return {"error": "room is already full"}


class Rooms:
    def __init__(self) -> None:
        self.rooms = []
        self.playerCount = 0

    def createRoom(self, numPlayers, playerName, gridSize):
        now = datetime.now()
        roomId = playerName + now.strftime("%d%m%Y%H%M%S")
        self.rooms.append(Room(roomId, numPlayers, playerName, gridSize))
        self.playerCount += 1
        return {
            "roomId" : self.rooms[-1].getRoomId(), 
            "playerName": playerName,
            "playerData": self.rooms[-1].getPlayersData(), 
            "gameData":self.rooms[-1].gridData
        }

    def JoinRoom(self, roomId, playerName):
        for room in self.rooms:
            if room.getRoomId() == roomId:
                status = room.addPlayer(playerName)
                if "success" in status:
                    self.playerCount += 1
                    return {
                        "status": status["success"], 
                        "roomId": room.getRoomId(), 
                        "gameData":room.gridData, 
                        "playerName": playerName,
                        "playerData": room.getPlayersData()
                    }
                else:
                    return {"status": status["error"]}

    def newMessage(self, roomId, sender, time, message):
        for room in self.rooms:
            if room.getRoomId() == roomId:
                return room.newChat(sender, time, message)

    def updateBoard(self, roomId, val, i, j):
        print("called", roomId)
        for room in self.rooms:
            if room.getRoomId() == roomId:
                print(room.gridData, room.getRoomId())
                room.gridData[i][j] = val
                return {"gameData": room.gridData, "i":i, "j":j}

    
                
        
        
        