import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { io } from 'socket.io-client'

const client = io('http://127.0.0.1:5001/', {
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000
})

ReactDOM.render(
    <BrowserRouter>
        <App client={client} />
    </BrowserRouter>,
    document.getElementById('root')
);

reportWebVitals();
