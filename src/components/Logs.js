import React, { useState, useEffect, useRef, useContext } from 'react';
import { Redirect } from "react-router-dom";

import {Container, Row, Col, Card} from 'react-bootstrap';

import { ScaleLoader } from 'react-spinners';

import downloadIcon from '../images/download.png';
import sdCardIcon from '../images/sdcard.png';
import deleteIcon from '../images/trash.png';

import Nav from './Nav';
import SWModal from './Modal';

import SocketContext from '../context/WebSocketContext';

function Logs(props) {
    const {demo, disableDemo} = props;
    const { ws, conn, send, newMessage } = useContext(SocketContext);
    const [logsData, setLogsData] = useState({siteName: 'iTracker', startDate: '07/01/2019 10:00:00', lastDownload: '12/01/2019 10:00:00', logResults: '10000', logInterval: '15'})
    const [goToHome, setGoToHome] = useState(false);

    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);

    const [modalShow, setModalShow] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalBody, setModalBody] = useState([]);
    const [submitDisabled, setSubmitDisabled] = useState(false);
    const [closeDisabled, setCloseDisabled] = useState(false);
    const modalSubmit = useRef();

    // Set to one once the component has been loaded
    // Used to clear the message in prop so that leftovers 
    // from other components aren't parsed in this component
    const init = useRef(0);

    const dataIn = useRef('');

    // Send request for Logs data
    useEffect(() => {
        if(!demo) {
            setLoading(true);
            send({comm: 11});
        } else {
            setLoading(false);
        }
    }, []);

    // Handle new message
    useEffect(() => {
        if(!demo && newMessage !== '' && init.current != 0){
            if(downloading){
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
                        if(dataIn.current.includes("}")) {
                            console.log("Found }");
                            setDownloading(false);
                            let dataArray = dataIn.current.split("{");
                            let downloadData = dataArray[0];
                            download(downloadData);
                            dataIn.current = "{" + dataArray[1]; 
                            //setLoading(false);
                            try {
                                var jsonMessage = JSON.parse(dataIn.current);
                                setLogsData({siteName: jsonMessage.Site_Name, startDate: jsonMessage.startDate, lastDownload: jsonMessage.lastDate, logResults: jsonMessage.log_results, logInterval: jsonMessage.logInterval})// Clear buffers.
                                setLoading(false);
                                dataIn.current = "";
                            } catch {
                                console.log("not done yet")
                                return;
                            }
                        } else {
                            console.log("not done yet");
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
                console.log("Regular message");
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
                            if(jsonMessage.error) {
                                console.log("error");
                                setLoading(false);
                                dataIn.current = "";
                            } else {
                                setLogsData({siteName: jsonMessage.Site_Name, startDate: jsonMessage.startDate, lastDownload: jsonMessage.lastDate, logResults: jsonMessage.log_results, logInterval: jsonMessage.logInterval})// Clear buffers.
                                setLoading(false);
                                dataIn.current = "";
                            }
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
            }
        } else {
            init.current = 1;
        }
    }, [newMessage]);

    // Handle connection status change
    useEffect(() => {
        if(!demo && conn === WebSocket.CLOSED) {
            setGoToHome(true);
        }
    })

    const downloadAll = () => {
        if(!demo && !loading) {
            setDownloading(true);
            setLoading(true);
            send({comm: 9, dlType: 1, startTime: 0});
        }
    }

    const downloadNew = () => {
        if(!demo && !loading) {
            setDownloading(true);
            setLoading(true);
            send({comm:9, dlType: 1, startTime: 1})
        }
    }

    const writeToSD = () => {
        if(!demo && !loading) {
            setLoading(true);
            send({comm:9, dlType: 2, startTime: 0})
        }
    }

    const clearLogsClicked = () => {
        setModalTitle("Clear Logs");
        var body = ["Are you sure that you want to clear all logs from this iTracker?"]
        setSubmitDisabled(false);
        setCloseDisabled(false);
        setModalBody(body);
        setModalShow(true);
        modalSubmit.current = clearLogs;
    }

    const clearLogs = () => {
        if(!demo && !loading) {
            setLoading(true);
            send({Command: "clear"})

            setTimeout(function () {
                send({comm: 11});
            }, 2000);
        } else {
            closeModal()
        }
    }
    
    const download = (downloadData) => {
        var fileName = logsData.siteName + '.csv'
        var data = new Blob([downloadData], {type: 'text/csv'});
        var csvURL = window.URL.createObjectURL(data);
        var tempLink = document.createElement('a');
        tempLink.href = csvURL
        tempLink.setAttribute('download', fileName);
        tempLink.click();
    }

    const closeModal = () => {
        setModalShow(false);
        modalSubmit.current = undefined;
    }

    if(goToHome) {
        return ( <Redirect to="/"/> )
    } else {
        return (
            <>
            <Nav loading={loading} page="logs" demo={demo} disableDemo={disableDemo} />
            <div className="background full-height">
                <Container fluid>
                    <Row>
                        <Container className="my-2">
                            <Row>
                                <Col className="col-12">
                                    <h2 className="text-light d-inline">Logs</h2>
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
                        <Container className="background-secondary mb-4">
                            <Row className="mt-2">
                                <Col xs={12} className="text-center text-md-left">
                                    <h3 className="text-light ml-4">{logsData.siteName}</h3>
                                </Col>
                                <hr className="divider full-width mx-2"/>
                            </Row>
                            <Row className="mt-4">
                                <Col md={6}>
                                    <h3 className="text-center text-gray">Start Date</h3>
                                    <h2 className="text-center text-light">{logsData.startDate}</h2>
                                    <hr className="divider" />
                                </Col>
                                <Col md={6}>
                                    <h3 className="text-center text-gray">Last Download</h3>
                                    <h2 className="text-center text-light">{logsData.lastDownload}</h2>
                                    <hr className="divider" />
                                </Col>
                            </Row>
                            <Row>
                                <Col md={6}>
                                    <h3 className="text-center text-gray">Logged Results</h3>
                                    <h2 className="text-center text-light">{logsData.logResults}</h2>
                                    <hr className="divider" />
                                </Col>
                                <Col md={6}>
                                    <h3 className="text-center text-gray">Log Interval</h3>
                                    <h2 className="text-center text-light">{logsData.logInterval}</h2>
                                    <hr className="divider" />
                                </Col>
                            </Row>
                            <Row className="mt-3">
                                <Col lg={4} className="mb-3">
                                    <Card onClick={() => downloadAll()} className="background logs-tile">
                                        <h3 className="text-light text-center mt-2">Download All</h3>
                                        <Card.Body className="text-center">
                                            <img src={downloadIcon} className="mx-auto"></img>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col lg={4} className="mb-3">
                                    <Card onClick={() => downloadNew()} className="background logs-tile">
                                        <h3 className="text-light text-center mt-2">Download New</h3>
                                        <Card.Body className="text-center">
                                            <img src={downloadIcon} className="mx-auto"></img>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col lg={4} className="mb-3">
                                    <Card onClick={() => writeToSD()} className="background logs-tile">
                                        <h3 className="text-light text-center mt-2">Write All To SD Card</h3>
                                        <Card.Body className="text-center">
                                            <img src={sdCardIcon} className="mx-auto"></img>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>
                            <Row>
                                <Col xs={12}>
                                    <hr className="divider" />
                                </Col>
                            </Row>
                            <Row className="my-5">
                                <Col lg={4}></Col>
                                <Col lg={4}>
                                    <Card onClick={() => clearLogsClicked()} className="background logs-tile">
                                        <h3 className="text-light text-center mt-2">Clear Logs</h3>
                                        <Card.Body className="text-center">
                                            <img src={deleteIcon} className="mx-auto "></img>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col lg={4}></Col>
                            </Row>

                        </Container>
                    </Row>   
                </Container>
            </div>
            <SWModal show={modalShow} backdrop='static' title={modalTitle} body={modalBody} close={closeModal} submit={modalSubmit.current} submitDisabled={submitDisabled} closeDisabled={closeDisabled} />
            </>
        );
    }
}

export default Logs;
