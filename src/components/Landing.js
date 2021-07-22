import React, { useState, useEffect, useContext } from 'react';

import {Button, Container, Row, Col, Modal} from 'react-bootstrap';

import logo from '../images/sw-logo-large.png';

import SocketContext from '../context/WebSocketContext';

const ipcRenderer = window.ipcRenderer;

function Landing(props) {
    const {enableDemo} = props;
    const { ws, conn, send, newMessage, open, close } = useContext(SocketContext);
    const [showOptions, setShowOptions] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    
    useEffect(() => {
        const retryButtonTimeout = setTimeout(() => {
            setShowOptions(true);
        }, 10000);

        return () => {
            clearTimeout(retryButtonTimeout);
        }
    }, []);

    var connectionStatus = "Loading..."
    switch (conn) {
        case WebSocket.OPEN:
            connectionStatus = "Connected"
            break;
        case WebSocket.CONNECTING:
        case WebSocket.CLOSING:
        case WebSocket.CLOSED:
            connectionStatus = "Not Connected"
            break;
    
        default:
            connectionStatus = "Not Connected"
            break;
    }

    const openLegacyApp = () => {
        console.log("Calling OpenLegacyApp");
        ipcRenderer.send('OpenLegacyApp');
    }

    return (
        <>
        <div className="background vh-100">
            <Container className="h-100">
                <Row className="h-100">
                    <Col xs={3}></Col>
                    <Col xs={6}>
                        <img className="d-block mx-auto mt-5" src={logo}/> 
                        <div className="mx-auto text-center">
                            <h3 className="text-light text-center d-inline mt-4">{connectionStatus}</h3> 
                        </div>
                        <Button className="btn-lg btn-blue d-block w-50 mx-auto mt-2" href="/">Retry Connection</Button>
                        <Button className="btn-lg btn-blue d-block w-50 mx-auto mt-2" onClick={() => {openLegacyApp()}}>On-Device App</Button>
                            
                        {/* { showOptions &&
                            <>
                            <Button className="btn-lg btn-blue d-block w-50 mx-auto mt-2" href="/">Retry Connection</Button>
                            <Button className="btn-lg btn-blue d-block w-50 mx-auto mt-2" onClick={() => {openLegacyApp()}}>On-Device App</Button>
                            </>
                        } */}
                    </Col>
                    <Col xs={3} className="d-flex align-items-end">
                        <Button className="btn-blue mb-2 ml-auto" onClick={ () => setShowHelp(true) }>Help</Button>  
                        <Button className="btn-blue d-flex mb-2 ml-4" onClick={() => enableDemo()}>Demo</Button>
                    </Col>
                </Row>
            </Container>
        </div>

        <Modal
            show={showHelp}
            backdrop='static' 
            size="lg"
            aria-labelledby="contained-modal-title-vcenter"
            centered
        >
            <Modal.Header>
                <Modal.Title id="contained-modal-title-vcenter">
                    Help
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <ul>
                    <li><h5>Check WiFi Connection</h5></li>
                    <ul>
                        <li>Make sure that your computer is connected to the iTracker's WiFi network. Typically the SSID is 'iTracker'</li>
                    </ul>
                    <li><h5>iTracker Version</h5></li>
                    <ul>
                        <li>Sewer Watch Desktop supports iTrackers with firmware version 4.1.5 and up.</li>
                        <li>If you are trying to connect to an older version of firmware, click the button below to open Sewer Watch in the on-device web app.</li>
                        <Button className="btn-blue" onClick={() => { openLegacyApp() }}>On-Device App</Button>
                    </ul>
                </ul>

                
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={() => {setShowHelp(false)} }>Close</Button>
            </Modal.Footer>
        </Modal>
        </>
    );
    
}

export default Landing;

