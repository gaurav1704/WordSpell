import './App.css';
import Header from './Components/Header';
import Footer from './Components/Footer';
import Main from './Components/Main';
import RoomOptions from './Components/RoomOptions';
import { Switch, Route, Redirect, useHistory, useLocation } from 'react-router-dom'
import { useEffect, useState, useRef, useCallback } from 'react'

export default function App(props) {
  const client = props.client
  const [gameData, setGameData] = useState(null)
  const [reconnectFailed, setReconnectFailed] = useState(false)
  const history = useHistory()
  const location = useLocation()
  const navigating = useRef(false)

  useEffect(() => {
    client.on("roomReconnected", (data) => {
      setReconnectFailed(false)
      setGameData(data)
    })
    client.on("reconnectError", () => {
      localStorage.removeItem("wordspell_game")
      setReconnectFailed(true)
    })
    return () => {
      client.off("roomReconnected")
      client.off("reconnectError")
    }
  }, [client])

  const startGame = useCallback((data) => {
    navigating.current = true
    setGameData(data)
    localStorage.setItem("wordspell_game", JSON.stringify({
      roomId: data.roomId,
      playerHash: data.playerHash
    }))
    history.push(`/room/${data.roomId}/${data.playerHash}`, { gameData: data })
  }, [history])

  useEffect(() => {
    const match = location.pathname.match(/^\/room\/([^/]+)\/([^/]+)$/)
    if (match && !navigating.current) {
      const [, roomId, playerHash] = match
      const saved = localStorage.getItem("wordspell_game")
      const savedHash = saved ? JSON.parse(saved).playerHash : null
      if (savedHash !== playerHash) {
        localStorage.setItem("wordspell_game", JSON.stringify({ roomId, playerHash }))
      }
      const tryReconnect = () => client.emit("reconnectRoom", roomId, playerHash)
      if (client.connected) {
        tryReconnect()
      } else {
        client.once("connect", tryReconnect)
      }
    }
    navigating.current = false
  }, [location.pathname, client])

  return (
    <Switch>
      <Route path="/home">
        <Header />
        <RoomOptions connection={client} onGameStart={startGame} />
        <Footer />
      </Route>
      <Route path="/room/:roomId/:playerHash" render={(routeProps) => {
        const { playerHash, roomId } = routeProps.match.params
        const routeState = location.state?.gameData
        const data = gameData || routeState
        if (!data || data.roomId !== roomId) {
          if (reconnectFailed) {
            return (
              <div>
                <Header />
                <div className="text-center mt-5">
                  <h3>Connection failed</h3>
                  <p className="text-muted">Room not found or unable to reconnect.</p>
                  <button className="btn btn-primary" onClick={() => history.push("/home")}>
                    Back to Home
                  </button>
                </div>
                <Footer />
              </div>
            )
          }
          return (
            <div>
              <Header />
              <div className="text-center mt-5"><h3>Reconnecting...</h3></div>
              <Footer />
            </div>
          )
        }
        return (
          <div>
            <Header />
            <Main connection={client} data={{...data, playerHash}} />
            <Footer />
          </div>
        )
      }} />
      <Redirect from="/" to="/home" />
    </Switch>
  )
}
