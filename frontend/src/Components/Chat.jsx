import React, { useEffect, useState } from 'react'
import { ArrowRight, ArrowRightCircle } from 'react-bootstrap-icons';

export default function Chat(props) {

    const [chats, setChats] = useState([])
    const [message, setMessage] = useState("")
    const [user, setUser] = useState(props.data.playerName);
    const client = props.connection

    useEffect(() => {
        window.addEventListener('load', () => {
            // console.log(document.getElementById("message-box").style.height)
            document.getElementById("input-area").style.height = document.getElementById("message-box").style.height
        })
        client.on("chatResponse", (data) => {
            setChats(data)
        })
    }, [])

    const adjustHeight = (el) => {
        var temp = null
        if (el.target.scrollHeight > el.target.clientHeight) {
            if (el.target.scrollHeight < 70) {
                temp = (el.target.scrollHeight) + "px"
            } else {
                temp = "70px"
            }
        } else {
            temp = "30px"
        }
        el.target.style.height = temp
        el.target.style.bottom = "0px"
    }

    const findColor = (sender)=>{
        let color = ""
        props.data["playerData"].forEach(player=>{
            // console.log(player, sender, player.name==sender)
            if(player.name == sender){
                color = player.color
            }
        })
        // console.log(color)
        return color
    }
    return (
        <div className="chat">
            <div className="message-area" id="message-area">{chats.map(item => {
                if (item.Sender != user) {
                    return (
                        <div className="message d-flex justify-content-start" style={{ justifyItems: "left" }}>
                            <div class="card">
                                <div className="card-header px-1 d-flex" style={{backgroundColor:findColor(item.Sender)}}>
                                    <div className="w-75">
                                        {item.Sender}
                                    </div>
                                    <div className="w-25" style={{ textAlign: 'right' }}>
                                        {new Date(item.Time).getHours()}:{new Date(item.Time).getMinutes()}
                                    </div>
                                </div>
                                <div className="card-body">
                                    <p className="card-text">{item.Message}</p>
                                </div>
                            </div>
                        </div>
                    )
                } else {
                    return (
                        <div className="message d-flex justify-content-end" style={{ justifyItems: "right" }}>
                            <div class="card">
                                <div className="card-header px-1 d-flex" style={{backgroundColor:findColor(item.Sender)}}>
                                    <div className="w-75">
                                        {item.Sender}
                                    </div>
                                    <div className="w-25" style={{ textAlign: 'right' }}>
                                        {new Date(item.Time).getHours()}:{new Date(item.Time).getMinutes()}
                                    </div>
                                </div>
                                <div className="card-body">
                                    <p className="card-text">{item.Message}</p>
                                </div>
                            </div>
                        </div>
                    )
                }
            })}</div>
            <div className="input-area pt-1" id="input-area">
                <textarea id="message-box" rows="1" onChange={(e) => {
                    adjustHeight(e);
                    setMessage(e.target.value)
                }}></textarea>
                <button className="btn btn-unique p-0"
                    style={{ zIndex: 2 }}
                    onClick={() => {
                        // console.log("clicked")
                        // setChats([...chats, {Time: new Date(), Sender: message.split(" ")[0], Message:message.split(" ")[1]}])
                        // setMessage(message+"\n")
                        // console.log(props)
                        client.emit("chat", props.data['roomId'], {
                            Time: new Date(),
                            Sender: user,
                            Message: message
                        })
                    }}>
                    <ArrowRightCircle
                        color="green"
                        size={30}>
                    </ArrowRightCircle>
                </button>
            </div>
        </div>
    )
}
