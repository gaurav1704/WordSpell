import React, { useState, useEffect, useRef } from 'react'
import Game from './Game'
import InfromationSection from './InfromationSection'
import ScoreSection from './ScoreSection'
import './Main.css'
import RoomOptions from './RoomOptions'

export default function Main(props) {
    const [copied, setCopied] = useState(false)
    const [currentPlayer, setCurrentPlayer] = useState(props.data.currentPlayer || "")
    const [deadline, setDeadline] = useState(props.data.deadline || 0)
    const [remaining, setRemaining] = useState(0)
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [playerData, setPlayerData] = useState(props.data.playerData || [])
    const intervalRef = useRef(null)
    const myName = props.data.playerName || ""

    useEffect(() => {
        const turnHandler = (data) => {
            setCurrentPlayer(data.currentPlayer)
            setDeadline(data.deadline)
        }
        const claimHandler = (data) => {
            if (data.playerData) setPlayerData(data.playerData)
        }
        props.connection.on("turnUpdate", turnHandler)
        props.connection.on("wordClaimed", claimHandler)
        return () => {
            props.connection.off("turnUpdate", turnHandler)
            props.connection.off("wordClaimed", claimHandler)
        }
    }, [])

    useEffect(() => {
        if (intervalRef.current) clearInterval(intervalRef.current)
        if (deadline) {
            setRemaining(Math.max(0, Math.floor(deadline - Date.now() / 1000)))
            intervalRef.current = setInterval(() => {
                setRemaining(Math.max(0, Math.floor(deadline - Date.now() / 1000)))
            }, 1000)
        }
        return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
    }, [deadline])

    const copyRoomId = () => {
        navigator.clipboard.writeText(props.data.roomId)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const isMyTurn = currentPlayer === myName

    return (
        <div className="main-wrapper">
            <div className="room-info-bar d-flex align-items-center justify-content-between px-3 py-2 bg-light border-bottom flex-wrap gap-2">
                <div className="d-flex align-items-center gap-2">
                    <button className="btn btn-sm btn-outline-secondary me-1" onClick={() => setSidebarOpen(s => !s)} title="Toggle sidebar">
                        {sidebarOpen ? "\u2715" : "\u2630"}
                    </button>
                    <span className="fw-bold">Room:</span>
                    <code className="bg-dark text-light px-2 py-1 rounded small">{props.data.roomId}</code>
                    <button className="btn btn-sm btn-outline-secondary py-0" onClick={copyRoomId}>
                        {copied ? "Copied!" : "Copy"}
                    </button>
                </div>
                <div className="d-flex align-items-center gap-3">
                    <span className={`badge ${isMyTurn ? 'bg-success' : 'bg-secondary'} fs-6`}>
                        {isMyTurn ? `Your turn` : `${currentPlayer}'s turn`}
                        {remaining > 0 && ` (${remaining}s)`}
                    </span>
                    <span className="text-muted small">
                        {playerData.length} player{playerData.length > 1 ? 's' : ''}
                    </span>
                </div>
            </div>
            <div className={`main container-100 ${sidebarOpen ? '' : 'sidebar-collapsed'}`}>
                <section className={`score-section-wrap ${sidebarOpen ? '' : 'collapsed'}`}>
                    <ScoreSection connection={props.connection} data={{...props.data, playerData}}></ScoreSection>
                </section>
                <section className="game-section">
                    <Game connection={props.connection} data={props.data} currentPlayer={currentPlayer} playerHash={props.data.playerHash}></Game>
                </section>
            </div>
        </div>
    )
}
