import React from 'react'
import Game from './Game'
import InfromationSection from './InfromationSection'
import ScoreSection from './ScoreSection'
import './Main.css'
import RoomOptions from './RoomOptions'

export default function Main(props) {
    console.log(props)
    return (
        <div className="main container-100">
                <section className="">
                    <ScoreSection connection={props.connection} data={props.data}></ScoreSection>
                </section>
                <section className="">
                    {/* <RoomOptions connection={props.connection}></RoomOptions> */}
                    <Game connection={props.connection} data={props.data}></Game>
                </section>
                
        </div>
    )
}
