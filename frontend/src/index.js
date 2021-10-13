import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import io, { Socket } from 'socket.io-client'

const client = io('http://127.0.0.1:5000/')
// client.on("connect", ()=>{
//   client.send({sender: "gaurav"})
// })
// client.on("messageResponse", (msg)=>{
//   console.log(msg)
// })

client.connect()

ReactDOM.render(
  <React.StrictMode>
    <App client = {client}/>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
