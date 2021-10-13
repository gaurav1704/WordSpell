class Chat:
    def __init__(self, sender, time, message) -> None:
        self.sender = sender
        self.time = time
        self.message = message

    def getMessage(self):
        return {'Sender': self.sender, 'Time': self.time, 'Message': self.message}

class Chats:
    def __init__(self) -> None:
        self.allChats = []

    def newChat(self, sender, time, message):
        self.allChats.append(Chat(sender, time, message))
        # return self.allChats[-1].getMessage()
        return self.getAllChats()

    def getAllChats(self):
        res = []
        for chat in self.allChats:
            res.append(chat.getMessage())
        return res
    
    