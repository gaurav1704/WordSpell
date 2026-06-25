import React, { useState, useEffect } from 'react'

export default function InfromationSection(props) {
    const [words, setWords] = useState([])
    const [selected, setSelected] = useState(null)
    const [input, setInput] = useState("")
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        props.connection.on("wordLookupResponse", (data) => {
            setLoading(false)
            setWords(prev => {
                if (prev.find(w => w.word === data.word)) return prev
                return [data, ...prev]
            })
            setSelected(data)
        })
    }, [])

    const lookup = () => {
        const word = input.trim().toLowerCase()
        if (!word) return
        setLoading(true)
        props.connection.emit("lookupWord", props.data.roomId, word)
        setInput("")
    }

    const handleKey = (e) => {
        if (e.key === "Enter") lookup()
    }

    return (
        <div className="p-2" style={{ maxHeight: "60vh", overflowY: "auto" }}>
            <div className="input-group mb-2">
                <input
                    type="text"
                    className="form-control"
                    placeholder="Look up a word..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKey}
                />
                <button className="btn btn-success" onClick={lookup} disabled={loading}>
                    {loading ? "..." : "Search"}
                </button>
            </div>

            {words.length === 0 && !selected && (
                <p className="text-muted text-center small mt-3">
                    Search words to see their meanings here.
                </p>
            )}

            {words.length > 0 && (
                <div className="mb-2 d-flex flex-wrap gap-1">
                    {words.map((w, i) => (
                        <span
                            key={i}
                            className={`badge ${w.found ? "bg-primary" : "bg-secondary"} ${selected?.word === w.word ? "opacity-100" : "opacity-75"}`}
                            style={{ cursor: "pointer" }}
                            onClick={() => setSelected(w)}
                        >
                            {w.word}
                        </span>
                    ))}
                </div>
            )}

            {selected && (
                <div className="card">
                    {selected.found && selected.data ? (
                        <div className="card-body">
                            <h5 className="card-title">{selected.data.word}</h5>
                            {selected.data.phonetic && (
                                <span className="text-muted small">{selected.data.phonetic}</span>
                            )}
                            {selected.data.meanings.map((m, i) => (
                                <div key={i} className="mt-2">
                                    <em className="text-success small">{m.partOfSpeech}</em>
                                    {m.definitions.slice(0, 2).map((d, j) => (
                                        <div key={j} className="ms-2 mt-1">
                                            <p className="mb-0 small">{d.definition}</p>
                                            {d.example && (
                                                <p className="mb-0 text-muted small fst-italic">
                                                    "{d.example}"
                                                </p>
                                            )}
                                            {d.synonyms && d.synonyms.length > 0 && (
                                                <p className="mb-0 small">
                                                    <span className="text-info">Synonyms: </span>
                                                    {d.synonyms.slice(0, 4).join(", ")}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="card-body text-center text-muted">
                            "{selected.word}" not found in dictionary.
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
