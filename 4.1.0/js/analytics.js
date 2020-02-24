//
// Analytics Page
//

// Start the set up for showing the Analytics page
function showAnalyticsPage(init) {
    if (ws && (connected == 1)) {
        // Remove any intervals for auto readings
        clearInterval(autoReadings_interval);

        var timeout = 30000;

        var graphDays = 1;
        var graphType = 1;
        

        if (init === false) {
            // Number of days to load a graph for. 30 = Load previous 30 days from current date
            var graphDays = parseInt($("#daysDropDown").val());
            if(graphDays == NaN) {
                graphDays = 1;
            }

            // 1=Level 2=VolumeRatio 3=Flow
            var graphType = 1;
            
            // if ($("#levelButton").hasClass('btn-blue-active')) {
            //     graphType = 1;
            // } else if ($("#volumeButton").hasClass('btn-blue-active')) {
            //     graphType = 2;
            // } else if ($("#flowButton").hasClass('btn-blue-active')) {
            //     graphType = 3;
            // }

            
        }
        
        // Request the history data
        currentFunction = 14;
        var msg = {
            comm: currentFunction,
            GraphType: graphType,
            GraphDay: graphDays
        };
        
        if (sendMessage(msg, 1)) {
            updateStatus("Request Sent...");
        }

        // If the message is received, the status will be changed 
        // If status is still Request Sent... Then retry 
        setTimeout(() => {
            
            if(status === "Request Sent...") {
                console.log("Trying again...");
                showAnalyticsPage(init);
            } 
        }, 10000);

    } else {
        console.log("Tried to show Analytics page, but not connected");
    }
}

// Change the styling when button is clicked
// Can be Level, Volume Ratio, or Flow
// function setGraphType(type) {
//     //if(type !== graphType) {
//     //graphType = type;

//     if(type === 1) {
//         $("#levelButton").addClass("active");
//     } else if(type === 2) {
//         $("#volumeButton").addClass("active");
//     } else if(type === 3) {
//         $("#flowButton").addClass("active");
//     }

//     // Reload chart
//     showAnalyticsPage();
//     //}
// }

// After data is received from the iTracker,
// start drawing the chart
function drawAnalyticsChart(AnalyticsData) {
    if($("#chart").length > 0) {
        
        // Get the graph days and type
        var graphDays = $("#daysDropDown").val();
        
        var step = 1;

        var graphType = 1;
        if ($("#levelButton").hasClass('btn-blue-active')) {
            graphType = 1;
        } else if ($("#volumeButton").hasClass('btn-blue-active')) {
            graphType = 2;
        } else if ($("#flowButton").hasClass('btn-blue-active')) {
            graphType = 3;
        }

        // Units to show for the graph's x axis
        var graphUnit = 'hour';  
        if (graphDays >= 7) {
            graphUnit = 'day';
        } 

        var yAxisLabel = AnalyticsData.Units;
        var xAxisLabel = "Date";
        
        var blue = 'rgb(48, 194, 255)';
        var white = 'rgb(255, 255, 255)';
        
        // Load the axis labels.
        var dt2 = new Date();							// End Date (today)
        var dt1 = new Date(dt2.valueOf());				// Begin Date (days into psst)
        dt1.setDate(dt2.getDate() - graphDays);
        
        var LegendLabel = "";
        switch (graphType) {
            case 1: 
                LegendLabel = "LEVEL";
                break;
            case 2: 
                LegendLabel = "VOLUME";
                break;
            case 3: 
                LegendLabel = "FLOW";
                break;
            default:
                LegendLabel = "LEVEL";
                break;
        }        
        
        var valueArray = []; 
        var labelArray = []; 

        for (var i = 0; i < AnalyticsData.Values.length; i++)
        {
            if (labelArray.push(AnalyticsData.Values[i].DateTime)) {
                // labelArray.push(AnalyticsData.Values[i].DateTime.toString()); //i.toString());
                valueArray.push(AnalyticsData.Values[i].Value.toString()); //i.toString());
            }
        }

        // Label array values are in this format: 01/01/2000 12:12
        // Split on the space, then take the first element to get just 01/01/2000
        var startDate = labelArray[0].split(' ');
        var endDate = labelArray[labelArray.length - 1].split(' ');
        var graphTitle = "Log Period From: " +
            startDate[0] +
            " To: " +
            endDate[0];

        var config = {
            type: 'line',
            data: { 
                labels: labelArray,
                datasets: [
                {
                    label: LegendLabel,
                    data: valueArray, 
                    backgroundColor: blue,
                    borderColor: blue,
                    borderWidth: 0,
                    fill: false,
                }]
            },
            options: {
                title: {
                    fontColor: white,
                    fontSize: 20,
                    display: true,
                    text: graphTitle,
                },
                tooltips: {
                    mode: 'index',
                    intersect: true,
                },
                hover: {
                    mode: 'point',
                    intersect: true
                },
                responsive: true, //lets us resize our chart
                maintainAspectRatio: false,  
                elements: {
                    point:{
                        radius: 2,
                        borderWidth: 2
                    }
                },
                scales: {
                    xAxes: [{
                        gridLines: {
                            drawnOnChartArea: false
                        },
                        type: 'time',
                        time: {
                            unit: graphUnit
                        },
                        ticks: {
                            minRotation: 45,
                            autoSkip: true
                        },
                        scaleLabel: {
                            fontColor: white,
                            fontSize: 22,
                            display: true,
                            labelString: xAxisLabel
                        }
                    }],
                    yAxes: [{
                        ticks: {
                            type: 'linear',
                            beginAtZero: true,
                            autoSkip: true,
                            stepSize: 1
                        },
                        scaleLabel: {
                            fontColor: white,
                            fontSize: 22,
                            display: true,
                            labelString: yAxisLabel
                        }
                    }]
                }
            },
            // plugins: [{
            //     beforeDraw: function(c) {
            //     var chartHeight = c.chart.height;
            //     c.scales['y-axis-0'].options.ticks.fontSize = chartHeight * 4 / 100;
            //     }
            // }]
        };
        
        Chart.defaults.global.defaultFontColor = 'white';
        
        if (graph == undefined) {
            var ctx = document.getElementById('chart').getContext('2d');
            graph = new Chart(ctx, config);
        } else {
            graph.destroy();
            var ctx = document.getElementById('chart').getContext('2d');
            graph = new Chart(ctx, config);
        }

        loadAnalytics();

    } else {
        setTimeout(() => {
            drawAnalyticsChart(AnalyticsData);
        }, 100);
    }
    
}

// Populate the Analytics page 
// Add content, set up click handlers
function loadAnalytics() {

    $("#levelButton").click(function(){ 
        //setGraphType(1); 
        $("#levelButton").addClass("btn-blue-active");
        $("#volumeButton").removeClass("btn-blue-active");
        $("#flowButton").removeClass("btn-blue-active");
        showAnalyticsPage(false);
    });

    // $("#volumeButton").click(function() { 
    //     //setGraphType(2);
    //     $("#levelButton").removeClass("btn-blue-active");
    //     $("#volumeButton").addClass("btn-blue-active");
    //     $("#flowButton").removeClass("btn-blue-active");
    //     showAnalyticsPage(false);
    // });
    
    // $("#flowButton").click(function() { 
    //     //setGraphType(3);
    //     $("#levelButton").removeClass("btn-blue-active");
    //     $("#volumeButton").removeClass("btn-blue-active");
    //     $("#flowButton").addClass("btn-blue-active");
    //     showAnalyticsPage(false);
    // });

    $("#btnDays1").click(function() {
        // graphDays = 1;
        // graphUnit = "hour";
        $("#daysDropDown").text("1 Day");
        $("#daysDropDown").val(1);
        showAnalyticsPage(false);
    });

    $("#btnDays7").click(function() {
        // graphDays = 7;
        // graphUnit = "day";
        $("#daysDropDown").text("7 Days");
        $("#daysDropDown").val(7);
        showAnalyticsPage(false);
    });

    $("#btnDays30").click(function() {
        // graphDays = 30;
        // graphUnit = "week";
        $("#daysDropDown").text("30 Days");
        $("#daysDropDown").val(29);
        showAnalyticsPage(false);
    });

    $("#saveChartAsImage").unbind("click").click(function() {
        $("#chart").get(0).toBlob(function(blob) {
            download("chart.png", blob);
        });
    });
    
    updateStatus('Done');
    hideStatusModal();
    
}

//
// End Analytics Page 
//

