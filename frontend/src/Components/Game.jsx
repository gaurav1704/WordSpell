import React, { Component } from 'react'

export default class Game extends Component {
    constructor(props){
        super(props)
        this.state = {
            roomId: props.data.roomId,
            grid: props.data.gameData.length,
            gameData: props.data.gameData,
            width: null
        }
        this.client = props.connection
        this.client.on("updateBoardResponse", (data) => {
            console.log(data)
            this.setState({
                gameData: data.gameData
            })
            document.getElementById(`${data.i} ${data.j}`).disabled = true
        })
    }
    componentDidMount(){
        window.addEventListener('resize', () =>{
            let width = this.calcWidth()
            this.setState({
                width : width
            })
        })
        this.updateBoard()
    }

    updateBoard(){
        // let temp = this.state.gameData
        let width = this.calcWidth()
        // for (let i=0; i < this.state.grid; i++){
        //     let temp1 = []
        //     for (let j=0; j < this.state.grid; j++){
        //         temp1.push('')
        //     }
        //     temp.push(temp1)
        //     if( i == this.state.grid -1){
                this.setState({
                    width:width
                })
        //     }
        // }
    }

    calcWidth(){
        let width = null
        if (window.innerWidth >= 768){
            width = (window.innerWidth - 0.25 * window.innerWidth - 40) / this.state.grid
        }else{
            width = (window.innerWidth - 50) / this.state.grid
        }
        let height = (window.innerHeight*0.9 - 100) / this.state.grid
        if (width < height){
            return width
        }  
        else {
            return height
        }

    }

    render() {
        let i=0;
        if (this.state.gameData == null)
            return <div></div>
        return (
            <div className="game">
                <div className="text-center m-auto">
                    {
                        this.state.gameData.map(row => {
                            return(
                                <div style={{height: `${this.state.width}px`}}>
                                    {
                                        row.map(cell => 
                                            <input type = "text" 
                                                id={`${parseInt(i/this.state.grid)} ${(i++)%this.state.grid}`}
                                                style={{
                                                    width:`${this.state.width}px`, 
                                                    height:`${this.state.width}px`, 
                                                    color:'black',
                                                    fontSize:`${this.state.width}px`
                                                }}
                                                onChange={(e) => {
                                                    let ind = e.target.id.split(" ")
                                                    console.log(parseInt(ind[0]), parseInt(ind[1]))
                                                    this.client.emit("updateBoard", this.state.roomId, e.target.value.toUpperCase(), parseInt(ind[0]), parseInt(ind[1]))
                                                    e.target.disabled = true; 
                                                }}
                                                value = {cell}
                                                onMouseEnter = {(e) => e.target.style.backgroundColor = "rgb(35, 247, 28)"}
                                                onMouseLeave = {(e) => e.target.style.backgroundColor = ""}
                                            ></input>
                                        )
                                    }
                                </div>
                            )
                        })
                    }
                </div>
            </div>
        )
    }
}

