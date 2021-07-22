import React, { useState } from 'react';
import { Redirect } from "react-router-dom";

import {Navbar, Nav, Button} from 'react-bootstrap';

import logo from '../images/sw-logo.png';

function Home(props) {
    const {loading, page, demo, disableDemo} = props;
    
    const [goToHome, setGoToHome] = useState(false);
    const [goToLive, setGoToLive] = useState(false);
    const [goToLogs, setGoToLogs] = useState(false);
    const [goToAnalytics, setGoToAnalytics] = useState(false);
    const [goToSettings, setGoToSettings] = useState(false);

    // const [atHome, setAtHome] = useState(true);
    // const [atLive, setAtLive] = useState(false);
    // const [atLogs, setAtLogs] = useState(false);
    // const [atAnalytics, setAtAnalytics] = useState(false);
    // const [atSettings, setAtSettings] = useState(false);

    //const jsonMessage = JSON.parse(messageIn);
    if(goToHome) {
        return ( <Redirect to='/'/> );
    } else if(goToLive) {
        return ( <Redirect to='/live'/> );
    } else if(goToLogs) {
        return ( <Redirect to='/logs'/> );
    } else if(goToAnalytics) {
        return ( <Redirect to='/analytics'/> );
    } else if(goToSettings) {
        return ( <Redirect to='/settings'/> );
    } else {
        return (
            <Navbar collapseOnSelect expand="sm" className="eastech-blue">
                <Navbar.Brand className="text-light">
                    <img src={logo}/>
                    Sewer Watch
                </Navbar.Brand>
                {demo ? <Button className="btn-secondary" onClick={() => {disableDemo();}}>Exit Demo</Button> : null }
                <Navbar.Toggle aria-controls="navbar-collapse" />
                <Navbar.Collapse id="navbar-collapse">
                    <Nav className="ml-auto">
                        <Nav.Link disabled={loading || page == 'home'} className="text-light" onClick={() => {setGoToHome(true)}}>Home</Nav.Link>
                        <Nav.Link disabled={loading || page == 'live'} className="text-light" onClick={() => {setGoToLive(true)}}>Live</Nav.Link>
                        <Nav.Link disabled={loading || page == 'logs'} className="text-light" onClick={() => {setGoToLogs(true)}}>Logs</Nav.Link>
                        <Nav.Link disabled={loading || page == 'analytics'} className="text-light" onClick={() => {setGoToAnalytics(true)}}>Analytics</Nav.Link>
                        <Nav.Link disabled={loading || page == 'settings'} className="text-light" onClick={() => {setGoToSettings(true)}}>Settings</Nav.Link>
                    </Nav>
                </Navbar.Collapse>
            </Navbar>
        );
    }
}

export default Home;
