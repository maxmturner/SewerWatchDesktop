//
// Settings Page
//

// Start the set up for showing the settings page
function showSettingsPage() {
    if (ws && (connected == 1)) {
        // Request the current settings.
        var timeout = 5000;
        currentFunction = 6;
        var msg = {
            comm: currentFunction
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

// Populate the settings page
// Add content, set up click handlers
function loadSettings(jsonObject) {
    // Check for an element on the settings page, to make sure the router has finished loading the html
    // If this function is called before the router finishes loading the page, then the values weren't
    // getting added to the page. This small delay and retry fixes that issue
    if($("#siteName").length > 0) {
        siteName = jsonObject.Site_Name;
        // Input fields.
        $("#siteName").val(jsonObject.Site_Name);
        $("#households").val(jsonObject.Population);
        $("#pipeID").val(jsonObject.Pipe_ID);
        $("#damping").val(jsonObject.Damping);
        $("#logInterval").val(jsonObject.logInterval);
        $("#units").val(jsonObject.sysm);
        
        // If wifi wake up is a nonzero value, then it is on
        // 0 is off
        if(jsonObject.wifiWakeUp > 0) {
            $("#wifiWakeUp").val("1");
        } else {
            $("#wifiWakeUp").val("0");
        }
    
        // Labels
        $("#dateLabel").text(jsonObject.Log_DateTime);
        $("#batteryLabel").text(jsonObject.Battery + '%');
        $("#serialNumber").text(jsonObject.sn);
        $("#firmwareLabel").text(jsonObject.Firm_v);
        $("#iTrackerType").text(jsonObject.mode);


        // Each button on the settings page shows a confirmation modal
        // For each button, set the modal content and tie the confirm button to an action function 

        $("#saveSettings").click(function(){ 
            confirmSettings();
        });

        $("#setLevelButton").click(function(){ 
            $("#modalTitleText").text("Set Level");
            $("#modalDescText").text("Are you sure you want to set iTracker Level to " + $("#levelInput").val() + "?"); 
            $("#confirmButton").addClass("btn-primary");
            $("#confirmButton").removeClass("btn-danger");
            $("#confirmButton").click(function(){ setLevel(); });
        });

        $("#syncTimeButton").click(function(){
            // Format date for iTracker
            var dt = new Date();
            var yyyy = dt.getFullYear();
            var mm = dt.getMonth() < 9 ? "0" + (dt.getMonth() + 1) : (dt.getMonth() + 1); // getMonth() is zero-based
            var dd  = dt.getDate() < 10 ? "0" + dt.getDate() : dt.getDate();
            var hh = dt.getHours() < 10 ? "0" + dt.getHours() : dt.getHours();
            var min = dt.getMinutes() < 10 ? "0" + dt.getMinutes() : dt.getMinutes();
            var ss = dt.getSeconds() < 10 ? "0" + dt.getSeconds() : dt.getSeconds();
            var datestring = "".concat(mm+"/").concat(dd+"/").concat(yyyy+" ").concat(hh+":").concat(min+":").concat(ss);

            $("#modalTitleText").text("Sync Time");
            $("#modalDescText").text("Are you sure you want to sync the iTracker's clock to " + datestring + "?"); 
            $("#confirmButton").addClass("btn-primary");
            $("#confirmButton").removeClass("btn-danger");
            $("#confirmButton").click(function(){ syncTime(datestring); });
        });

        $("#resetBatteryButton").click(function(){
            $("#modalTitleText").text("Reset Battery");
            $("#modalDescText").text("Are you sure you want to reset the iTracker's battery level?"); 
            $("#confirmButton").addClass("btn-primary");
            $("#confirmButton").removeClass("btn-danger");
            $("#confirmButton").click(function(){ resetBattery(); });
        });

        $("#newSiteButton").click(function(){
            $("#modalTitleText").text("New Site");
            $("#modalDescText").text("Are you sure you want to clear settings and set up as a new site?"); 
            $("#confirmButton").addClass("btn-danger");
            $("#confirmButton").removeClass("btn-primary");
            $("#confirmButton").click(function(){ newSite(); });
        });

        $("#ssidButton").click(function(){
            console.log("SSID Clicked");
            var ssid = $("#ssidInput").val();
            console.log(ssid);
            
            $("#modalTitleText").text("Set SSID");
            $("#modalDescText").text("Are you sure you want to broadcast WiFi with the SSID of: " + ssid +  
            "? This will end the current session and you will need to reconnect to the iTracker's WiFi network.");
            $("#confirmButton").addClass("btn-primary");
            $("#confirmButton").removeClass("btn-danger");      
            $("#confirmButton").click(function(){ setSSID(); });
        });

        $("#adminCommandButton").click(function(){
            var command = $("#adminCommandInput").val()

            $("#modalTitleText").text("Admin Command");
            $("#modalDescText").text("Are you sure you want to send '" + command + "' to the iTracker?"); 
            $("#confirmButton").addClass("btn-danger");
            $("#confirmButton").removeClass("btn-primary");
            $("#confirmButton").click(function(){ sendCommand(); });
        });

    } else {
        setTimeout(() => {
            loadSettings(jsonObject);
        }, 100);
    }

    // Cellular
    /*
    $("#Settings_cell_carrier select").val(jsonObject.cell_carrier.toString().trim());
    $("#Settings_cell_carrier select").text(jsonObject.cell_carrier.toString().trim());
    $("#Settings_cell_apn select").val(jsonObject.cell_apn.toString().trim());
    $("#Settings_cell_apn select").text(jsonObject.cell_apn.toString().trim());
    $("#Settings_cell_imei").text(jsonObject.cell_imei.toString().trim());
    $("#Settings_cell_imeisv").text(jsonObject.cell_imeisv.toString().trim());
    $("#Settings_cell_error").text(jsonObject.cell_error.toString().trim());
    */

}

// Called when the main settings submit button is clicked. 
// Initially, step is 0, and then values are checked, if necessary a warning is shown on the screen.
// If the warning is confirmed, then the function increments the step, and calls this function again. 
// At the end of the steps, saveSettings is called which submits the values to the iTracker
function confirmSettings() {
    var wifiWakeUp = $("#wifiWakeUp").val(); 
    var pipeID = $("#pipeID").val();

    // Set the modal title text
    $("#modalTitleText").text("Save Settings");

    // Get the description text and empty out any previous messages 
    var warningTextContainer = $("#modalDescText");
    warningTextContainer.empty();

    // Add in the base message
    $("#modalDescText").append("<h5>Are you sure you want to save these settings?</h5>");
    
    // If these conditions are met, add the appropriate warnings to the description text
    if(wifiWakeUp === "1") {
        warningTextContainer.append("<p><b>Warning: WiFi Wake Up. </b></p>");
        warningTextContainer.append("<p>Enabling WiFi wakeup will cause your iTracker to wake up and broadcast wifi on a 5 minute interval. This will cause a significant decrease in battery life.</p>");
        $("#confirmButton").addClass("btn-danger");
        $("#confirmButton").removeClass("btn-primary");
    } else {
        $("#confirmButton").addClass("btn-primary");
        $("#confirmButton").removeClass("btn-danger");
    }

    if(pipeID > 12) {
        warningTextContainer.append("<p><b>Warning: Pipe Size greater than 12.</b></p>");
        warningTextContainer.append("<p>For accuracy, a one time velocity measurement is recommended. See Manual or contact Eastech.</p>");
        $("#confirmButton").addClass("btn-danger");
        $("#confirmButton").removeClass("btn-primary");
    } else {
        $("#confirmButton").addClass("btn-primary");
        $("#confirmButton").removeClass("btn-danger");
    }

    $("#confirmButton").click(function(){ 
        $("#modalTitleText").empty();
        saveSettings();
    });

    $("#confirmationModal").modal('show');

}

// Sends the values for the settings page inputs to the iTracker
function saveSettings() {
    if (ws && (connected == 1)) {
        var msg = {
            Damping: $("#damping").val(),
            Site_Name: $("#siteName").val(),
            Pipe_ID: $("#pipeID").val(),
            Population: $("#households").val(),
            logInterval: $("#logInterval").val(),
            sysm: $("#units").val(),
            CellCarrier: $("#cellCarrier").val(),
            CellApn: $("#cellApn").val(),
            wifiWakeUp: $("#wifiWakeUp").val()
        };
        
        sendMessage(msg, 1);

        // Request the settings to refresh the page.
        setTimeout(function (){
            showSettingsPage();
        }, 500);
    }
}

// Send message to set the level to user input
function setLevel() {
    if (ws && (connected == 1)) {

        var input = $("#levelInput").val();
        
         // Validate input
        if (isNaN(input) || input === "") {
            showDangerAlert("Error: Level input value must be a number");
        } else {
            var msg = {
                setLevel: $("#levelInput").val()
            };
            sendMessage(msg, 1);
    
            // Request the settings to refresh the page.
            setTimeout(function (){
                showSettingsPage();
            }, 500);
        } 
        
    }
}

// Sync the iTracker's date and time with the system time
function syncTime(date) {
    if (ws && (connected == 1)) {

        var msg = {
            Log_DateTime: '"' + date + '"'
        };

        //alert(JSON.stringify(jo));
        sendMessage(msg, 1);

        // Request the settings to refresh the page.
        setTimeout(function (){
            showSettingsPage();
        }, 500);
    }
}

// Sends message to reset the battery 
function resetBattery() {
    if (ws && (connected == 1)) {
        var msg = {
            Command: "battery"
        };
        sendMessage(msg, 1);

        // Request the settings to refresh the page.
        setTimeout(function (){
            showSettingsPage();
        }, 500);
    }
}

// Resets settings to default
function factoryReset() {
    if (ws && (connected == 1)) {
        // Force Wifi Config reset.
        currentFunction = 6;
        var msg = {
            Command: "reset"
        };

        if (sendMessage(msg, 1)) {
            // Nothing here
        }
    }
}

// Sets the SSID that is broadcasted by the iTracker
function setSSID() {
    if (ws && (connected == 1)) {
        currentFunction = 6;
        var timeout = 5000;
        
        var cmd = "s";
        var ssid = $("#ssidInput").val();
        console.log(cmd + " " + ssid);
        var msg = {
            Command: cmd + " " + ssid
        };

        if (sendMessage(msg, 1)) {
            updateStatus("Connection Failed");
        }
    }
}

// Sends a command to the iTracker
// These are predefined commands that are
// hidden from the user
function sendCommand() {
    if (ws && (connected == 1)) {
        currentFunction = 6;
        var timeout = 5000;

        var cmd = $("#adminCommandInput").val();

        var msg = {
            Command: cmd
        };

        sendMessage(msg, 1);

        if(cmd == "demo" || cmd == "Demo") {
            updateStatus("demo");
        } else {
            updateStatus("Loading...");
            autoReadings_interval = setInterval(function (){
                if (loadingTryCount <= 5) {
                    loadingTryCount++;
                    updateStatus("Loading...");
                } else {
                    updateStatus("Connection Failed");
                }
            }, timeout);
        }
    }
}

// Resets settings for creating a new site
function newSite() {
    if (ws && (connected == 1)) {
        currentFunction = 6;
        var msg = {
            Command: "new"
        };

        sendMessage(msg, 1);

        // Request the settings to refresh the page.
        setTimeout(function (){
            showSettingsPage();
        }, 500);
    } 	
}

// function resetWifiConfig() {
//     if (ws && (connected == 1)) {
//         // Force Wifi Config reset.
//         currentFunction = 21;
//         var msg = {
//             comm: currentFunction
//         };

//         if (sendMessage(msg, 1)) {
//             // Nothing here
//         }
//     }
// }

// function setGain() {
//     if (ws && (connected == 1)) {
//         var msg = {
//             setGain: $("#gain").val()
//         };
//         sendMessage(msg, 1);
//     }
// }

// function doSendSensorConfig(field, value) {
//     if (ws && (connected == 1)) {
    
//         // Perform increments.
//         if (field != '') {
//             $("#" + field).val(parseInt($("#" + field).val()) + value);
//         }
    
//         var jo = {
//             Sensor_Freq: $("#txtSensorFreq").val(),
//             Sensor_Period: $("#txtSensorPeriod").val(),
//             Sensor_Prescaler: $("#txtSensorPrescaler").val(),
//             Sensor_DutyCycle: $("#txtSensorDutyCycle").val(),
//             Sensor_MaxPulses: $("#txtSensorMaxPulses").val(),
//             Sensor_Blanking: $("#txtSensorBlanking").val(),
//             Sensor_Gain: $("#txtSensorGain").val(),
//             Sensor_PulseCnt: $("#txtSensorPulseCnt").val()
//         };
//         sendMessage(jo, 1);
        
//         // Now request new live reading.
//         setTimeout(function() {
//             var jo = {
//                 comm: 1
//             }
//             sendMessage(jo, 1);
//         }, 300);
//     }
// }

//
// End Settings Page
//

