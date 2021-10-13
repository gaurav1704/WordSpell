import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom';

import Main from './Main'

export default function RoomOptions(props) {
    const [selected, setselected] = useState("join")
    const [numPlayers, setNumPlayers] = useState(2)
    const [gridSize, setGridSize] = useState(5)
    const [name, setName] = useState("")
    const [roomId, setRoomId] = useState("")
    const client = props.connection

    useEffect(() => {
        client.on("roomCreated", (response) => {
            ReactDOM.render(<Main connection={client} data={response}></Main>, document.getElementById("main"))
        })
        client.on("roomJoined", (response) => {
            ReactDOM.render(<Main connection={client} data={response}></Main>, document.getElementById("main"))
        })
    }, [])

    const renderSwitch = () => {
        switch (selected) {
            case "join": return (
                <div className="room-input">
                    <div class="input-group">
                        <div class="input-group-prepend">
                            <span class="input-group-text" >Your Name</span>
                        </div>

                        <input type="text" class="form-control" value={name} placeholder="Enter name here"  onChange={(e)=>{setName(e.target.value)}} required />
                    </div>  
                    <div class="input-group">
                        <div class="input-group-prepend">
                            <span class="input-group-text" >Room</span>
                        </div>
                        <input type="text" class="form-control" value={roomId}  placeholder="Room Id"  onChange={(e)=>{setRoomId(e.target.value)}} required />
                    </div>
                                      
                    
                    <div class="col text-center">
                        <button class="btn btn-success btn-center" onClick={()=>{
                            console.log(gridSize, numPlayers, name)
                            localStorage.setItem('playername', name)
                            client.emit("joinRoom", name, roomId)
                        }}>Join Room</button>
                    </div>
                </div>
            )
            case "create": return (
                <div className="room-input">
                    <div class="input-group">
                        <div class="input-group-prepend">
                            <span class="input-group-text" >Your Name</span>
                        </div>
                        <input type="text" class="form-control" value={name}  placeholder="Player Name"  onChange={(e)=>{setName(e.target.value)}} required />
                    </div>
                    <div class="input-group">
                        <div class="input-group-prepend">
                            <span class="input-group-text" >Number Of Players</span>
                        </div>
                        <select class="custom-select" onChange={(e)=>setNumPlayers(parseInt(e.target.value))} required>
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="4">4</option>
                            <option value="5">5</option>
                        </select>
                    </div>
                    <div class="input-group">
                        <div class="input-group-prepend">
                            <span class="input-group-text" >Grid Size</span>
                        </div>
                        <select class="custom-select" onChange={(e)=>setGridSize(parseInt(e.target.value))} required>
                            <option value="5">5</option>
                            <option value="6">6</option>
                            <option value="7">7</option>
                            <option value="8">8</option>
                            <option value="9">9</option>
                            <option value="10">10</option>
                        </select>
                    </div>
                    <div class="col text-center">
                        <button class="btn btn-success btn-center" onClick={()=>{
                            console.log(gridSize, numPlayers, name)
                            client.emit("createRoom", numPlayers, name, gridSize)
                        }}>Submit form</button>
                    </div>
                </div>
            )
        }
    }

    return (
        <div className="room-options">
            <div className="option-area">
                <ul className="nav nav-tabs">
                    <li className="nav-item nav-item-2">
                        <a className={selected == "join" ? "nav-link active selected" : "nav-link"} href="#" onClick={() => setselected("join")}>Join Room</a>
                    </li>
                    <li className="nav-item nav-item-2">
                        <a className={selected == "create" ? "nav-link active selected" : "nav-link"} href="#" onClick={() => setselected("create")}>Create Room</a>
                    </li>
                </ul>
                {
                    renderSwitch()
                }
            </div>
        </div>
    )
}
