import React, { useState } from 'react'
import Chat from './Chat'
import InfromationSection from './InfromationSection'
import ScoreBoard from './ScoreBoard'

export default function ScoreSection(props) {
    const [selected, setselected] = useState("chat")  
    console.log(props.user) 

    const renderSwitch = ()=>{
        switch(selected){
            case "score": return (<ScoreBoard connection={props.connection} data={props.data}></ScoreBoard>)
            case "chat": return (<Chat connection={props.connection} data={props.data}></Chat>)
            case "words": return (<InfromationSection></InfromationSection>)
        }
    }

    return (
        <div className="score-section">
            <ul className="nav nav-tabs">
                <li className="nav-item nav-item-3">
                    <a className={selected == "score"? "nav-link active selected" : "nav-link"} href="#" onClick={()=>setselected("score")}>Score</a>
                </li>
                <li className="nav-item nav-item-3">
                    <a className={selected == "chat"? "nav-link active selected" : "nav-link"} href="#" onClick={()=>setselected("chat")}>Chat</a>
                </li>
                <li className="nav-item nav-item-3">
                    <a className={selected == "words"? "nav-link active selected" : "nav-link"} href="#" onClick={()=>setselected("words")}>Words</a>
                </li>
            </ul>
            {
                renderSwitch()
            }
        </div>
    )
}
