<!-- Author: Bo Ericsson, bo@boe.net -->
<!-- Inspiration from numerous examples by Mike Bostock, http://bl.ocks.org/mbostock, -->
<!-- and example by Andy Aiken, http://blog.scottlogic.com/2014/09/19/interactive.html -->
'use strict';

function realTimeChart() {

  var version = "0.1.0",
      datum, initialData, data,
      maxSeconds = 300, pixelsPerSecond = 10,
      svgWidth = 700, svgHeight = 300,
      margin = { top: 20, bottom: 20, left: 50, right: 30, topNav: 10, bottomNav: 20 },
      dimension = { chartTitle: 20, xAxis: 20, yAxis: 20, xTitle: 20, yTitle: 20, navChart: 70 },
      barWidth = 3,
      maxY = 100, minY = 0,
      chartTitle, yTitle, xTitle,
      drawXAxis = true, drawYAxis = true, drawNavChart = true,
      border,
      selection,
      barId = 0;

  // create the chart
  var chart = function(s) {
    selection = s;
    if (selection == undefined) {
      console.error("selection is undefined");
      return;
    };

    // process titles
    chartTitle = chartTitle || "";
    xTitle = xTitle || "";
    yTitle = yTitle || "";

    // compute component dimensions
    var chartTitleDim = chartTitle == "" ? 0 : dimension.chartTitle;
    var xTitleDim = xTitle == "" ? 0 : dimension.xTitle;
    var yTitleDim = yTitle == "" ? 0 : dimension.yTitle;
    var xAxisDim = !drawXAxis ? 0 : dimension.xAxis;
    var yAxisDim = !drawYAxis ? 0 : dimension.yAxis;
    var navChartDim = !drawNavChart ? 0 : dimension.navChart;

    // compute chart dimension and offset
    var marginTop = margin.top + chartTitleDim;
    var height = svgHeight - marginTop - margin.bottom - chartTitleDim - xTitleDim - xAxisDim - navChartDim + 30;
    var heightNav = navChartDim - margin.topNav - margin.bottomNav;
    var marginTopNav = svgHeight - margin.bottom - heightNav - margin.topNav;
    var width = svgWidth - margin.left - margin.right;
    var widthNav = width;

    // append the svg
    var svg = selection.append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight)
        .style("border", function(d) { 
          if (border) return "1px solid lightgray"; 
          else return null;
        });

    // create main group and translate
    var main = svg.append("g")
        .attr("transform", "translate (" + margin.left + "," + marginTop + ")");

    // define clip-path
    main.append("defs").append("clipPath")
        .attr("id", "myClip")
      .append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", width)
        .attr("height", height);

    // create chart background
    main.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", width)
        .attr("height", height)
        .style("fill", "#f5f5f5");

    // note that two groups are created here, the latter assigned to barG;
    // the former will contain a clip path to constrain objects to the chart area; 
    // no equivalent clip path is created for the nav chart as the data itself
    // is clipped to the full time domain
    var barG = main.append("g")
        .attr("class", "barGroup")
        .attr("transform", "translate(0, 0)")
        .attr("clip-path", "url(#myClip")
      .append("g");

    // add group for x axis
    var xAxisG = main.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")");

    // add group for y axis
    var yAxisG = main.append("g")
        .attr("class", "y axis");

    // in x axis group, add x axis title
    xAxisG.append("text")
        .attr("class", "title")
        .attr("x", width / 2)
        .attr("y", 25)
        .attr("dy", ".71em")
        .text(function(d) { 
          var text = xTitle == undefined ? "" : xTitle;
          return text; 
        });

    // in y axis group, add y axis title
    yAxisG.append("text")
        .attr("class", "title")
        .attr("transform", "rotate(-90)")
        .attr("x", - height / 2)
        .attr("y", -35)
        .attr("dy", ".71em")
        .text(function(d) { 
          var text = yTitle == undefined ? "" : yTitle;
          return text; 
        });

    // in main group, add chart title
    main.append("text")
        .attr("class", "chartTitle")
        .attr("x", width / 2)
        .attr("y", -20)
        .attr("dy", ".71em")
        .text(function(d) { 
          var text = chartTitle == undefined ? "" : chartTitle;
          return text; 
        });

    // define main chart scales
    var x = d3.time.scale().range([0, width]);
    var y = d3.scale.linear().domain([minY, maxY]).range([height, 0]);

    // define main chart axis
    var xAxis = d3.svg.axis().orient("bottom");
    var yAxis = d3.svg.axis().orient("left");

    // add nav chart
    var nav = svg.append("g")
        .attr("transform", "translate (" + margin.left + "," + marginTopNav + ")");

    // add nav background
    nav.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", width)
        .attr("height", heightNav)
        .style("fill", "#F5F5F5")
        .style("shape-rendering", "crispEdges")
        .attr("transform", "translate(0, 0)");

    // add group to hold line and area paths
    var navG = nav.append("g")
        .attr("class", "nav");

    // add group to hold nav x axis
    var xAxisGNav = nav.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + heightNav + ")");

    // define nav scales
    var xNav = d3.time.scale().range([0, widthNav]);
    var yNav = d3.scale.linear().domain([minY, maxY]).range([heightNav, 0]);

    // define nav axis
    var xAxisNav = d3.svg.axis().orient("bottom");

    // define function that will draw the nav area chart
    var navArea = d3.svg.area()
        .x(function (d) { return xNav(d.time); })
        .y1(function (d) { return yNav(d.value); })
        .y0(heightNav);

    // define function that will draw the nav line chart
    var navLine = d3.svg.line()
        .x(function (d) { return xNav(d.time); })
        .y(function (d) { return yNav(d.value); });

    // compute initial time domains...
    var ts = new Date().getTime();

    // first, the full time domain
    var endTime = new Date(ts);
    var startTime = new Date(endTime.getTime() - maxSeconds * 1000);
    var interval = endTime.getTime() - startTime.getTime();

    // then the viewport time domain (what's visible in the main chart 
    // and the viewport in the nav chart)
    var endTimeViewport = new Date(ts);
    var startTimeViewport = new Date(endTime.getTime() - width / pixelsPerSecond * 1000);
    var intervalViewport = endTimeViewport.getTime() - startTimeViewport.getTime();
    var offsetViewport = startTimeViewport.getTime() - startTime.getTime();

    // set the scale domains for main and nav charts
    x.domain([startTimeViewport, endTimeViewport]);
    xNav.domain([startTime, endTime]); 

    // update axis with modified scale
    xAxis.scale(x)(xAxisG);
    yAxis.scale(y)(yAxisG);
    xAxisNav.scale(xNav)(xAxisGNav);

    // create brush (moveable, changable rectangle that determines 
    // the time domain of main chart)
    var viewport = d3.svg.brush()
        .x(xNav)
        .extent([startTimeViewport, endTimeViewport])
        .on("brush", function () {
          // get the current time extent of viewport
          var extent = viewport.extent();

          startTimeViewport = extent[0];
          endTimeViewport = extent[1];
          intervalViewport = endTimeViewport.getTime() - startTimeViewport.getTime();
          offsetViewport = startTimeViewport.getTime() - startTime.getTime();

          // handle invisible viewport
          if (intervalViewport == 0) {
            intervalViewport = maxSeconds * 1000;
            offsetViewport = 0;
          }

          // update the x domain of the main chart
          x.domain(viewport.empty() ? xNav.domain() : extent);

          // update the x axis of the main chart
          xAxis.scale(x)(xAxisG);

          // update display
          refresh();
        });

    // create group and assign to brush
    var viewportG = nav.append("g")
        .attr("class", "viewport")
        .call(viewport)
        .selectAll("rect")
        .attr("height", heightNav);


    // initial invocation
    data = initialData || [];

    // update display
    refresh();


    // function to refresh the viz upon changes of the time domain 
    // (which happens constantly), or after arrival of new data,
    // or at init
    function refresh() {

      // process data to remove too late or too early data items 
      // (the latter could occur if the chart is stopped, while data
      // is being pumped in)
      data = data.filter(function(d) {
        if (d.time.getTime() > startTime.getTime() &&
            d.time.getTime() < endTime.getTime()) 
          return true;
      })

      // here we bind the new data to the main chart
      // note: no key function is used here; therefore the data binding is
      // by index, which effectivly means that available DOM elements
      // are associated with each item in the available data array, from 
      // first to last index; if the new data array contains fewer elements
      // than the existing DOM elements, the LAST DOM elements are removed;
      // basically, for each step, the data items "walks" leftward (each data 
      // item occupying the next DOM element to the left);
      // This data binding is very different from one that is done with a key 
      // function; in such a case, a data item stays "resident" in the DOM
      // element, and such DOM element (with data) would be moved left, until
      // the x position is to the left of the chart, where the item would be 
      // exited
      var updateSel = barG.selectAll(".bar")
          .data(data);

      // remove items
      updateSel.exit().remove();

      // append items
      updateSel.enter().append("rect")
          .attr("class", "bar")
          .attr("id", function() { 
            return "bar-" + barId++; 
          })
          .attr("shape-rendering", "crispEdges");

      // update items
      updateSel
          .attr("x", function(d) { return Math.round(x(d.time) - barWidth); })
          .attr("y", function(d) { return y(d.value); })
          .attr("width", barWidth)
          .attr("height", function(d) { return height - y(d.value); })
          .style("fill", function(d) { return d.color == undefined ? "black" : d.color; })
          //.style("stroke", "none")
          //.style("stroke-width", "1px")
          //.style("stroke-opacity", 0.5)
          .style("fill-opacity", 1);

      // also, bind data to nav chart
      // first remove current paths
      navG.selectAll("path").remove();

      // then append area path...
      navG.append('path')
          .attr('class', 'area')
          .attr('d', navArea(data));

      // ...and line path
      navG.append('path')
          .attr('class', 'line')
          .attr('d', navLine(data)); 
    
    } // end refreshChart function


    // function to keep the chart "moving" through time (right to left) 
    setInterval(function() {

      // get current viewport extent
      var extent = viewport.empty() ? xNav.domain() : viewport.extent();
      var interval = extent[1].getTime() - extent[0].getTime();
      var offset = extent[0].getTime() - xNav.domain()[0].getTime();

      // compute new nav extents
      endTime = new Date();
      startTime = new Date(endTime.getTime() - maxSeconds * 1000);

      // compute new viewport extents 
      startTimeViewport = new Date(startTime.getTime() + offset);
      endTimeViewport = new Date(startTimeViewport.getTime() + interval);
      viewport.extent([startTimeViewport, endTimeViewport])

      // update scales
      x.domain([startTimeViewport, endTimeViewport]);
      xNav.domain([startTime, endTime]);

      // update axis
      xAxis.scale(x)(xAxisG);
      xAxisNav.scale(xNav)(xAxisGNav);

      // refresh svg
      refresh();

    }, 200)

    // end setInterval function

    return chart;

  } // end chart function


  // chart getter/setters
 
  // array of inital data
  chart.initialData = function(_) {
    if (arguments.length == 0) return initialData;
    initialData = _;
    return chart;
  }

  // new data item (this most recent item will appear 
  // on the right side of the chart, and begin moving left)
  chart.datum = function(_) {
    if (arguments.length == 0) return datum;
    datum = _;
    data.push(datum);
    return chart;
  }

  // svg width
  chart.width = function(_) {
    if (arguments.length == 0) return svgWidth;
    svgWidth = _;
    return chart;
  }

  // svg height
  chart.height = function(_) {
    if (arguments.length == 0) return svgHeight;
    svgHeight = _;
    return chart;
  }

  // svg border
  chart.border = function(_) {
    if (arguments.length == 0) return border;
    border = _;
    return chart;       
  }

  // chart title
  chart.title = function(_) {
    if (arguments.length == 0) return chartTitle;
    chartTitle = _;
    return chart;   
  }

  // x axis title
  chart.xTitle = function(_) {
    if (arguments.length == 0) return xTitle;
    xTitle = _;
    return chart;       
  }

  // y axis title
  chart.yTitle = function(_) {
    if (arguments.length == 0) return yTitle;
    yTitle = _;
    return chart;       
  }

  // bar width
  chart.barWidth = function(_) {
    if (arguments.length == 0) return barWidth;
    barWidth = _;
    return chart;       
  }

  // version
  chart.version = version;
  
  return chart;

} // end realTimeChart function
