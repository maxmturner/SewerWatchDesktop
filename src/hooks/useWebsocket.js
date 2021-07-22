import React, { useState, useEffect, useRef } from 'react';

export default function useWebsocket() {
    
    const [ws, setWS] = useState();
    const [conn, setConn] = useState();
    const [newMessage, setNewMessage] = useState();
    var connectInterval; 
    var statusInterval; 
    const dataIn = useRef('');
    const connectCount = useRef(0);

    useEffect(() => {
        connect(); 
        
        return () => { 
          console.log("Unmounting, Closing");
          if(ws){
              ws.close()  
          }
          
        }
    }, [])
      
    const connect = () => {
        var websocket = new WebSocket("ws://10.10.10.1/stream")
        websocket.binaryType = 'blob';

        setWS(websocket);
        connectCount.current = connectCount.current + 1;
        console.log(connectCount.current);
        
        connectInterval = setTimeout(checkConnection, 3000);

        websocket.onopen = () => {
            //console.log(ConnectionStatus[1]);
            //setConnectionStatus(ConnectionStatus[websocket.readyState]);
            console.log("onopen");
            //websocket.send('{comm: 1}')
            //send('{comm: 1}');
            clearTimeout(connectInterval);
        }
        
        websocket.onclose = () => {
            console.log("onclose");
            //connectInterval = setTimeout(checkConnection, 2000);
        }
    
        websocket.onerror = (event) => {
            console.log("onerror");
            console.log(event);
            websocket.close();
            //connectInterval = setTimeout(checkConnection, 2000);
        }
    
        websocket.onmessage = (event) => {
            console.log("new message");
            setNewMessage(event);
        }
    
        statusInterval = setInterval(() => {
            console.log("CHECKING CONN " + websocket.readyState);
            setConn(websocket.readyState);
        }, 1000);
        
    }
    
    


    const checkConnection = () => {
        if(ws == undefined || ws.readyState != WebSocket.OPEN ) {
            clearTimeout(statusInterval);
            console.log("Retrying connect");
            connect();
        }
    }

    const send = (message) => {
        console.log("sending: " + JSON.stringify(message));
        
        ws.send(JSON.stringify(message));
    }

    const close = () => {
        console.log("Closing");
        ws.close()
        setWS(undefined);
    }

    const open = () => {
        console.log("Reconnecting");
        connect();
    }
    
  
    return [ws, conn, send, newMessage, open, close];
  }
