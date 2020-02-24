//
// Logs Page
//

// Start the set up for showing the logs page
function showLogsPage() {
    if (ws && (connected == 1)) {
        // Remove any intervals for auto readings
        clearInterval(autoReadings_interval);

        // Request Logs data.
        var timeout = 5000;
        currentFunction = 11;
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

    } else {
        console.log("Tried to show logs page, but not connected");
    }
}

// Populate Logs page.
// Add content, set up click handlers
function loadLogs(jsonObject) {
    // Check for an element on the logs page, to make sure the router has finished loading the html
    // If this function is called before the router finishes loading the page, then the values weren't
    // getting added to the page. This small delay and retry fixes that issue
    if($("#LogsSiteName").length > 0) {
        siteName = jsonObject.Site_Name;
        $("#LogsSiteName").text(jsonObject.Site_Name);
        $("#LogsStartDate").text(jsonObject.startDate);
        $("#LogsLastDate").text(jsonObject.lastDate);
        $("#LogsLogResults").text(jsonObject.log_results);
        $("#LogsLogInterval").text(jsonObject.logInterval);

        $("#downloadNew").click(function(){ downloadNew(); });
        $("#downloadAll").click(function(){ downloadAll(); });
        $("#writeSD").click(function() { writeToSD(); });
        $("#clearLogs").click(function() { clearLogs(); });
    } else {
        setTimeout(() => {
            loadLogs(jsonObject);
        }, 100);
    }

}

// Download the log file. Browser dependent.
function download(filename, text) {
    // Stop existing interval for download checking.
    clearInterval(download_interval);
    download_interval = undefined;

    // Create an anchor tag programmatically and then "click" it for download.
    var element = document.createElement('a');
    var blob = new Blob([text], {type: "text/plain;charset=UTF-8"});
    var downloadUrl = URL.createObjectURL(blob);
    element.setAttribute('href', downloadUrl);
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    
    console.log("Download Done");

    updateStatus('Done');
    hideStatusModal();

    // Slight delay removing the data element.
    setTimeout(function() {
        URL.revokeObjectURL(downloadUrl);
        document.body.removeChild(element);
    }, 1000);
}		

// Send message to the iTracker for all logs 
function downloadAll() {
    if (ws && (connected == 1)) {
        // Clear buffer;
        downloadContent = "";
        
        currentFunction = 9; 
        dlType = 1;
        var jo = 
        {
            comm: currentFunction,
            dlType: dlType,
            startTime: 0
        };
        sendMessage(jo, 1);
        updateStatus("Downloading...");
    }
}

// Send message to the iTracker for 'new' logs
// Eg. Logs from last lastDate to newest
function downloadNew() {
    if (ws && (connected == 1)) {
        // Clear buffer;
        downloadContent = "";
        
        currentFunction = 9;
        dlType = 1;
        var jo = 
        {
            comm: currentFunction,
            dlType: dlType,
            startTime: 1
        };
        sendMessage(jo, 1);
        updateStatus("Downloading...");
    }
}

// Send message to iTracker to write all logs to the SD card 
function writeToSD() {
    if (ws && (connected == 1)) {
        // Clear buffer;
        downloadContent = "";
        
        currentFunction = 9; 
        dlType = 2;
        var jo = 
        {
            comm: currentFunction,
            dlType: dlType,
            startTime: 0
        };
        sendMessage(jo, 1);
        updateStatus("Writing to SD Card...");
    }
}

// Send message to the iTracker to delete all logs
function clearLogs() {
    if (ws && (connected == 1)) {
        currentFunction = 0;
        var jo = {
            Command: "clear"
        }
        
        if (sendMessage(jo, 1)) {
            updateStatus("Done");
        }
        
        setTimeout(function () {
            showLogsPage()
        }, 2000);
    }
}

//
// End Logs Page
//

