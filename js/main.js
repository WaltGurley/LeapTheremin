//AUDIO SETUP
var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
var controller;

var oscillator = audioCtx.createOscillator();
var gainNode = audioCtx.createGain();
var audioData = audioCtx.createAnalyser();

oscillator.connect(gainNode);
gainNode.connect(audioCtx.destination);
gainNode.gain.value = 0;
oscillator.type = "sine";
oscillator.start(0);

//setupDirections();
setupControls();
setupVis();

//adds in graphical directions for using the program
function setupDirections() {
  var svgContainer = d3.select(".directions").append("svg"),
    svgWidth = parseInt(svgContainer.style("width")),
    svgHeight = parseInt(svgContainer.style("height"));

    d3.json("js/hands.json", function(data) {
      console.log(data);

      hands = svgContainer.selectAll("g")
        .data(data)
        .enter().append("g").append("path")
        .attr({
          "class": function(d) { return "hands " + d.hand; },
          "d": function(d) { return d.d; }
        });

      var handWidth = hands[0][0].getBBox().width;
      var handHeight = hands[0][0].getBBox().height;

      hands.attr({
        "transform": function(d) {
          return d.hand == "left" ?
          "translate(" + svgWidth + ",0)" :
          "translate(" + (svgWidth - handWidth) + ",0)";
        }
      });
    });
}

//CONTROLS SETUP
function setupControls() {
  //list of oscillator types
  var oscTypes = ["sine", "sawtooth", "square", "triangle"];

  //create oscillator type buttons
  var oscChoose = d3.select(".controls").selectAll("button")
    .data(oscTypes)
    .enter()
    .append("button")
    .attr({
      "class": function(d) { return "col-md-3 osc-btn " + d; },
      "type": "button"
    })
    .text(function(d) { return d + " wave"; });

  //make sine oscillator button active
  d3.select(oscChoose[0][0]).classed("active", true);

  //change oscillator when oscillator button is clicked
  oscChoose.on("click", function(d) {
    var pressedBtn = d3.select(this);

    if (pressedBtn.classed("active")) {
      oscChoose.classed("active", false);
    } else {
      oscChoose.classed("active", false);
      pressedBtn.classed("active", true);
    }

    oscillator.type = d;
  });
}

//VISUALIZATIONS
function setupVis() {
  var visContainer = d3.select(".vis-container").append("svg"),
    visWidth = parseInt(visContainer.style("width")),
    visHeight = parseInt(visContainer.style("height"));

  //connect gain connected oscillator to vis
  gainNode.connect(audioData);
  //read data from audio (bufferLength default 1024, UInt8Array returns 0-128)
  var bufferLength = audioData.frequencyBinCount;

  //setup data for sources
  var sourceData = {
    "wave": new Uint8Array(bufferLength),
    "freq": new Uint8Array(bufferLength)
  };

  audioData.getByteTimeDomainData(sourceData.wave);
  audioData.getByteFrequencyData(sourceData.freq);


  var drawWaveform = d3.svg.line()
    .x(function(d,i) { return i * visWidth / bufferLength; })
    .y(function(d) { return (d - 128) + visHeight / 2; })
    .interpolate("linear");

  //create waveform paths for audio sources
  var waveform = visContainer.append("path")
    .data(sourceData.wave)
    .attr({
      "class": "waveform",
      "d": function(d) { return drawWaveform(d); }
    });

  //d3 function for parsing line data for frequenct spectrum
  var drawFreqSpectrum = d3.svg.line()
    .x(function(d,i) { return i * visWidth / bufferLength; })
    .y(function(d) { return visHeight - d; })
    .interpolate("step");

  //create frequency paths for audio sources
  var freqSpectrum = visContainer.append("path")
    .data(sourceData.freq)
    .attr({
      "class": "freq-spec",
      "d": function(d) { return drawFreqSpectrum(d); }
    });

  var freqScale = d3.scale.linear()
    .domain([-300, 300])
    .range([200, 2000]);

  var gainScale = d3.scale.linear()
    .domain([0, 500])
    .range([0, 0.5]);

  var oscTypes = ["sine", "sawtooth", "square", "triangle"],
    oscChange = 0,
    newZ = 0,
    oldZ = newZ;

  controller = new Leap.Controller();

  controller.on("frame", function(frame) {
      audioData.getByteTimeDomainData(sourceData.wave);
      waveform.attr("d", drawWaveform(sourceData.wave));

      audioData.getByteFrequencyData(sourceData.freq);
      freqSpectrum.attr("d", drawFreqSpectrum(sourceData.freq));

      if (frame.hands.length === 0) {
        gainNode.gain.value = 0;
      } else {
        gainNode.gain.value = 0.05;
      }

      frame.hands.forEach(function(hand, index) {
        if (hand.type === "right") {
          oscillator.frequency.value = freqScale(hand.palmPosition[0]);
        }
        if (hand.type === "left") {
          gainNode.gain.value = gainScale(hand.palmPosition[1]);

          newZ = hand.palmVelocity[2];
          if (hand.palmVelocity[2] < -500 && oldZ > -500) {
            //console.log(hand.palmVelocity[2]);
            oscChange++;
            oscillator.type = oscTypes[oscChange % 4];
            d3.selectAll(".osc-btn").classed("active", false);
            d3.select("." + oscTypes[oscChange % 4]).classed("active", true);
          }
          oldZ = newZ;
        }
      });
    });

    controller.connect();
}
