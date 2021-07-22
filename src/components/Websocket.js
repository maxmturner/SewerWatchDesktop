import React, { useState, useEffect, useRef, useMemo } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';


function WS(props) {

    var {wsSendMessage, wsLastMessage, setWSLastMessage, wsReadyState, setWSReadyState} = props;

    const STATIC_OPTIONS = useMemo(() => ({
        shouldReconnect: (closeEvent) => true, //Will attempt to reconnect on all close events, such as server shutting down
    }), []);

    const [socketUrl, setSocketUrl] = useState('ws://10.10.10.1/stream');
    const [sendMessage, lastMessage, readyState, getWebSocket] = useWebSocket(socketUrl, STATIC_OPTIONS);

    wsSendMessage = sendMessage;
    useEffect(() => { 
        setWSLastMessage(lastMessage);
    }, [lastMessage]);

    useEffect(() => {
        setWSReadyState(readyState);
    }, [readyState]);

    return (
        <></>
    );

} 

export default WS;