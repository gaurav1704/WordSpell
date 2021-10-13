import logo from './logo.svg';
import './App.css';
import { client, w3cwebsocket as W3CWebSocket } from "websocket";
import React, { Component } from 'react'
import { BrowserRouter, Route, Link } from "react-router-dom";
import Header from './Components/Header';
import Footer from './Components/Footer';
import Main from './Components/Main';
import RoomOptions from './Components/RoomOptions';


export default class App extends Component {
  constructor(props){
    super(props)
    this.client = props.client
    
  }
  // componentDidMount(){
  //   client.on("connect", () => {
  //     client.send("web socket client connected")
  //   })
  //   client.connect()
  // }
  render() {
    return (
      <div>
        <Header></Header>
        <div id="main">
          <RoomOptions connection={this.client}></RoomOptions>
        </div>        
        <Footer></Footer>
      </div>
    )
  }
}

