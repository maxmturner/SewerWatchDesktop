//
// Live Page 
//  

// Start the set up for showing the live page
function showLivePage() {
    if (ws && (connected == 1)) {
        // Request a live reading.
        currentFunction = 1;
        var msg = {
            comm: currentFunction
        };
        
        if (sendMessage(msg, 1)) {
            loadingTryCount++;
            autoReadings();
            updateStatus("Loading...");
        }
    } else {
        console.log("Tried to show live page, but not connected");
        updateStatus("Connection Failed");
    }
}

// Populate Live page
// Add content, set up click handlers
function loadLive(jsonObject) {
    siteName = jsonObject.Site_Name;
    document.getElementById("Live_Site_Name").innerHTML = jsonObject.Site_Name;
    document.getElementById("Live_Log_DateTime").innerHTML = jsonObject.Log_DateTime;
    document.getElementById("Live_distance").innerHTML = jsonObject.distance;
    document.getElementById("Live_gain").innerHTML = jsonObject.gain;
    document.getElementById("Live_level").innerHTML = jsonObject.level;
    document.getElementById("Live_temp").innerHTML = jsonObject.temp;
    document.getElementById("Live_battery").innerHTML = jsonObject.battery.toString() + "%";
    
    // Set the image used for battery indicator
    var batteryIcon = $("#batteryIcon");
    if(jsonObject.battery <= 25) {
        batteryIcon.attr("src","images/battery-low.png");
    } else if(jsonObject.battery <= 50) {
        batteryIcon.attr("src","images/battery-mid.png");
    } else if(jsonObject.battery <= 75) {
        batteryIcon.attr("src","images/battery-good.png");
    } else if(jsonObject.battery > 75) {
        batteryIcon.attr("src","images/battery-full.png");
    }
    batteryIcon.removeClass("d-none");
}

// Start automatic readings on live page.
function autoReadings() {
    // Remove previous intervals for auto readings 
    clearInterval(autoReadings_interval);
    autoReadings_interval = undefined;
    var timeout = 10000;

    // var query = getQueryParams(document.location.search);
    // if (query.debug) {
    //     timeout = 5000;
    // }

    // Only run if on the live page.
    if (currentPage === 'live.html') {
        autoReadings_interval = setInterval(function (){
            liveReading();

            // if (query.debug) {
            //     // These WRITE LOGS in debug mode
            //     doAutoReading();
            // }
            // else {
            //     // These DO NOT WRITE LOGS. This is the user mode.
            //     
            // }
        }, timeout);
    } else {
        clearInterval(autoReadings_interval);
        autoReadings_interval = undefined;
    }
}

// Sends a request to the iTracker for a live reading
function liveReading() {
    if (ws && (connected == 1)) {
        // For DEBUG - not written to log.
        console.log("Doing auto live reading");
        currentFunction = 1;
        var msg = {
            comm: currentFunction
        };

        if(loadingTryCount < 5) {
            if (sendMessage(msg, 1)) {
                loadingTryCount++;
                updateStatus("Loading...");
            }
        } else {
            updateStatus("Connection Failed");
        }
        
    }
}

//
// End Live Page 
//

