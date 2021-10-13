import React from 'react'

export default function Header() {
    return (
        <nav class="navbar navbar-expand-lg navbar-dark bg-dark" style={{height:"10vh"}}>
            <div class="container-fluid" style={{position:'relative'}}>
                <a class="navbar-brand" href="#">Navbar</a>
                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                    <span class="navbar-toggler-icon"></span>
                </button>
            </div>
        </nav>
    )
}
