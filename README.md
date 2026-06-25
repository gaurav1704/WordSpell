# WordSpell

A real-time multiplayer word game built with React, Flask-SocketIO, and Redis. Players take turns placing letters on a shared grid to form words, competing for the highest score.

## Architecture

```
┌──────────────────────────────────────────────────────┐
│              Browser (React 17 + SocketIO)             │
│                                                       │
│  App.js (Router: /home, /room/:id/:hash)              │
│    ├─ RoomOptions (Create / Join room lobby)           │
│    └─ Main (Game room layout)                          │
│         ├─ Game (NxN interactive grid)                │
│         └─ ScoreSection (sidebar tabs)                │
│              ├─ ScoreBoard                             │
│              ├─ Chat                                   │
│              └─ Word Lookup (Dictionary API)           │
│                                                       │
│  State: gameData, currentTurn, deadline, claimMode     │
└────────────── Socket.IO (WebSocket) ──────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────┐
│           Backend (Flask + Flask-SocketIO)            │
│                       main.py                         │
│                                                       │
│  Events: connect, createRoom, joinRoom,               │
│          reconnectRoom, updateBoard, claimWord,        │
│          skipClaim, lookupWord, chat                   │
│                                                       │
│  Background Threads:                                   │
│    redis_listener() ── Pub/sub → SocketIO bridge      │
│    turn_timeout_checker() ── 1s interval timer        │
└────────────────────── Redis ───────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────┐
│          Redis (in-memory data store)                 │
│                                                       │
│  room:{id}              HASH  ── room config          │
│  room:{id}:grid         STRING ── JSON grid           │
│  room:{id}:players      LIST  ── player objects       │
│  room:{id}:chats        LIST  ── chat messages        │
│  room:{id}:words        LIST  ── claimed words        │
│  room:{id}:currentTurn  STRING ── turn index          │
│  room:{id}:turnDeadline STRING ── epoch timestamp     │
│  rooms:index            SET   ── active room IDs      │
└───────────────────────────────────────────────────────┘
```

## Features

### Gameplay
- **Multiplayer rooms** — 2–5 players per room, create or join via room ID
- **Configurable grid** — 5×5 up to 10×10
- **Turn-based letter placement** — each player fills one cell per turn
- **30-second turn timer** — auto-advances if idle
- **15-second claim phase** — after placing a letter, player can claim a word
- **Word validation** — checks word exists in a straight line (row, column, or diagonal top-left → bottom-right) through the newly placed cell
- **Dictionary validation** — verifies words against the [Free Dictionary API](https://api.dictionaryapi.dev)
- **Scoring** — score = number of letters in claimed word
- **Claim phase UI** — click start cell → click end cell → review → claim (with highlight colors)
- **Skip claim** — optionally skip and pass the turn
- **Claim success banner** — animated notification showing who claimed what

### Chat
- Real-time messaging with SocketIO
- Color-coded sender names per player
- Timestamps and auto-aligned messages (own messages right-aligned)
- Auto-resizing textarea input

### Word Lookup
- In-game dictionary lookup via SocketIO
- Displays phonetics, part of speech, definitions, examples, synonyms
- Search history as clickable badge buttons

### Infrastructure
- **Redis-backed state** — all game state in Redis for horizontal scalability
- **Redis pub/sub** — decouples event publishing from SocketIO broadcasting
- **Reconnection support** — full state restoration on page reload via `localStorage` + `reconnectRoom` event
- **PID-based process management** — `start.sh` manages backend + frontend lifecycle

## Tech Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Frontend | React 17, React Router 5, Bootstrap 5, SocketIO Client |
| Backend  | Python 3, Flask, Flask-SocketIO     |
| Database | Redis                               |
| API      | api.dictionaryapi.dev (dictionary)  |

## Setup

### Prerequisites
- **Python 3** + `pip`
- **Node.js** + `npm`
- **Redis** (running on `localhost:6379`, or set `REDIS_URL`)

### Quick Start
```bash
# Install backend dependencies
pip install -r backend/requirements.txt

# Install frontend dependencies
cd frontend && npm install && cd ..

# Start Redis (if not running)
redis-server

# Run the project
bash start.sh
```

The backend starts on port **5001**, the frontend dev server on port **3000**.

### Manual Start
```bash
# Backend
python backend/main.py &

# Frontend
cd frontend && npm start &
```

## Project Structure

```
WordSpell/
├── backend/
│   ├── main.py              # Flask-SocketIO server (events, threads, helpers)
│   ├── redis_client.py      # Redis connection singleton
│   ├── requirements.txt     # Python dependencies
│   └── Classes/
│       └── Room.py          # Game logic (grid, turns, word validation, scoring)
├── frontend/
│   ├── public/
│   │   ├── index.html       # HTML template (Bootstrap CDN, Google Fonts)
│   │   └── custom.css       # Custom styles (grid, sidebar, chat, responsive)
│   └── src/
│       ├── App.js           # Root component with router + reconnection
│       ├── index.js         # Entry point (SocketIO client, BrowserRouter)
│       └── Components/
│           ├── Main.jsx     # Game room layout (sidebar, grid, turn info)
│           ├── Game.jsx     # NxN grid + claim phase interaction
│           ├── RoomOptions.jsx  # Lobby (create/join room tabs)
│           ├── ScoreSection.jsx # Sidebar tab container
│           ├── ScoreBoard.jsx   # Player score cards
│           ├── Chat.jsx     # Real-time chat panel
│           ├── InfromationSection.jsx  # Word lookup panel
│           ├── Header.jsx   # Navbar
│           └── Footer.jsx   # Footer
├── start.sh                 # Process manager (install, start, kill)
├── .gitignore
└── README.md
```

## Game Rules

1. Players take turns placing **one letter** in an empty grid cell.
2. After placing, the player has **15 seconds** to claim a word that includes their new letter.
3. The word must be in a **straight line** (row, column, or diagonal) through the placed letter.
4. The word must be a **valid English word** (verified via Dictionary API).
5. Score = **number of letters** in the claimed word.
6. If the player skips or the timer expires, the turn passes to the next player.
7. Chat is available at all times; any player can look up any word in the dictionary.
