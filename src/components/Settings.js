import React, { useState, useEffect, useRef, useContext } from 'react';
import { Redirect } from "react-router-dom";

import {Container, Row, Col, Card, Form, Button, Popover, OverlayTrigger} from 'react-bootstrap';

import { ScaleLoader } from 'react-spinners';

import newSiteIcon from '../images/home.png';

import Nav from './Nav';
import SWModal from './Modal';

import SocketContext from '../context/WebSocketContext';

function Settings(props) {
    const {demo, disableDemo} = props;
    const { ws, conn, send, newMessage } = useContext(SocketContext);
    const [settingsData, setSettingsData] = useState({});
    
    const [goToHome, setGoToHome] = useState(false);

    const [loading, setLoading] = useState(false);

    const [changed, setChanged] = useState(false);

    const [siteNameChanged, setSiteNameChanged] = useState(false);
    var siteName = useRef();
    const [populationChanged, setPopulationChanged] = useState(false);
    var population = useRef();
    const [pipeIDChanged, setPipeIDChanged] = useState(false);
    var pipeID = useRef();
    const [dampingChanged, setDampingChanged] = useState(false);
    var damping = useRef();
    const [logIntervalChanged, setLogIntervalChanged] = useState(false);
    var logInterval = useRef();
    const [unitsChanged, setUnitsChanged] = useState(false);
    var units = useRef();
    const [cellEnabledChanged, setCellEnabledChanged] = useState(false);
    var cellEnabled = useRef();
    const [wifiWakeUpChanged, setWifiWakeupChanged] = useState(false);
    var wifiWakeUp = useRef();

    const [alertChanged, setAlertChanged] = useState(false);
    const [alert1Changed, setAlert1Changed] = useState(false);
    var alert1 = useRef();
    const [alert2Changed, setAlert2Changed] = useState(false);
    var alert2 = useRef();

    const [levelChanged, setLevelChanged] = useState(false);
    const [SSIDChanged, setSSIDChanged] = useState(false);
    const [commandChanged, setCommandChanged] = useState(false);

    var settingsToSend = useRef({});

    var level = useRef();
    var ssid = useRef();
    var command = useRef();

    const [modalShow, setModalShow] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalBody, setModalBody] = useState([]);
    const [submitDisabled, setSubmitDisabled] = useState(false);
    const [closeDisabled, setCloseDisabled] = useState(false);
    
    const confirmSettings = () => {
        setModalTitle("Save Settings");
        var body = ["Are you sure you want to save these settings?"]

        // Set comm value to request settings page response values when request is complete 
        settingsToSend.current.comm = 6; 

        if(siteNameChanged) {
            body.push("Site Name: " + siteName.current.value);
            if(!siteName.current.value.match(/^[a-z0-9? ]+$/i)) {
                body.push("Warning: Site Name can only contain alphanumeric characters. Please change the Site Name to only contain letters and numbers. Changes to Site Name will not be sent to the iTracker.");
            } else {
                settingsToSend.current.Site_Name = siteName.current.value;
            }
        }

        if(populationChanged) {
            var newPopulation = parseInt(population.current.value);
            body.push("Households: "+ population.current.value);
            if(isNaN(newPopulation)) {
                body.push("Warning: Households must be a number. Changes to Household will not be sent to the iTracker.");
            } else {
                settingsToSend.current.Population = population.current.value;
            }
        }

        if(pipeIDChanged) {
            var newPipeSize = parseInt(pipeID.current.value);
            body.push("Pipe Size: "+ pipeID.current.value + "");
            if(isNaN(newPipeSize)) {
                body.push("Warning: Pipe Size must be a number. Changes to Pipe Size will not be sent to the iTracker.");
            } else {
                if(newPipeSize > 12 ) {
                    body.push("Warning: Pipe Size greater than 12. For accuracy, a one time velocity measurement is recommended. See Manual or contact Eastech.");
                }
                settingsToSend.current.Pipe_ID = pipeID.current.value;
            }
        }

        if(dampingChanged) {
            body.push("Damping: "+ damping.current.value + "");
            settingsToSend.current.Damping = damping.current.value;
        }

        if(logIntervalChanged) {
            body.push("Log Interval: "+ logInterval.current.value + "");
            settingsToSend.current.logInterval = logInterval.current.value;
        }

        if(unitsChanged) {
            body.push("Units: "+ units.current.value + "");
            settingsToSend.current.sysm = units.current.value;
        }

        if(wifiWakeUpChanged) {
            var wifiStatus = "On";
            if(wifiWakeUp.current.value == 0) {
                wifiStatus = "Off";
            }
            body.push("WiFi Wake Up: "+ wifiStatus + "");
            if(wifiWakeUp.current.value === "1") {
                body.push("Warning: Enabling WiFi wakeup will cause your iTracker to wake up and broadcast WiFi on a 5 minute interval. This will cause a significant decrease in battery life.");
            }
            settingsToSend.current.wifiWakeUp = wifiWakeUp.current.value;
        }

        if(cellEnabledChanged) {
            var cellStatus = "On";
            if(cellEnabled.current.value == 0) {
                cellStatus = "Off";
            }
            body.push("Cellular: "+ cellStatus + "");
            if(cellEnabled.current.value === 1) {
                body.push("Warning: Cellular mode requires a cellular enabled iTracker with additional hardware. After submitting this change, a reboot will be required for the changes to take effect.");
            }
            settingsToSend.current.cell_enabled = cellEnabled.current.value;
        }

        setModalBody(body);
        setSubmitDisabled(false);
        setCloseDisabled(false);
        setModalShow(true);

    }

    const setAlerts = () => {
        setModalTitle("Set Alerts");
        var body = [
            "Are you sure you want to save these Alerts?",
            "Alert 1: " + alert1.current.value,
            "Alert 2: " + alert2.current.value
        ]

        if(!settingsData.cell_enabled){
            body.push("Warning: Cellular is not enabled, Alerts will not be active.");
        }

        setSubmitDisabled(false);
        setCloseDisabled(false);
        setModalBody(body);

        // Set comm value to request settings page response values when request is complete 
        settingsToSend.current.comm = 6;
        settingsToSend.current.cell_alert_1 = alert1.current.value;
        settingsToSend.current.cell_alert_2 = alert2.current.value;

        setModalShow(true);
    }

    const setLevel = () => {
        setModalTitle("Set Level")
        var newLevel = parseInt(level.current.value);
        if(isNaN(newLevel)) {
            var body = ["Level value must be a number. Check the value given and try again."]
            setSubmitDisabled(true);
            setCloseDisabled(false);
            setModalBody(body);
            setModalShow(true);
        } else { 
            var body = ["Are you sure you want to set Level to: " + level.current.value + "?"]
            setSubmitDisabled(false);
            setCloseDisabled(false);
            setModalBody(body);

            // Set comm value to request settings page response values when request is complete 
            settingsToSend.current.comm = 6;
            settingsToSend.current.Level = newLevel;

            setModalShow(true);
        }
    }

    const syncTime = () => {
        // Format date for iTracker
        var dt = new Date();
        var yyyy = dt.getFullYear();
        var mm = dt.getMonth() < 9 ? "0" + (dt.getMonth() + 1) : (dt.getMonth() + 1); // getMonth() is zero-based
        var dd  = dt.getDate() < 10 ? "0" + dt.getDate() : dt.getDate();
        var hh = dt.getHours() < 10 ? "0" + dt.getHours() : dt.getHours();
        var min = dt.getMinutes() < 10 ? "0" + dt.getMinutes() : dt.getMinutes();
        var ss = dt.getSeconds() < 10 ? "0" + dt.getSeconds() : dt.getSeconds();
        var datestring = "".concat(mm+"/").concat(dd+"/").concat(yyyy+" ").concat(hh+":").concat(min+":").concat(ss);

        setModalTitle("Sync Time");
        var body = ["Are you sure you want to sync the iTracker's clock to " + datestring + "?"]
        settingsToSend.current = {Log_DateTime: '"' + datestring + '"'}
        // Set comm value to request settings page response values when request is complete 
        settingsToSend.current.comm = 6;

        setModalBody(body);
        setSubmitDisabled(false);
        setCloseDisabled(false);
        setModalShow(true);
    }

    const resetBattery = () => {
        setModalTitle("Reset Battery");
        var body = ["Are you sure you want to reset the iTracker's battery level?"]
        settingsToSend.current = {Command: "battery"}
        // Set comm value to request settings page response values when request is complete 
        settingsToSend.current.comm = 6;
        setModalBody(body);
        setSubmitDisabled(false);
        setCloseDisabled(false);
        setModalShow(true);
    }

    const newSite = () => {
        setModalTitle("New Site");
        var body = ["Are you sure you want to broadcast WiFi with the SSID of: " + ssid.current.value + "? This will end the current session and you will need to reconnect to the iTracker's WiFi network."]
        settingsToSend.current = {Command: "new"}
        // Set comm value to request settings page response values when request is complete 
        settingsToSend.current.comm = 6;
        setModalBody(body);
        setSubmitDisabled(false);
        setCloseDisabled(false);
        setModalShow(true);
    }

    const setSSID = () => {
        setModalTitle("Set SSID")
        var body = ["Are you sure you want to set WiFi SSID to: " + ssid.current.value + "?"]
        setSubmitDisabled(false);
        setCloseDisabled(false);
        setModalBody(body);
        settingsToSend.current = {Command: "s " + ssid.current.value}
        setModalShow(true);
        ssid.current.value = "";
    }

    const adminCommand = () => {
        setModalTitle("Admin Command");
        var body = ["Are you sure you want to send '" + command.current.value + "' to the iTracker?"]
        setSubmitDisabled(false);
        setCloseDisabled(false);
        setModalBody(body);

        if(command.current.value.includes("DEBUG") || command.current.value.includes("debug")) {
            var args = command.current.value.split(" ", 2);
            settingsToSend.current = {DEBUG: args[1]};
        } else {
            settingsToSend.current = {Command: command.current.value}
            // Set comm value to request settings page response values when request is complete 
            settingsToSend.current.comm = 6;
        }
        command.current.value = "";
        setModalShow(true);

    }
    
    const closeModal = () => {
        setModalShow(false);
        settingsToSend.current = {};
    }
    
    const submitSettings = () => {
        if(settingsToSend.current.Command == 'Demo' || settingsToSend.current.Command == 'demo') {
            setModalTitle('Demo');
            var body = ['Demo log writing in process. Ensure that iTracker LED is blinking once per second. Once LED blink returns to normal (Typically takes 2 minutes), check WiFi connection, then reload this page.'];
            setSubmitDisabled(true);
            setCloseDisabled(true);
            setModalBody(body);
            setModalShow(true);
        }
        
        if(!demo) {
            setLoading(true);
        } 

        if(demo){
            console.log("Send settings")
            console.log(settingsToSend.current);
        } else {
            send(settingsToSend.current);
            // Slight delay in sending request for settings info to 'refresh' page
            // setTimeout(() => {
            //     send({comm: 6});
            // }, 500);
        }
    
        settingsToSend.current = {};
        setModalShow(false);

        // Reset all changed flags
        setSiteNameChanged(false);
        setPopulationChanged(false);
        setPipeIDChanged(false);
        setDampingChanged(false);
        setLogIntervalChanged(false);
        setUnitsChanged(false);
        setWifiWakeupChanged(false);
        setCellEnabledChanged(false);
    }

    // Set to one once the component has been loaded
    // Used to clear the message in prop so that leftovers 
    // from other components aren't parsed in this component
    const init = useRef(0);

    const dataIn = useRef('');

    // Send request for Settings data
    useEffect(() => {
        if(!demo) {
            setLoading(true);
            send({comm: 6});
        } else {
            setLoading(false);
            setSettingsData({
                Site_Name: 'iTracker', 
                Population: 1000,
                Pipe_ID: 5,
                Damping: 6,
                logInterval: 15,
                sysm: 'Metric',
                cell_found: 1,
                cell_enabled: 1,
                cell_imei: '1234',
                cell_status: 'Connected',
                cell_alert_1: '8',
                cell_alert_2: '10',
                wifiWakeUp: 1,
                Log_DateTime: '3/10/2020 05:45:29',
                Battery: 88,
                sn: '12345',
                Firm_v: '4.1.4'
            })
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
                        setSettingsData({
                            Site_Name: jsonMessage.Site_Name, 
                            Population: jsonMessage.Population,
                            Pipe_ID: jsonMessage.Pipe_ID,
                            Damping: jsonMessage.Damping,
                            logInterval: jsonMessage.logInterval,
                            sysm: jsonMessage.sysm,
                            wifiWakeUp: jsonMessage.wifiWakeUp,
                            Log_DateTime: jsonMessage.Log_DateTime,
                            Battery: jsonMessage.Battery,
                            sn: jsonMessage.sn,
                            Firm_v: jsonMessage.Firm_v,
                            cell_found: jsonMessage.cell_found,
                            cell_enabled: jsonMessage.cell_enabled,
                            cell_imei: jsonMessage.cell_imei,
                            cell_status: jsonMessage.cell_status,
                            cell_alert_1: jsonMessage.cell_alert_1,
                            cell_alert_2: jsonMessage.cell_alert_2
                        });
                        setLoading(false);
                        // Clear buffers
                        dataIn.current = "";
                    }
                    catch {
                        console.log("not done yet");
                        console.log(dataIn.current);
                        return;
                        
                    }
                } else {
                    console.log(reader.result);
                }
                //return reader.result;
            };

            reader.onabort = function() {
                console.log("abort")
            }

            // Reader errors.
            reader.onerror = function() {
                console.log(reader.error)
            }
        } else {
            //setMessageIn('');
            init.current = 1;
        }
    }, [newMessage]);

    // Handle connection status change
    useEffect(() => {
        if(!demo && conn == WebSocket.CLOSED) {
            setGoToHome(true);
        }
    })  

    const popover = (
        <Popover id="popover-basic">
            <Popover.Title as="h3">Cellular Alerts</Popover.Title>
            <Popover.Content>
                You may set two values for alerts. If the iTracker's level reading rises above either of these values, then an alert will be triggered via the Cloud.
            </Popover.Content>
        </Popover>
    );

    if(goToHome) {
        return ( <Redirect to="/"/> )
    } else {
        return (
            <>
            <Nav loading={loading} page="settings"  demo={demo} disableDemo={disableDemo} />
            <div className="background full-height">
                <Container fluid>
                    <Row>
                        <Container className="my-2">
                            <Row>
                                <Col className="col-12">
                                    <h2 className="text-light d-inline">Settings</h2>
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
                            <Row>
                                <Col xs={12}>
                                    <Form className="mt-2 mb-2">
                                        <Form.Group>
                                            <Form.Label className={siteNameChanged ? "h4 text-light" : "text-light"}>Site Name</Form.Label>
                                            <Form.Control ref={siteName} type="text" size="lg" defaultValue={settingsData.Site_Name} onChange={() => {setChanged(true); setSiteNameChanged(true);} }/>
                                        </Form.Group>
                                        <Form.Group>
                                            <Form.Label className={populationChanged ? "h4 text-light" : "text-light"}>Households</Form.Label>
                                            <Form.Control ref={population} type="text" defaultValue={settingsData.Population} onChange={() => {setChanged(true); setPopulationChanged(true);} }/>
                                        </Form.Group>
                                        <Form.Group>
                                            <Form.Label className={pipeIDChanged ? "h4 text-light" : "text-light"}>Pipe Size</Form.Label>
                                            <Form.Control ref={pipeID} type="text" size="lg" defaultValue={settingsData.Pipe_ID} onChange={() => {setChanged(true); setPipeIDChanged(true);} }/>
                                        </Form.Group>   
                                        <Form.Group>
                                            <Form.Label className={dampingChanged ? "h4 text-light" : "text-light"}>Damping</Form.Label>
                                            <Form.Control ref={damping} as="select" size="lg" onChange={() => {setChanged(true); setDampingChanged(true);} }>
                                                <option selected={settingsData.Damping == 3}>3</option>
                                                <option selected={settingsData.Damping == 4}>4</option>
                                                <option selected={settingsData.Damping == 5}>5</option>
                                                <option selected={settingsData.Damping == 6}>6</option>
                                                <option selected={settingsData.Damping == 7}>7</option>
                                                <option selected={settingsData.Damping == 8}>8</option>
                                            </Form.Control>
                                        </Form.Group>       
                                        <Form.Group>
                                            <Form.Label className={logIntervalChanged ? "h4 text-light" : "text-light"}>Log Interval</Form.Label>
                                            <Form.Control ref={logInterval} as="select" size="lg" onChange={() => {setChanged(true); setLogIntervalChanged(true);} }>
                                                <option selected={settingsData.logInterval == 1}>1</option>
                                                <option selected={settingsData.logInterval == 5}>5</option>
                                                <option selected={settingsData.logInterval == 10}>10</option>
                                                <option selected={settingsData.logInterval == 15}>15</option>
                                                <option selected={settingsData.logInterval == 30}>30</option>
                                                <option selected={settingsData.logInterval == 60}>60</option>
                                            </Form.Control>
                                        </Form.Group>
                                        <Form.Group>
                                            <Form.Label className={unitsChanged ? "h4 text-light" : "text-light"}>Units of Measure</Form.Label>
                                            <Form.Control ref={units} as="select" size="lg" defaultValue={settingsData.sysm} onChange={() => {setChanged(true); setUnitsChanged(true);} }>
                                                <option selected={settingsData.sysm == "English"}>English</option>
                                                <option selected={settingsData.sysm == "Metric"}>Metric</option>
                                            </Form.Control>
                                        </Form.Group>  
                                        <Form.Group>
                                            <Form.Label className={wifiWakeUpChanged ? "h4 text-light" : "text-light"}>WiFi Wake Up</Form.Label>
                                            <Form.Control ref={wifiWakeUp} as="select" size="lg" onChange={() => {setChanged(true); setWifiWakeupChanged(true);} }>
                                                <option selected={settingsData.wifiWakeUp == 0} value={0}>Off</option>
                                                <option selected={settingsData.wifiWakeUp == 1} value={1}>On</option>
                                            </Form.Control>
                                        </Form.Group>
                                        <Form.Group className={ settingsData.cell_enabled == 1 ? "" : "d-none" }>
                                            <Form.Label className={cellEnabledChanged ? "h4 text-light" : "text-light"}>Cellular</Form.Label>
                                            <Form.Control ref={cellEnabled} as="select" size="lg" onChange={() => {setChanged(true); setCellEnabledChanged(true);} }>
                                                <option selected={settingsData.cell_enabled == 0} value={0}>Off</option>
                                                <option selected={settingsData.cell_enabled == 1} value={1} >On</option>
                                            </Form.Control>
                                        </Form.Group>
                                        <Button size="lg" className="btn-blue mb-2" disabled={!changed} onClick={() => confirmSettings() }>Submit</Button>
                                    </Form>
                                </Col>
                            </Row>
                            <Row className={ settingsData.cell_found == 1 ? "" : "d-none" }>
                                <Col xs={12} className="mb-2">
                                    <Card className="card background settings-tile-sm">
                                        <Card.Title className="text-light text-center mt-2">Cellular</Card.Title>
                                        <Card.Body className="text-center d-inline">
                                            <h5 className="text-light">Status: {settingsData.cell_status}</h5>
                                            <p className="text-light">IMEI: {settingsData.cell_imei}</p>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col xs={12} className="mb-2">
                                    <Card className="card background settings-tile-lg">
                                        <Card.Title className="card-title mx-auto mt-2">
                                            <h5 className="text-light text-center d-inline">Alerts</h5>
                                            <OverlayTrigger trigger="click" placement="top" overlay={popover}>
                                                <Button className="btn-blue ml-2">Help</Button>
                                            </OverlayTrigger>
                                        </Card.Title>
                                        <Card.Body className="card-body">
                                            <div className="mb-2">
                                                <Form.Label className={alert1Changed ? "h4 text-light" : "text-light"}>Level Alert 1:</Form.Label>
                                                <Form.Control ref={alert1} type="text" size="lg" id="alert1" defaultValue={settingsData.cell_alert_1} onChange={() => {setAlertChanged(true); setAlert1Changed(true)}} />
                                            </div>  
                                            <div>
                                                <Form.Label className={alert2Changed ? "h4 text-light" : "text-light"}>Level Alert 2:</Form.Label>
                                                <Form.Control ref={alert2} type="text" size="lg" id="alert2" defaultValue={settingsData.cell_alert_2} onChange={() => {setAlertChanged(true); setAlert2Changed(true)}} />
                                            </div>  
                                            <Button size="lg" type="submit" className="btn-blue mt-2" disabled={!alertChanged} onClick={ () => {setAlerts()} }>Submit</Button>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>
                            <Row>
                                <Col sm={12} md={6} className="mb-2">
                                    <Card className="background settings-tile-sm">
                                        <Card.Title className="text-light text-center mt-2">Set Level</Card.Title>
                                        <Card.Body className="text-center">
                                            <Form.Control ref={level} onChange={() => {setLevelChanged(true)}} type="text" placeholder="Level" />
                                            <Button size="lg" className="btn-blue mt-2 mb-2" disabled={!levelChanged} onClick={() => {setLevel()}}>Submit</Button>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col sm={12} md={6} className="col-sm-12 col-md-6 mb-2">
                                    <Card className="card background settings-tile-sm">
                                        <Card.Title className="card-title text-light text-center mt-2">Date/Time</Card.Title>
                                        <Card.Body className=" text-center">
                                            <h5 className="text-light text-center">{settingsData.Log_DateTime}</h5>
                                            <Button size="lg" className="btn-blue mt-2" onClick={() => { syncTime() }}>Sync Time</Button>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                
                            </Row>
                            <Row>
                                <Col sm={12} md={6} className="mb-2">
                                    <Card className="card background settings-tile-sm">
                                        <Card.Title className=" text-light text-center mt-2">Battery</Card.Title>
                                        <Card.Body className=" text-center">
                                            <h5 className="text-light text-center">{settingsData.Battery}%</h5>
                                            <Button size="lg" className="btn-blue mt-2" onClick={() => { resetBattery() }}>Reset Battery</Button>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col sm={12} md={6} className="mb-2">
                                    <Card onClick={() => { newSite() }} className="card background settings-tile-sm">
                                        <Card.Title className=" text-light text-center mt-2">New Site</Card.Title>
                                        <Card.Body className=" text-center">
                                            <img src={newSiteIcon} className="mx-auto"/>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>
                            <Row>
                                <Col sm={12} md={6} className="mb-2">
                                    <Card className="background settings-tile-sm">
                                        <Card.Title className="text-light text-center mt-2">WiFi SSID</Card.Title>
                                        <Card.Body className="text-center">
                                            <Form.Control ref={ssid} onChange={() => {setSSIDChanged(true)}} type="text" placeholder="SSID" />
                                            <Button size="lg" className="btn-blue mt-2 mb-2" disabled={!SSIDChanged} onClick={() => { setSSID() }}>Submit</Button>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col sm={12} md={6} className="mb-2">
                                    <Card className="background settings-tile-sm">
                                        <Card.Title className=" text-light text-center mt-2">Admin Command</Card.Title>
                                        <Card.Body className=" text-center">
                                            <Form.Control ref={command} onChange={() => {setCommandChanged(true)}} type="text" className="form-control" id="adminCommandInput" />
                                            <Button size="lg" className="btn-blue mt-2 mb-2" disabled={!commandChanged} onClick={() => { adminCommand() }}>Submit</Button>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>
                            <Row className="mt-2 mb-2">
                                <Col xs={8} className="mx-auto">
                                    <h4 className="text-center text-light">Serial Number</h4>
                                    <h5 className="text-center text-light mb-2">{settingsData.sn}</h5>
                
                                    <hr className="divider" />
                
                                    <h4 className="text-center text-light">Firmware Version</h4>
                                    <h5 className="text-center text-light mb-2">{settingsData.Firm_v}</h5>
                                </Col>
                            </Row>

                        </Container>
                    </Row>   
                </Container>
            </div>
            <SWModal show={modalShow} backdrop='static' title={modalTitle} body={modalBody} close={closeModal} submit={submitSettings} submitDisabled={submitDisabled} closeDisabled={closeDisabled} />
            </>
        );
    }
}

export default Settings;
