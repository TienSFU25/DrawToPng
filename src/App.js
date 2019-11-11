import React from 'react';
import { setInlineStyles } from './utils';
import './App.css';
import * as d3 from 'd3';
import * as rasterizeHTML from 'rasterizehtml';

class App extends React.Component {
    constructor() {
        super();

        var margin = {top: 0, right: 0, bottom: 0, left: 0},
        width = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

        this.state = {
            margin,
            width,
            height
        };
    }

    saveCanvas = () => {
        let canvas = document.getElementById("canvas");
        let elementToExport = document.querySelector('#sketch');
        setInlineStyles(elementToExport);

        const saveStuff = () => {
            var imageLink = document.getElementById("imageLink");
            var a = document.getElementById("hiddenanchor");

            // Get the Base64 image
            var imageURL = canvas.toDataURL("image/png");
    
            a.href = imageURL;
            a.download = "path.png";
            a.click()
            // console.log("saved the canvas to png", imageURL);
            // imageLink.click();
    
            // also save as json
            var content = window.lastpt;
            var file = new Blob([content], {type: "application/json"});
    
            a.href = URL.createObjectURL(file);
            a.download = "path.json";
            a.click();    
        };

        rasterizeHTML.drawHTML(elementToExport.innerHTML, canvas).then(saveStuff);
    }

    componentDidMount() {
        let {margin, width, height} = this.state;

        // var npoints = 100;
        var ptdata = [];
        var session = [];

        var drawing = false;
        var firstDraw = true;
        
        var line = d3.line()
            .x(function(d, i) { return d.x; })
            .y(function(d, i) { return d.y; });
        
        var svg = d3.select("#sketch").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
        
        svg.append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        
        svg.on("mousedown", listen)
            .on("touchstart", listen)
            .on("touchend", ignore)
            .on("touchleave", ignore)
            .on("mouseup", ignore)
            .on("mouseleave", ignore);

        // only have one path
        var path = svg.append("path")
                    .data([ptdata])
                    .attr("class", "line")
                    .attr("d", line);            

        // ignore default touch behavior
        var touchEvents = ['touchstart', 'touchmove', 'touchend'];
            touchEvents.forEach(function (eventName) {
            document.body.addEventListener(eventName, function(e){
                e.preventDefault();
            });  
        });
        
        function listen () {
            drawing = true;
                        
            ptdata = []; // reset point data
            firstDraw = true;
            // path = svg.append("path") // start a new line
            //     .data([ptdata])
            //     .attr("class", "line")
            //     .attr("d", line);
            
            if (d3.event.type === 'mousedown') {
                svg.on("mousemove", onmove);
            } else {
                svg.on("touchmove", onmove);
            }
        }

        function savePathData() {
            let normalized = ptdata.map((v, i) => {
                return {x: v.x / width, y: v.y / height};
            });
            window.lastpt = JSON.stringify(normalized);
        }
        
        function ignore () {
            svg.on("mousemove", null);
            svg.on("touchmove", null);
            
            // skip out if we're not drawing
            if (!drawing) return;
            drawing = false;
            
            // add newly created line to the drawing session
            session.push(ptdata);

            savePathData();

            // redraw the line after simplification
            tick();
        }
        
        function onmove (e) {
            var type = d3.event.type;
            var point;
            
            if (firstDraw) {
                ptdata.push({x: 0, y: 0});
                firstDraw = false;
            }
            
            if (type === 'mousemove') {
                point = d3.mouse(this);
            } else {
                // only deal with a single touch input
                point = d3.touches(this)[0];
            }
            
            // push a new data point onto the back
            ptdata.push({ x: point[0], y: point[1] });
            tick();
        }
        
        function tick() {
            path.data([ptdata]).attr("d", line) // Redraw the path:
        }
    }

    render() {
        let {width, height} = this.state;

        return (
            <div className="App">
                <div id="sketch"></div>
                <canvas id="canvas" width={width} height={height} className="hidden"></canvas>
                <div>
                    <a id="imageLink" onClick={this.saveCanvas} href="#">
                        Save to PNG/JSON
                    </a>
                    <a id="hiddenanchor" className="hidden" href=""/>
                </div>
            </div>
        );
    }
}

export default App;
