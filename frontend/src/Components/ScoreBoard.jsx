import React from 'react'
import './Main.css'

export default function ScoreBoard(props) {
    console.log(props.data.playerData)
    return (
        <div style={{display:'flex', flexWrap:'wrap'}} >
            {
                props.data.playerData.map(player => {
                    return (
                        <div class="card" style={{width: 'calc(50% - 20px)', margin:'10px'}}>
                            <div className="card-header px-1 text-center" style={{backgroundColor:player.color, color: "black", textOverflow:'ellipsis', whiteSpace:'nowrap', overflow:'hidden'}}>
                                {player.name}
                            </div>
                            <div className="card-body">
                                <div className="card-text">Score - {player.score}</div>
                            </div>
                        </div>
                    )
                })
            }
        </div>
    )
}
