import React, { useState, useEffect, useRef } from 'react';
import { HashRouter as Router, Route } from "react-router-dom";

import {Toast} from 'react-bootstrap';

import SocketContext from './context/WebSocketContext';
import useWebSocket from './hooks/useWebsocket';

import Landing from './components/Landing';

import Home from './components/Home';
import Live from './components/Live';
import Logs from './components/Logs';
import Analytics from './components/Analytics';
import Settings from './components/Settings';

import './App.css';

function App() {

  const [ws, conn, send, newMessage, open, close] = useWebSocket() 

  const [demo, setDemo] = useState(false);

  const dataIn = useRef('');
  
  const version = useRef('0');
  const [goToApp, setGoToApp] = useState(false);
  const init = useRef(0);
  
  var ipcRenderer = window.ipcRenderer;
  const [updateMessage, setUpdateMessage] = useState('');
  const [showUpdateToast, setShowUpdateToast] = useState(false);
  var toastTimeout;
  ipcRenderer.on('message', function(event, text) {
    clearTimeout(toastTimeout);
    setUpdateMessage(text);
    setShowUpdateToast(true);
    toastTimeout = setTimeout(() => {
      setShowUpdateToast(false);
    }, 5000);
  })

  // Handle new message
  useEffect(() => {
      if (newMessage !== undefined && init != 0) {
        // When on the landing page, goToApp will be false
        // In this case the message needs to be parsed here, 
        // Rather than in the child component
        if(goToApp == false) {
          // Create a reader to parse JSON data from the iTracker.
          // Messages from the iTracker handled in handleMessage
          console.log(newMessage.data)
          var reader = new FileReader();
          reader.readAsText(newMessage.data, "UTF-8");
          
          // Reader load finished.
          // ReadyState: EMPTY, LOADING, DONE (0,1,2)
          reader.onload = function() {
            if (reader.readyState == 2)	{
              console.log("reader is ready")
              //console.log("So far we have: " + dataIn);
              dataIn.current = dataIn.current + reader.result;
              //console.log(reader.result)
              //console.log(dataIn.current);
              // If message is parsed, then the complete JSON message has arrived.
              // Then send json object to handle message function
              try {
                var jsonMessage = JSON.parse(dataIn.current);
                console.log("iTracker sent:" + dataIn.current);
                console.log(jsonMessage);
                // if(jsonMessage.Site_Name){
                //   siteName = jsonMessage.Site_Name;
                // }
                // console.log("Current function is " + currentFunction);
                //handleMessage(jsonObject);
                //setMessageHistory(prev => prev.concat(dataIn.current));
                //setMessageIn(dataIn.current);
                try {
                  
                  version.current = jsonMessage.FirmwareVersion;
                  console.log(version.current);
                  loadApp();
                } catch {
                  console.log("Couldn't find fw version in json")
                }
                console.log(jsonMessage);
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
          //getWebSocket returns the WebSocket wrapped in a Proxy. This is to restrict actions like mutating a shared websocket, overwriting handlers, etc
          // const currentWebsocketUrl = getWebSocket().url;
          // console.log('received a message from ', currentWebsocketUrl);
          //setMessageHistory(prev => prev.concat(dataIn.current));
          //console.log("Got message");
          //console.log(wsLastMessage);
          //setMessageIn(wsLastMessage);
        }
          
      } else {
        init.current = 1;
      }
  }, [newMessage]);

  // Handle connection status change
  useEffect(() => {
    if(!demo){
      switch (conn) {
        case WebSocket.OPEN:
          version.current = '0';
          requestVersion();
          break;
        
        case WebSocket.CONNECTING:
        case WebSocket.CLOSED:
          // If websocket closes, go back to landing
          setGoToApp(false);
          break;
        default:
          break;
      }
    }

  }, [conn]);

  const enableDemo = () => {
    setDemo(true);
    //setGoTo('demo');
    setGoToApp(true);
  }
  
  const disableDemo = () => {
    setDemo(false);
    setGoToApp(false);
  }

  const requestVersion = () => {
    send({ID: "?"});
  }

  const loadApp = () => {
    console.log(version.current);
    console.log(gteVersion(version.current, '4.1.3'));
    if(gteVersion(version.current, '4.1.3')) {
      setGoToApp(true);
    } else {
      setGoToApp(false);
    }
  }

  function cmpVersion(a, b) {
    var i, cmp, len;
    a = (a + '').split('.');
    b = (b + '').split('.');
    len = Math.max(a.length, b.length);
    for( i = 0; i < len; i++ ) {
        if( a[i] === undefined ) {
            a[i] = '0';
        }
        if( b[i] === undefined ) {
            b[i] = '0';
        }
        cmp = parseInt(a[i], 10) - parseInt(b[i], 10);
        if( cmp !== 0 ) {
            return (cmp < 0 ? -1 : 1);
        }
    }
    return 0;
}

  function gteVersion(a, b) {
      return cmpVersion(a, b) >= 0;
  }
  function ltVersion(a, b) {
      return cmpVersion(a, b) < 0;
  }

  if(goToApp == false) {
    //{legacy ? null : <WS wsSendMessage={wsSendMessage} wsLastMessage={wsLastMessage} setWSLastMessage={setWSLastMessage} wsReadyState={wsReadyState} setWSReadyState={setWSReadyState} />} 

    return (
      <>
      { showUpdateToast ?
        <Toast
          onClose={() => { setShowUpdateToast(false) } }  
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            zIndex: 1000,
            minWidth: 300
          }}
        >
          <Toast.Header>
            <strong className="mr-auto">App Update</strong>
          </Toast.Header>
          <Toast.Body>{updateMessage}</Toast.Body>
        </Toast>
        : null
      }
      
      <SocketContext.Provider value={{ws: ws, conn: conn, send: send, newMessage: newMessage, open: open, close: close}}>
        <Landing enableDemo={enableDemo} />
      </SocketContext.Provider>
      </>
    );
  } else if (goToApp == true) {
    return (
      <>
      { showUpdateToast ?
        <Toast
          onClose={() => { setShowUpdateToast(false) } }
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            zIndex: 1000,
            minWidth: 300
          }}
        >
          <Toast.Header>
            <strong className="mr-auto">App Update</strong>
          </Toast.Header>
          <Toast.Body>{updateMessage}</Toast.Body>
        </Toast>
        : null
      }
      {/* {legacy ? null : <WS wsSendMessage={wsSendMessage} wsLastMessage={wsLastMessage} setWSLastMessage={setWSLastMessage} wsReadyState={wsReadyState} setWSReadyState={setWSReadyState} />} */}
      <SocketContext.Provider value={{ws: ws, conn: conn, send: send, newMessage: newMessage, open: open, close: close}}>
        <Router>
          <Route 
            exact path="/" 
            render={(props) => <Home {...props} demo={demo} disableDemo={disableDemo} /> }
          />
          <Route 
            path='/live'
            render={(props) => <Live {...props} demo={demo} disableDemo={disableDemo} /> }
          />
          <Route 
            path='/logs'
            render={(props) => <Logs {...props} demo={demo} disableDemo={disableDemo} /> }
          />
          <Route 
            path='/analytics'
            render={(props) => <Analytics {...props} demo={demo} disableDemo={disableDemo} /> }
          />
          <Route 
            path='/settings'
            render={(props) => <Settings {...props} demo={demo} disableDemo={disableDemo} /> }
          />
        </Router>
      </SocketContext.Provider>
      </>
    )
    
  }
}

export default App;
