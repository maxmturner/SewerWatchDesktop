'use strict';
// 4.1.1 

// Note this script handles only one websocket
var ws = undefined;                     // Websocket object
var connected = 0;                      // Connection status
var status = "";                        // Status message
var dataIn = "";

// Watchdog intervals
var watchdog_interval = undefined; 	    // Keep the websocket connection alive.
var download_interval = undefined; 	    // For tracking when to perform download (all records read through the websocket).
var message_interval = undefined; 	    // For tracking when complete JSON message has arrived (not download)
var autoReadings_interval = undefined;  // For taking continuous readings from iTracker

var currentFunction = 0;			    // Track what function the app is using
var siteName = "none";				    // Site Name
var dlType = 1;						    // Download to pc/browser (1), or SD card (2);
var downloadContent = "";			    // File/Log download buffer.
var currentPage = "home.html";          // String for what html view to show
var connectTryCount = 1;                // Incremented for connection time out
var loadingTryCount = 0;                // Incremented for loading time out
var newSession = 0;                     // Changed to 1 after connected

// History
var graph = undefined;                  // For the graph object.

// Set the ip address.
var ipAddress = "10.10.10.1";

$(document).ready(function(){
    // Close navbar menu when a link is clicked
    $(".navbar-nav li a").click(function(event) {
        $(".navbar-collapse").collapse('hide');
    });

    // Close the websocket gracefully if the user clicks "refresh"
    // or if the user changes to the debug view. This should help
    // with the retraining of the socket connection and it should
    // connect faster.
    window.addEventListener('beforeunload', function(e) {
        if (ws) {
            stopAllWatchDogs();
            // clearInterval(watchdog_interval);
            // watchdog_interval = undefined;
            ws.close();
            ws = undefined;
        }
        //e.preventDefault(); // per the standard
        //e.returnValue = ''; // required for Chrome
    });
    
    // Get query params.
    var query = getQueryParams(document.location.search);

    // For debugging. 
    // Determine what this could be used for.. 
    // Currently there are no debug controls
    // this was added in older version of the app
    if (query.debug == undefined) {
        //hideAllDebugControls();
    }

    // Initialize WebSocket 
    initWebSocket();
    
});

// Initialize the WebSocket
function initWebSocket() {
    // Close any existing sockets.
    if (ws)	{
        ws.close(); 		// close the websocket if open. This script handles only one websocket
        ws = undefined; 
    };
    
    showStatusModal();
    updateStatus('Connecting...');
    console.log("4.1.1");
    // Create new socket.
    try	{
        connectTryCount++;
        ws = new WebSocket('ws://' + ipAddress + '/stream');
    }
    catch {
        ws.onerror();
    }

    // On open listener
    ws.onopen = function() {
        connected = 1;
        connectTryCount = 0;
        //updateStatus('Connected');
        //hideStatusModal();
        console.log("Connected, checking version");
        newSession = 1;
        startWatchDog();
        getVersion();

        // Get battery reset status disabled in this version 
        //getResetStatus();	
    };

    // On close listener
    ws.onclose = function() {
        connected = 0;
        stopAllWatchDogs();
        console.log("CLOSE");
        //initWebSocket();
    };

    // On error listener
    ws.onerror = function() {
        connected = 0;
        stopAllWatchDogs();
        console.log("ERROR");
        if(connectTryCount > 5){
            updateStatus('Connection Failed');
        } else {
            initWebSocket();
        }
    };

    // Process messages received from firmware/iTracker (incoming responses, for example)
    ws.onmessage = function(event) { 
        if (event.data instanceof Blob) {
            // Message is part of a download
            if ((dlType === 1) && (currentFunction === 9)) {
                // DOWNLOAD DATA TO DISK
            
                // Create a reader to parse blobs.
                var reader = new FileReader();
                reader.readAsText(event.data, "UTF-8");

                // Reader load finished.
                // ReadyState: EMPTY, LOADING, DONE (0,1,2)
                reader.onload = function() {
                    if (reader.readyState == 2) {
                        startDownloadWatchDog();
                        updateStatus("Downloading...");
                        downloadContent += reader.result;
                    }
                    else {
                        console.log("reader other state in onloadend");
                    }
                    return reader.result;
                };

                // Reader aborts.
                reader.onabort = function() {
                    clearInterval(download_interval);
                    download_interval = undefined;
                    console.log("reader aborted: " + reader.error.message);
                }

                // Reader errors.
                reader.onerror = function() {
                    clearInterval(download_interval);
                    download_interval = undefined;
                    console.log("reader error: " + reader.error.message);
                }
            } // DOWNLOAD
        
            // Message in, not a download
            else {
                // Create a reader to parse JSON data from the iTracker.
                // Messages from the iTracker handled in handleMessage
                var reader = new FileReader();
                reader.readAsText(event.data, "UTF-8");

                // Reader load finished.
                // ReadyState: EMPTY, LOADING, DONE (0,1,2)
                reader.onload = function() {
                    if (reader.readyState == 2)	{
                        dataIn += reader.result;

                        // If message is parsed, then the complete JSON message has arrived.
                        // Then send json object to handle message function
                        try {
                            var jsonObject = JSON.parse(dataIn);
                            console.log("iTracker sent:" + dataIn);
                            console.log("Current function is " + currentFunction);
                            handleMessage(jsonObject);

                            // Clear buffers.
                            dataIn = "";
                        }
                        catch {
                            updateStatus("Loading...");
                            return;
                        }
                    }
                    return reader.result;
                };

                // Reader aborts.
                reader.onabort = function() {
                    clearInterval(message_interval);
                }

                // Reader errors.
                reader.onerror = function() {
                    clearInterval(message_interval);
                }

            }
        } 
    }
}

function getVersion() {
    if (ws && (connected == 1)) {
        // Request the current settings.
        var timeout = 5000;
        currentFunction = 5;
        var msg = {
            comm: 6
        };

        if (sendMessage(msg, 1)) {
            updateStatus("Loading...");
        }

        autoReadings_interval = setInterval(function (){
            if (loadingTryCount <= 5) {
                if (sendMessage(msg, 0)) {
                    loadingTryCount++;
                    updateStatus("Loading...");
                }
            } else {
                updateStatus("Connection Failed");
            }
        }, timeout);
    }
}

function loadVersion(jsonObject) {
    var version = jsonObject.Firm_v;

    switch (version) {
        case '4.1.0':
            // Send ipc message to load 4.1.0
            console.log(ipcRenderer.sendSync('update-version', '4.1.0'))
            break;
        case '4.1.1':
            // Continue, because version is correct
            updateStatus('Connected');
            hideStatusModal();
            break;
        default:
            updateStatus('Connected');
            hideStatusModal();
            break;
    }
}

// Get battery reset status disabled in this version 
// function getResetStatus() {
//     setTimeout(() => {
//         $("#batteryModal").modal('show');
//     }, 1000);

//     $("#indexResetBattery").click(function(){ 
//         console.log("Reset Battery");
//         $("#batteryModal").modal('hide');
//         // if (ws && (connected == 1)) {
//         //     var msg = {
//         //         Command: "battery"
//         //     };
//         //     sendMessage(msg, 1);
    
//         //     setTimeout(function (){
//         //         $("#batteryModal").modal('hide');
//         //     }, 200);
//         // }
//     });
// }

function updateStatus(msg) {
    // Status is used for the loading/message modal 
    // Depending on the status, the modal shows different elements
    // Loading spinner, checkmark, X, etc. 
    status = msg;
    console.log(status);

    switch (msg) {
        case 'Connecting...': 
            $("#statusSpinner").removeClass("d-none");
            $("#statusDone").addClass("d-none");
            $("#statusFailed").addClass("d-none");
            $("#statusLabel").text(msg);
            $("#statusLabel").val(msg);
            $("#statusDesc").text("Attempt " + connectTryCount + "/5");

            break;
        case 'Done':
            // Fall through, same as Connected
        case 'Connected':
            $("#statusSpinner").addClass("d-none");
            $("#statusDone").removeClass("d-none");
            $("#statusLabel").text(msg);
            $("#statusLabel").val(msg);
            $("#statusDesc").text("");

            break;
        case 'SD Card Write Complete':
            $("#statusSpinner").addClass("d-none");
            $("#statusDone").removeClass("d-none");
            $("#statusLabel").text(msg);
            $("#statusLabel").val(msg);
            $("#statusDesc").text("You may now remove the SD card from the iTracker");
            break;
        case 'Request Sent...':
            // Fall through, same as Loading
        case 'Loading...':
            $("#statusSpinner").removeClass("d-none");
            $("#statusDone").addClass("d-none");
            $("#statusLabel").text(msg);
            $("#statusLabel").val(msg);
            $("#statusDesc").text("Attempt " + loadingTryCount + "/5");
            break;

        case 'Downloading...':
            // Fall through, same as Writing to SD
        case 'Writing to SD Card...':
            $("#statusDone").addClass("d-none");
            $("#statusSpinner").removeClass("d-none");
            $("#statusLabel").text(msg);
            $("#statusLabel").val(msg);
            break;

        case 'Connection Failed':
            $("#statusSpinner").addClass("d-none");
            $("#statusDone").addClass("d-none");
            $("#statusFailed").removeClass("d-none");
            $("#reloadButton").removeClass("d-none");
            $("#statusLabel").text(msg);
            $("#statusLabel").val(msg);
            $("#statusDesc").text('Check WiFi status, then refresh the page to try again.');
            break;
        case 'demo':
            $("#statusSpinner").addClass("d-none");
            $("#statusDone").addClass("d-none");
            $("#statusFailed").addClass("d-none");
            $("#statusLabel").text(msg);
            $("#statusLabel").val(msg);
            $("#statusDesc").text('Demo log writing in process. Ensure that iTracker LED is blinking once per second. Once LED blink returns to normal, check WiFi connection, then reload this page.');
            break;
        default:
            // Any other message, just update the modal label and hide other elements
            $("#statusLabel").text(msg);
            $("#statusLabel").val(msg);
            $("#statusDesc").text('');

            $("#statusSpinner").addClass("d-none");
            $("#statusDone").addClass("d-none");
            $("#statusFailed").addClass("d-none");
    }
}

// Status Modal
// Hide connection/loading status to user
function hideStatusModal() {
    setTimeout(() => {
        $("#statusModal").modal('hide');
    }, 500);
}

// Show connection/loading status to user
function showStatusModal() {
    $("#statusModal").modal('show');
}

// Shows alert at the top of the screen
// Red for error messages
function showDangerAlert(text) {
    $("#dangerAlert").text(text)
    $("#dangerAlert").show();
    setTimeout(function() {
        $("#dangerAlert").hide();
    }, 5000);
}

// Websocket and Connection Watchdog
function startWatchDog() {
    watchdog_interval = setInterval(function() {
        if (download_interval == undefined) {
            if (connected <= 0)	{
                if(connectTryCount > 5){
                    updateStatus('Connection Failed');
                    clearInterval(watchdog_interval);
                    watchdog_interval = undefined;
                } else {
                    initWebSocket();
                }
            }
            else {
                // Test connection.
                if (ws) {
                    if (ws && (connected == 1)) {
                        var msg = 
                        {
                            comm: 999 // BOGUS KEEP ALIVE
                        };
                        ws.send(JSON.stringify(msg));
                    }
    
                    if (ws.readyState > 1) {
                        ws.close();
                        ws = undefined;
                        showStatusModal();
                        updateStatus('Connecting...');
                    }
                    else {
                        //updateStatus("Connected");
                        connected = 1;
                    }
                }
            }
        }
    }, 2500);
}

// Send message from web page to iTracker via WebSocket
// Messages are in the form of a JSON object, stringify,
// and matches the WiFi_Socket.c formats in the legacy firmware (4.0.5)
function sendMessage(msg, showWaitWin) {
    if (ws && (connected == 1)) { 
        
        // Send as a JSON-formatted string.
        downloadContent = "";
        //jsonData = "";
        //jsonObject = {};
        ws.send(JSON.stringify(msg));
        console.log("sent to iTracker:" + JSON.stringify(msg));
        if(showWaitWin === 1){
            showStatusModal();
        }
    
        return 1;
    }
    else {
        updateStatus("Waiting for Connect...");
        return 0;
    }
}

// Handles messages from the iTracker
function handleMessage(jsonObject) {

    // Handle the message based on the current function
    switch (currentFunction) {
        // Live Page
        case 1: 
            loadLive(jsonObject);
            // console.log("Loaded Live Data");
            loadingTryCount = 0; // Reset reading try count, because it was successful 
            updateStatus('Done');
            hideStatusModal();
            // Start the auto readings.
            /*
            setTimeout(function() {
                $("#arOption2")[0].click();
            }, 3000);
            */
            break;

        // Not used 
        case 2: 
            stopAllWatchDogs();
            loadLive(jsonObject);
            break;
        
        // Get device info (iTracker sees command 6)
        case 5: 
            clearInterval(autoReadings_interval);   
            loadVersion(jsonObject);
            loadingTryCount = 0; // Reset reading try count, because it was successful 
            break;

        // Settings Page
        case 6: 
            // Populate Settings fields.
            clearInterval(autoReadings_interval);
            loadSettings(jsonObject);
            loadingTryCount = 0; // Reset reading try count, because it was successful 
            updateStatus('Done');
            hideStatusModal();
            break; 

        // Download Logs
        case 9:
            // Signal download is done when Downloading to SD card
            // console.log(dlType);
            if (dlType === 2) {
                updateStatus("SD Card Write Complete");
                hideStatusModal();
            }
            break;
        
        // Logs Page 
        case 11: 
            // Populate Logs fields.
            clearInterval(autoReadings_interval);
            loadingTryCount = 0; // Reset try count, because it was successful
            loadLogs(jsonObject);
            updateStatus('Done');
            hideStatusModal();
            break;

        // Alerts Page (Not yet implemented)
        case 13: 
            // Populate Alert fields.
            // $("#Alert_Alarm_1").text(jsonObject.Alarm_1);
            // $("#Alert_Alarm_2").text(jsonObject.Alarm_2);
            // $("#Alert_Alarm_3").text(jsonObject.Alarm_3);
            // $("#alerts_row").css("display", "block");
            break;
        
        // Analytics Page
        case 14:
            // Populate Analytics fields.
            clearInterval(autoReadings_interval);
            loadingTryCount = 0; // Reset try count, because it was successful

            // console.log(jsonObject);
            // console.log(jsonObject.Values);

            if(jsonObject.Values.length === 0 || jsonObject.Values[0].DateTime == undefined) {
                updateStatus('Done');
                hideStatusModal();  
                showDangerAlert("iTracker responded with no values. Check logs within the requested date window.");
            } else if (jsonObject.Values != undefined) {
                //yAxisLabel = jsonObject.Units;
                // DeltaVII = jsonObject.DeltaV_II;
                // DeltaVPeak = jsonObject.DeltaV_Peak;
                drawAnalyticsChart(jsonObject);
            } else {
                //console.log("jsonObject.Values is undefined");
                showAnalyticsPage(true);
            }

            //$("#hist_row").css("display", "block");
            // Now draw the graph.
            
            /*
            setTimeout(function() {
                drawHistoryChart();
            }, 750);
            */

            break;
        
        // Not used 
        case 19: 
            // REPopulate Live fields after toggling the live readings feature.
            loadLive(jsonObject);
            break;
        
        // Not used 
        case 21: 
            // RE-Populate Settings fields.
            clearInterval(autoReadings_interval);
            loadingTryCount = 1; // Reset try count, because it was successful
            loadSettings(jsonObject);
            break;
        
        // Not used 
        case 22: 
            // RE-Populate Settings fields.
            clearInterval(autoReadings_interval);
            loadingTryCount = 1; // Reset try count, because it was successful
            loadSettings(jsonObject);
            break;
        default: break;
    }

    // Message received. Clear the current action.
    currentFunction = 0;

}

// HELPS MANAGE LONG DOWNLOADS
function startDownloadWatchDog() {
    // Stop existing interval for download checking.
    clearInterval(download_interval);

    // Determine the end of a file load through the websocket filereader.progress.
    download_interval = setInterval(function() {
        // Stop polling iTracker on download function.
        currentFunction = 0;

        // Stop this interval.
        clearInterval(download_interval);
        download_interval = undefined;

        // If this fires, then the download is done.
        download(siteName + ".csv", downloadContent);
        
    }, 1000);
}

function stopAllWatchDogs() {
    // Stop message interval.
    clearInterval(message_interval);
    message_interval = undefined;

    // Stop autoreading interval.
    clearInterval(autoReadings_interval);
    autoReadings_interval = undefined;

    // Stop download interval.
    clearInterval(download_interval);
    download_interval = undefined;
    
    // Wait for things to settle down.
    setTimeout(function (){
        // NOTHING HERE.
    }, 1000);
}

// Calls the page function to load data for that page and then update html elements
// Called from the router.js on window.location.hash change
function updatePage(page) {
    clearInterval(autoReadings_interval);
    autoReadings_interval = undefined;

    currentPage = page;
    
    scrollToTop();

    if(currentPage === 'views/live.html'){
        showLivePage();
    }

    if(currentPage === 'views/logs.html') {
        showLogsPage();
    }

    if(currentPage === 'views/analytics.html') {
        showAnalyticsPage(true);
    }

    if(currentPage === 'views/settings.html') {
        showSettingsPage();
    }
}

function scrollToTop() { 
    window.scrollTo(0, 0); 
} 

function getQueryParams(qs) {
    qs = qs.split('+').join(' ');

    var params = {},
        tokens,
        re = /[?&]?([^=]+)=([^&]*)/g;

    while (tokens = re.exec(qs)) {
        params[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
    }
    return params;
}

// Init app router 
function init() {
    var router = new Router([
        new Route('home', 'home.html', true),
        new Route('live', 'live.html'),
        new Route('logs', 'logs.html'),
        new Route('analytics', 'analytics.html'),
        new Route('settings', 'settings.html')
    ]);
}
init();


// Legacy Code

// function hideAllDebugControls() {
//     $(".debug").each(function(i, o) {
//         $(o).css("display", "none");
//     });
// }




// Log sensor manually
// function doSensorLog() {
//     // Log results visually.
//     // Add header for Excel.
//     var query = getQueryParams(document.location.search);
//     //alert(query.debug);

//     // For debugging.
//     if (query.debug != undefined) {
//         var jo = {
//             Sensor_Freq: $("#txtSensorFreq").val(),
//             Sensor_Period: $("#txtSensorPeriod").val(),
//             Sensor_Prescaler: $("#txtSensorPrescaler").val(),
//             Sensor_DutyCycle: $("#txtSensorDutyCycle").val(),
//             Sensor_MaxPulses: $("#txtSensorMaxPulses").val(),
//             Sensor_PulseCnt: $("#txtSensorPulseCnt").val(),
//             Sensor_Blanking: $("#txtSensorBlanking").val(),
//             Sensor_Gain: $("#txtSensorGain").val()
//         };
//         var log = jo.Sensor_Freq + "," +
//             jo.Sensor_Gain + "," +
//             jo.Sensor_Period + "," +
//             jo.Sensor_Prescaler + "," +
//             jo.Sensor_DutyCycle + "," +
//             jo.Sensor_MaxPulses + "," +
//             jo.Sensor_PulseCnt + "," +
//             jo.Sensor_Blanking + "," +
//             $("#Live_distance").text();
//         // Write to memo field.
//         $("#SensorLog").prepend(log + "\n");
//     }
// }



// PAGES



// function doShowAlertsPage() {
//     if (ws && (connected == 1)) {
//         // Request the current settings.
//         currentFunction = 13;
//         var jo = {
//             comm: currentFunction
//         };

//         if (sendMessage(jo, 1)) {
//             $(".ul-menu-button").removeClass("ul-selected");
//             $("#btn_alerts").addClass("ul-selected");
//             updatePage("Alerts");
//         }
//     }
// }
// END PAGES

// function doAutoReading() {
//     if (ws && (connected == 1)) {
//         // Run  the test 1000 in the main.loop
//         currentFunction = 19;
//         var jo = {
//             comm: currentFunction
//         };

//         if (sendMessage(jo, 0)) {
//             // Nothing here
//         }
//     }
// }





// function makeCode () {		
//     var elText = $("#Settings_sn").text();
//     if (!elText) {
//         elText = "0000000000";
//     }
//     qrcode.makeCode(elText);
// }


//
// End app.js
//

