import React, { useState, useCallback, useEffect, useRef, useContext } from 'react';
import { Redirect } from "react-router-dom";

import {Container, Row, Col, Card} from 'react-bootstrap';

import liveIcon from '../images/live.png';
import logsIcon from '../images/logs.png';
import analyticsIcon from '../images/chart.png';
import settingsIcon from '../images/cog.png';

import Nav from './Nav';
import SWModal from './Modal';

import SocketContext from '../context/WebSocketContext';

function Home(props) {
    const {demo, disableDemo} = props;
    const { ws, conn, send, newMessage } = useContext(SocketContext);
    const [loading, setLoading] = useState(false);

    const [goToLive, setGoToLive] = useState(false);
    const [goToLogs, setGoToLogs] = useState(false);
    const [goToAnalytics, setGoToAnalytics] = useState(false);
    const [goToSettings, setGoToSettings] = useState(false);

    const [modalShow, setModalShow] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalBody, setModalBody] = useState([]);
    const [submitDisabled, setSubmitDisabled] = useState(false);
    const [closeDisabled, setCloseDisabled] = useState(false);


    const closeModal = () => {
        setModalShow(false);
    }
    
    const submitModal = () => {
        if(demo){
            console.log("Send battery reset")
            console.log({Command: "battery"});
        } else {
            send({Command: "battery"});
        }

        setModalShow(false);
    }

    // Set to one once the component has been loaded
    // Used to clear the message in prop so that leftovers 
    // from other components aren't parsed in this component
    const init = useRef(0);

    const dataIn = useRef('');

    // Uncomment to enable requesting uptime and showing battery reset modal 
    // // Send request for Settings data
    // useEffect(() => {
    //     if(!demo) {
    //         setLoading(true);
    //         send({comm: 6});
    //     } else {
    //         setLoading(false);
    //     }
    // }, []);

    // // Handle new message
    // useEffect(() => {
    //     if(!demo && newMessage !== '' && init.current != 0) {
    //         // Create a reader to parse JSON data from the iTracker.
    //         // Messages from the iTracker handled in handleMessage
    //         var reader = new FileReader();
    //         reader.readAsText(newMessage.data, "UTF-8");
    //         // Reader load finished.
    //         // ReadyState: EMPTY, LOADING, DONE (0,1,2)
    //         reader.onload = function() {
    //             if (reader.readyState == 2)	{
    //                 console.log("reader is ready")
    //                 //console.log("So far we have: " + dataIn);
    //                 dataIn.current = dataIn.current + reader.result;
    //                 // If message is parsed, then the complete JSON message has arrived.
    //                 // Then send json object to handle message function
    //                 try {
    //                     var jsonMessage = JSON.parse(dataIn.current);
    //                     console.log("iTracker sent:" + dataIn.current);
    //                     console.log(jsonMessage);
    //                     setModalTitle("Reset Battery?");
    //                     setModalBody(["It looks like this iTracker was power cycled in the last 10 minutes. If the batteries were replaced, click Submit in order to show an accurate battery level."]);
    //                     setModalShow(true);
    //                     setLoading(false);
    //                     // Clear buffers.
    //                     dataIn.current = "";
    //                 }
    //                 catch {
    //                     console.log("not done yet")
    //                     return;
    //                 }
    //             } else {
    //                 console.log(reader.result);
    //             }
    //             //return reader.result;
    //         };

    //         reader.onabort = function() {
    //             console.log("abort")
    //         }

    //         // Reader errors.
    //         reader.onerror = function() {
    //             console.log(reader.error)
    //         }
    //     } else {
    //         //setMessageIn('');
    //         init.current = 1;
    //     }
    // }, [newMessage]);

    // Handle connection status change
    // useEffect(() => {
    //     if(!demo && connectionStatus === "Closed") {
    //         setGoToHome(true);
    //     }
    // })

    //const jsonMessage = JSON.parse(messageIn);
    if(goToLive) {
        return ( <Redirect to='/live'/> );
    } else if (goToLogs) {
        return ( <Redirect to="/logs"/> );
    } else if (goToAnalytics) {
        return ( <Redirect to="/analytics"/> );
    } else if (goToSettings) {
        return ( <Redirect to="/settings"/> );
    } else {
        return (
            <>
            <Nav loading={loading} page="home" demo={demo} disableDemo={disableDemo} />
            <div className="background vh-100">
                <Container>
                    <Row>
                        <Col xs={12} md={6} className="mt-4">
                            <Card onClick={() => {setGoToLive(true)} } className="home-tile background-secondary">
                                <img className="mx-auto mt-2" src={liveIcon}/>
                                <Card.Body>
                                    <Row>
                                        <Col>
                                            <Card.Title className="text-light"><h3>Live Data</h3></Card.Title>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col>
                                            <Card.Text className="text-light">View live data from the connected iTracker</Card.Text>
                                            
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col xs={12} md={6} className="mt-4">
                            <Card onClick={() => setGoToLogs(true) } className="home-tile background-secondary">
                                <img className="mx-auto mt-2" src={logsIcon}/>
                                <Card.Body>
                                    <Row>
                                        <Col>
                                            <Card.Title className="text-light"><h3>Logs</h3></Card.Title>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col>
                                            <Card.Text className="text-light">Download logs from the connected iTracker</Card.Text>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                    <Row>
                        <Col xs={12} md={6} className="mt-4">
                            <Card onClick={() => setGoToAnalytics(true) } className="home-tile background-secondary">
                                <img className="mx-auto mt-2" src={analyticsIcon}/>
                                <Card.Body>
                                    <Row>
                                        <Col>
                                            <Card.Title className="text-light"><h3>Analytics</h3></Card.Title>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col>
                                            <Card.Text className="text-light">View graphed data from the connected iTracker</Card.Text>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col xs={12} md={6} className="mt-4">
                            <Card onClick={() => setGoToSettings(true) } className="home-tile background-secondary">
                                <img className="mx-auto mt-2" src={settingsIcon}/>
                                <Card.Body>
                                    <Row>
                                        <Col>
                                            <Card.Title className="text-light"><h3>Settings</h3></Card.Title>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col>
                                            <Card.Text className="text-light">Edit settings for the connected iTracker</Card.Text>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
            <SWModal show={modalShow} backdrop='static' title={modalTitle} body={modalBody} close={closeModal} submit={submitModal} submitDisabled={submitDisabled} closeDisabled={closeDisabled} />
            </>
        );
    }
}

export default Home;
