import React, { useState, useEffect, useRef, useContext } from 'react';
import { Redirect } from "react-router-dom";

import {Container, Row, Col, Button, DropdownButton, Dropdown, ButtonToolbar} from 'react-bootstrap';
import { ScaleLoader } from 'react-spinners';
import {Line} from 'react-chartjs-2';

import { demoValues, demoLabels } from '../DemoData';

import SocketContext from '../context/WebSocketContext';

import Nav from './Nav';

function Analytics(props) {
    const {demo, disableDemo} = props;
    const { ws, conn, send, newMessage } = useContext(SocketContext);
    const [daysLabel, setDaysLabel] = useState('1 Day');
    const [days, setDays] = useState(1);
    const [graphUnit, setGraphUnit] = useState('hour');
    const [graphType, setGraphType] = useState('1');
    const [graphTypeLabel, setGraphTypeLabel] = useState('Level');
    const [yAxisUnit, setYAxisUnit] = useState("inches");
    const [analyticsData, setAnalyticsData] = useState({
        labelArray: [], 
        valueArray: []
    })


    const [goToHome, setGoToHome] = useState(false);
    const init = useRef(0);
    const [loading, setLoading] = useState(true);

    const dataIn = useRef('');

    // Send request for analytics data
    useEffect(() => {
        if(!demo) {
            setLoading(true);
            send({comm: 14, GraphType: graphType, GraphDay: days});
        } else {
            setLoading(false);
            if(days === 1) {
                setAnalyticsData({
                    labelArray: demoLabels.slice(0,26),
                    valueArray: demoValues.slice(0,26)
                })
            } else if(days === 7) {
                setAnalyticsData({
                    labelArray: demoLabels.slice(0,170),
                    valueArray: demoValues.slice(0,170)
                })
            } else if(days === 30) {
                setAnalyticsData({
                    labelArray: demoLabels,
                    valueArray: demoValues
                })
            }
            
        }
    }, [days, graphType]);

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
                    dataIn.current = dataIn.current + reader.result;
                    // If message is parsed, then the complete JSON message has arrived.
                    // Then send json object to handle message function
                    try {
                        var jsonMessage = JSON.parse(dataIn.current);
                        console.log("iTracker sent:" + dataIn.current);
                        var labelArrayHolder = []
                        var valueArrayHolder = []
                        for (var i = 0; i < jsonMessage.Values.length; i++)
                        {
                            if (labelArrayHolder.push(jsonMessage.Values[i].DateTime)) {
                                valueArrayHolder.push(jsonMessage.Values[i].Value.toString()); //i.toString());
                            }
                        }
                        setAnalyticsData({labelArray: labelArrayHolder, valueArray: valueArrayHolder});
                        setYAxisUnit(jsonMessage.Units);
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
        if(!demo && conn == WebSocket.CLOSED) {
            setGoToHome(true);
        }
    })

    const getChartImage = () => {
        window.document.getElementById("chart").toBlob(function(blob) {
            download("chart.png", blob);
        });
    }

    const download = (name, downloadData) => {
        var fileURL = window.URL.createObjectURL(downloadData);
        var tempLink = document.createElement('a');
        tempLink.href = fileURL
        tempLink.setAttribute('download', name);
        tempLink.click();
    }
    
    const data = {
        labels: analyticsData.labelArray,
        datasets: [
          {
            label: graphTypeLabel,
            fill: false,
            lineTension: 0.5,
            backgroundColor: 'rgb(48, 194, 255)',
            borderColor: 'rgb(48, 194, 255)',
            borderWidth: 2,
            data: analyticsData.valueArray
          }
        ]
    } 

    const options = {
        scales: {
            yAxes: [{
                scaleLabel: {
                display: true,
                labelString: (graphTypeLabel + " (" + yAxisUnit + ")"),
                fontColor: "#fff",
                fontSize: 20
                },
                ticks: {
                    fontColor: '#fff'
                }
            }],
            xAxes: [{
                scaleLabel: {
                display: true,
                labelString: 'Date',
                fontColor: "#fff",
                fontSize: 20
                },
                ticks: {
                    fontColor: '#fff'
                },
                type: 'time',
                time: {
                    unit: graphUnit
                }
            }],
        }     
    }

    if(goToHome) {
        return ( <Redirect to="/"/> )
    } else {
        return (
            <>
            <Nav loading={loading} page="analytics" demo={demo} disableDemo={disableDemo} />
            <div className="background vh-100">
                <Container fluid>
                    <Row>
                        <Container className="mt-2">
                            <Row>
                                <Col className="col-12">
                                    <h2 className="text-light d-inline">Analytics</h2>
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
                                <Col xs={12} className="mx-auto text-center">
                                    <ButtonToolbar>
                                        {/* <Button size="lg" className="btn-blue btn-blue-active ml-auto">Level</Button> */}
                                        <DropdownButton size="lg" title={graphTypeLabel} className="mx-2 ml-auto">
                                            <Dropdown.Item onClick={() => {setGraphType(1); setGraphTypeLabel("Level");} }>Level</Dropdown.Item>
                                            <Dropdown.Item onClick={() => {setGraphType(2); setGraphTypeLabel("Ratio");} }>Ratio</Dropdown.Item>
                                            <Dropdown.Item onClick={() => {setGraphType(3); setGraphTypeLabel("Flow");} }>Flow</Dropdown.Item>
                                        </DropdownButton>
                                        <DropdownButton size="lg" title={daysLabel} className="mx-2">
                                            <Dropdown.Item onClick={() => {setDays(1); setDaysLabel("1 Day"); setGraphUnit('hour');} }>1 Day</Dropdown.Item>
                                            <Dropdown.Item onClick={() => {setDays(7); setDaysLabel("7 Days"); setGraphUnit('day');} }>7 Days</Dropdown.Item>
                                            <Dropdown.Item onClick={() => {setDays(30); setDaysLabel("30 Days"); setGraphUnit('day');} }>30 Days</Dropdown.Item>
                                        </DropdownButton>
                                        <Button size="lg" className="btn-blue mr-auto mx-2" onClick={() => getChartImage()}>Save As Image</Button>
                                    </ButtonToolbar>
                                        
                                
                                </Col>
                            </Row>
                            <Row className="mt-4">
                                <Line id="chart" data = {data} options={options} />
                            </Row>
                            
                        </Container>
                    </Row>   
                </Container>
            </div>
            </>
        );
    }
}

export default Analytics;
