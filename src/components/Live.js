import React, { useState, useEffect, useRef, useContext } from 'react';
import { Redirect } from "react-router-dom";

import {Container, Row, Col} from 'react-bootstrap';

import { ScaleLoader } from 'react-spinners';

import lowBatteryIcon from '../images/battery-low.png';
import midBatteryIcon from '../images/battery-mid.png';
import goodBatteryIcon from '../images/battery-good.png';
import fullBatteryIcon from '../images/battery-full.png';

import Nav from './Nav';

import SocketContext from '../context/WebSocketContext';

function Live(props) {
    const {demo, disableDemo} = props;
    const { ws, conn, send, newMessage } = useContext(SocketContext);
    const [loading, setLoading] = useState(true);
    const [liveData, setLiveData] = useState({siteName: 'iTracker', date: '01/01/2020 10:00:00', distance: '5 in', gain: '245', level: '2 in', temp: '72.9 F', battery: '90'});
    const [goToHome, setGoToHome] = useState(false);

    const dataIn = useRef('');

    // Set to one once the component has been loaded
    // Used to clear the message in prop so that leftovers 
    // from other components aren't parsed in this component
    const init = useRef(0);

    // Send request for live data
    useEffect(() => {
        if(!demo) {    
            send({comm: 1});
            const autoReadings = setInterval(() => {
                setLoading(true);
                send({comm: 1});
            }, 10000);
            
            return () => {
                clearInterval(autoReadings);
            }
        } else {
            setLoading(false);
        }
    }, []);

    // Handle new message
    useEffect(() => {
        if(!demo && newMessage !== '' && init.current != 0){
            // Create a reader to parse JSON data from the iTracker.
            // Messages from the iTracker handled in handleMessage
            var reader = new FileReader();
            reader.readAsText(newMessage.data, "UTF-8");
            // Reader load finished.
            // ReadyState: EMPTY, LOADING, DONE (0,1,2)
            reader.onload = function() {
                if (reader.readyState == 2)	{
                    //console.log("So far we have: " + dataIn);
                    dataIn.current = dataIn.current + reader.result;
                    // If message is parsed, then the complete JSON message has arrived.
                    // Then send json object to handle message function
                    try {
                        var jsonMessage = JSON.parse(dataIn.current);
                        console.log("iTracker sent:" + dataIn.current);
                        setLiveData({siteName: jsonMessage.Site_Name, date: jsonMessage.Log_DateTime, distance: jsonMessage.distance, gain: jsonMessage.gain, level: jsonMessage.level, temp: jsonMessage.temp, battery: jsonMessage.battery})
                        setLoading(false);
                        // Clear buffers.
                        dataIn.current = "";
                    }
                    catch {
                        console.log("not done yet")
                        return;
                    }
                } else {
                    console.log(reader.result);
                }
            };

            reader.onabort = function() {
                console.log("abort")
            }

            // Reader errors.
            reader.onerror = function() {
                console.log(reader.error)
            }
        } else {
            init.current = 1;
        }
    }, [newMessage]);

    // Handle connection status change
    useEffect(() => {
        if(!demo && conn != 1) {
            setGoToHome(true);
        }
    })
    
    if(goToHome) {
        return ( <Redirect to="/"/> )
    } else {
        return (
            <>
            <Nav loading={loading} page="live" demo={demo} disableDemo={disableDemo} />
            <div className="background vh-100">
                <Container fluid>
                    <Row>
                        <Container className="my-2">
                            <Row>
                                <Col className="col-12">
                                    <h2 className="text-light d-inline">Live Data</h2>
                                    <ScaleLoader 
                                        css='display: inline; margin-left: 10px; padding-top: 5px;'
                                        color={"#006ec7"}
                                        height={25}
                                        loading={loading}
                                    />

                                </Col>
                            </Row>
                            
                        </Container>
                    </Row>

                    <Row>
                        <Container className="background-secondary">
                            <Row className="mt-2">
                                <Col md={4} className="text-center text-md-left">
                                    <div className="ml-4">
                                        <h3 className='text-light'>{liveData.siteName}</h3>
                                    </div>
                                </Col>
                                <Col md={4} className="text-center">
                                    <h3 className="text-light">{liveData.date}</h3>
                                </Col>
                                <Col md={4}>
                                    <div className="text-center text-md-right">
                                        {liveData.battery <= 25 ? <img src={lowBatteryIcon}/> : null}
                                        {liveData.battery <= 50 && liveData.battery > 25 ? <img src={midBatteryIcon}/> : null}
                                        {liveData.battery <= 75 && liveData.battery > 50 ? <img src={goodBatteryIcon}/> : null}
                                        {liveData.battery > 75 ? <img src={fullBatteryIcon}/> : null}
                                        <h3 className="text-light d-inline align-middle mb-4 ml-1">{liveData.battery}%</h3>
                                    </div>
                                </Col>
                                <hr className="divider full-width mx-2"/>
                            </Row>
                            <Row className="mt-4">
                                <Col md={6}>
                                    <h2 className="text-center text-light">Level</h2>
                                    <h3 id="Live_level" className="text-center text-light">{liveData.level}</h3>
                                    <hr className="divider" />
                                </Col>
                                <Col md={6}>
                                    <h2 className="text-center text-light">Distance</h2>
                                    <h3 id="Live_distance" className="text-center text-light">{liveData.distance}</h3>
                                    <hr className="divider" />
                                </Col>
                            </Row>
                            <Row>
                                <Col md={6}>
                                    <h2 className="text-center text-light">Gain</h2>
                                    <h3 id="Live_gain" className="text-center text-light">{liveData.gain}</h3>
                                    <hr className="divider d-md-none d-lg-none d-xl-none" />
                                </Col>
                                <Col md={6}>
                                    <h2 className="text-center text-light">Temperature</h2>
                                    <h3 id="Live_temp" className="text-center text-light">{liveData.temp}</h3>
                                </Col>
                            </Row>
                        </Container>
                    </Row>   
                </Container>
            </div>
            </>
        );
    }
}

export default Live;
