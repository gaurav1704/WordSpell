import React, { Component } from 'react'

export default class Game extends Component {
    constructor(props) {
        super(props)
        this.state = {
            roomId: props.data.roomId,
            grid: props.data.gameData.length,
            gameData: props.data.gameData,
            width: null,
            myName: props.data.playerName || "",
            claimMode: false,
            lastCell: null,
            claimDeadline: 0,
            claimRemaining: 0,
            claimWord: "",
            claimError: "",
            claimSuccess: null,
            claimStart: null,
            claimCells: [],
            highlightCells: []
        }
        this.playerHash = props.playerHash || props.data.playerHash || ""
        this.claimTimerRef = null
        this.client = props.connection
        this.client.on("updateBoardResponse", (data) => {
            this.setState({ gameData: data.gameData })
        })
        this.client.on("claimPhase", (data) => {
            const isOwn = data.playerHash === this.playerHash
            if (isOwn) {
                this.enterClaimMode(data)
            }
        })
        this.client.on("wordClaimed", (data) => {
            this.setState({
                claimMode: false,
                lastCell: null,
                claimStart: null,
                claimCells: [],
                highlightCells: [],
                claimSuccess: data,
                claimError: ""
            })
            if (this.claimTimerRef) clearInterval(this.claimTimerRef)
        })
        this.client.on("claimError", (data) => {
            this.setState({ claimError: data.error, claimSuccess: null })
        })
    }

    enterClaimMode(data) {
        this.setState({
            claimMode: true,
            lastCell: { i: data.i, j: data.j },
            claimDeadline: data.deadline,
            claimRemaining: Math.max(0, Math.floor(data.deadline - Date.now() / 1000)),
            claimWord: "",
            claimError: "",
            claimSuccess: null,
            claimStart: null,
            claimCells: [],
            highlightCells: []
        })
        this.startClaimTimer(data.deadline)
    }

    startClaimTimer(deadline) {
        if (this.claimTimerRef) clearInterval(this.claimTimerRef)
        this.claimTimerRef = setInterval(() => {
            const remaining = Math.max(0, Math.floor(deadline - Date.now() / 1000))
            this.setState({ claimRemaining: remaining })
            if (remaining <= 0) {
                clearInterval(this.claimTimerRef)
                this.setState({
                    claimMode: false, lastCell: null,
                    claimStart: null, claimCells: [], highlightCells: []
                })
            }
        }, 1000)
    }

    componentWillUnmount() {
        if (this.claimTimerRef) clearInterval(this.claimTimerRef)
    }

    componentDidMount() {
        window.addEventListener('resize', () => {
            this.setState({ width: this.calcWidth() })
        })
        this.updateBoard()
    }

    updateBoard() {
        this.setState({ width: this.calcWidth() })
    }

    calcWidth() {
        let width = null
        if (window.innerWidth >= 768) {
            width = (window.innerWidth - 0.25 * window.innerWidth - 40) / this.state.grid
        } else {
            width = (window.innerWidth - 50) / this.state.grid
        }
        let height = (window.innerHeight * 0.9 - 100) / this.state.grid
        return width < height ? width : height
    }

    handleCellChange(e, rowIdx, colIdx) {
        const val = e.target.value.toUpperCase()
        if (val.length > 1) return
        if (val === '') return
        this.client.emit("updateBoard",
            this.state.roomId, val, rowIdx, colIdx, this.playerHash
        )
        e.target.disabled = true
    }

    handleCellClick(rowIdx, colIdx) {
        if (!this.state.claimMode) return
        const { claimStart, lastCell } = this.state
        const ai = lastCell.i, aj = lastCell.j
        const size = this.state.grid

        if (!claimStart) {
            const si = rowIdx, sj = colIdx
            const sameRow = si === ai
            const sameCol = sj === aj
            const sameDiag = (si - ai) === (sj - aj)

            if (!sameRow && !sameCol && !sameDiag) {
                this.setState({
                    claimError: "Must share the same row, column, or diagonal (top-left to bottom-right) as your new letter"
                })
                return
            }

            let lineCells = []
            if (sameRow) {
                for (let c = 0; c < size; c++) lineCells.push({ i: si, j: c })
            } else if (sameCol) {
                for (let r = 0; r < size; r++) lineCells.push({ i: r, j: sj })
            } else {
                let dr = Math.min(si, ai), dc = Math.min(sj, aj)
                while (dr > 0 && dc > 0) { dr--; dc-- }
                while (dr < size && dc < size) {
                    lineCells.push({ i: dr, j: dc })
                    dr++; dc++
                }
            }

            this.setState({ claimStart: { i: si, j: sj }, highlightCells: lineCells, claimError: "" })
            return
        }

        this.confirmWord(rowIdx, colIdx)
    }

    confirmWord(ei, ej) {
        const { claimStart, lastCell, gameData } = this.state
        const si = claimStart.i, sj = claimStart.j
        const ai = lastCell.i, aj = lastCell.j
        const size = this.state.grid

        const sameRow = si === ei && si === ai
        const sameCol = sj === ej && sj === aj
        const sameDiag = (si - ai) === (sj - aj) && (ei - ai) === (ej - aj)

        if (!sameRow && !sameCol && !sameDiag) {
            this.setState({
                claimError: "Start and end must align with your new letter",
                claimStart: null, highlightCells: []
            })
            return
        }

        let fromR, fromC, toR, toC, dR, dC, steps
        if (sameRow) {
            fromR = si; fromC = Math.min(sj, ej)
            toR = si; toC = Math.max(sj, ej)
            dR = 0; dC = 1; steps = toC - fromC + 1
        } else if (sameCol) {
            fromR = Math.min(si, ei); fromC = sj
            toR = Math.max(si, ei); toC = sj
            dR = 1; dC = 0; steps = toR - fromR + 1
        } else {
            fromR = Math.min(si, ei); fromC = Math.min(sj, ej)
            toR = Math.max(si, ei); toC = Math.max(sj, ej)
            dR = 1; dC = 1; steps = toR - fromR + 1
        }

        const cells = []
        let anchorFound = false
        for (let s = 0; s < steps; s++) {
            const r = fromR + s * dR, c = fromC + s * dC
            cells.push({ i: r, j: c })
            if (r === ai && c === aj) anchorFound = true
        }

        if (!anchorFound) {
            this.setState({
                claimError: "Your new letter must be part of the word",
                claimStart: null, highlightCells: []
            })
            return
        }

        const word = cells.map(c => gameData[c.i][c.j]).join('')
        if (word.length < 2) {
            this.setState({ claimError: "Word must be at least 2 letters" })
            return
        }

        this.setState({ claimCells: cells, claimWord: word, highlightCells: [], claimError: "" })
    }

    handleClaimSubmit() {
        const word = this.state.claimWord.trim().toLowerCase()
        if (word.length < 2) {
            this.setState({ claimError: "Word must be at least 2 letters" })
            return
        }
        this.client.emit("claimWord", this.state.roomId, this.playerHash, word)
    }

    handleSkip() {
        this.client.emit("skipClaim", this.state.roomId, this.playerHash)
        if (this.claimTimerRef) clearInterval(this.claimTimerRef)
        this.setState({
            claimMode: false, lastCell: null,
            claimStart: null, claimCells: [], highlightCells: []
        })
    }

    render() {
        const isMyTurn = this.props.currentPlayer === this.state.myName
        if (this.state.gameData == null) return <div></div>

        const { claimMode, claimStart, claimWord, lastCell, highlightCells, claimCells } = this.state

        const sel = (r, c) => claimCells.some(x => x.i === r && x.j === c)
        const hl = (r, c) => highlightCells.some(x => x.i === r && x.j === c)
        const anchor = (r, c) => lastCell && lastCell.i === r && lastCell.j === c

        return (
            <div>
                {this.state.claimSuccess && !claimMode && (
                    <div className="alert alert-success text-center mb-2 py-2 small">
                        <strong>{this.state.claimSuccess.playerName}</strong> claimed "
                        <strong>{this.state.claimSuccess.word.toUpperCase()}</strong>" for
                        <strong> +{this.state.claimSuccess.score}</strong> points!
                    </div>
                )}
                {claimMode && (
                    <div className="bg-warning bg-opacity-10 border border-warning rounded p-2 mb-2 text-center">
                        <div className="d-flex align-items-center justify-content-center gap-2 flex-wrap">
                            <span className="fw-bold small">
                                {!claimStart
                                    ? "Click the first letter of your word"
                                    : claimWord
                                        ? "Your word is ready"
                                        : "Click the last letter of your word"}
                            </span>
                            {claimWord && (
                                <span className="badge bg-dark fs-6">{claimWord}</span>
                            )}
                            <button className="btn btn-sm btn-success"
                                disabled={!claimWord}
                                onClick={() => this.handleClaimSubmit()}>
                                Claim
                            </button>
                            <button className="btn btn-sm btn-outline-secondary"
                                onClick={() => this.handleSkip()}>
                                Skip
                            </button>
                            <span className="badge bg-dark ms-1">{this.state.claimRemaining}s</span>
                        </div>
                        {this.state.claimError && (
                            <div className="text-danger small mt-1">{this.state.claimError}</div>
                        )}
                    </div>
                )}
                <div className="game">
                    <div className="text-center m-auto">
                        {this.state.gameData.map((row, rowIdx) => (
                            <div key={rowIdx} style={{ height: `${this.state.width}px` }}>
                                {row.map((cell, colIdx) => {
                                    const isSel = sel(rowIdx, colIdx)
                                    const isHl = hl(rowIdx, colIdx)
                                    const isAnchor = anchor(rowIdx, colIdx)
                                    const canEdit = isMyTurn && cell === '' && !claimMode
                                    const isClickable = claimMode

                                    let borderColor, bgColor
                                    if (isSel) {
                                        bgColor = '#c8e6c9'
                                        borderColor = '#2e7d32'
                                    } else if (isHl) {
                                        bgColor = '#fff9c4'
                                        borderColor = '#f9a825'
                                    }
                                    if (isAnchor) {
                                        borderColor = isSel ? '#e65100' : '#28a745'
                                        bgColor = bgColor || '#e8f5e9'
                                    }

                                    return (
                                        <input type="text"
                                            key={rowIdx * this.state.grid + colIdx}
                                            style={{
                                                width: `${this.state.width}px`,
                                                height: `${this.state.width}px`,
                                                color: 'black',
                                                fontSize: `${this.state.width}px`,
                                                border: borderColor ? `3px solid ${borderColor}` : undefined,
                                                backgroundColor: bgColor || undefined,
                                                cursor: claimMode ? 'pointer' : undefined
                                            }}
                                            disabled={!canEdit && !isClickable}
                                            readOnly={!canEdit}
                                            onChange={(e) => this.handleCellChange(e, rowIdx, colIdx)}
                                            onClick={() => this.handleCellClick(rowIdx, colIdx)}
                                            value={cell}
                                        />
                                    )
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }
}
