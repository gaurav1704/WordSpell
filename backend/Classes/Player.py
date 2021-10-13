class Player:
    def __init__(self, name, color, avatar=None) -> None:
        self.name = name
        self.color = color
        self.score = 0
        self.avatar = avatar

    def setName(self, name):
        self.name = name

    def setScore(self, score):
        self.score += score

    def getData(self):
        return {'name': self.name, 'score':self.score, "color":self.color}