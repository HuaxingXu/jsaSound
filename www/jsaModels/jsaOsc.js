/* ---------------------------------------------------------------------------------------
This jsaSound Code is distributed under LGPL 3
Copyright (C) 2012 National University of Singapore
Inquiries: director@anclab.org

This library is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser General Public License as published by the Free Software Foundation; either version 3 of the License, or any later version.
This library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNULesser General Public License for more details.
You should have received a copy of the GNU General Public License and GNU Lesser General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>
------------------------------------------------------------------------------------------*/

// ******************************************************************************************************
// A "sound model" (which is essentially just an oscillator).
// There is an attack time, a hold until release() is called, and a decay time.
// ******************************************************************************************************
define(
	["jsaSound/jsaSndLib/config", "jsaSound/jsaSndLib/baseSM"],
	function (config, baseSM) {
		return function (i_loadedCB) {
			
			var	oscNode;// = config.audioContext.createOscillator();  // have to keep recreating this node every time we want to play (if we are not already playing)
			var	gainEnvNode = config.audioContext.createGain();
			var	gainLevelNode = config.audioContext.createGain(); 

			var k_gainFactor = .35;

			// defaults for setting up initial values (and displays) 
			var m_gainLevel = 0.2;    // the point to (or from) which gainEnvNode ramps glide
			var m_frequency = 440;

			var m_type=1;

			var m_attackTime = 0.05;
			var m_releaseTime = 1.0;
			var stopTime = 0.0;        // will be > config.audioContext.currentTime if playing


			// (Re)create the nodes and thier connections.
			// Must be called everytime we want to start playing since in this model, osc nodes are *deleted* when they aren't being used.
			var buildModelArchitectureAGAIN = function () {
				// if you stop a node, you have to recreate it (though doesn't always seem necessary - see jsaFM!
				oscNode && oscNode.disconnect();
				oscNode = config.audioContext.createOscillator();
				oscNode.setType(m_type);  //square
				oscNode.isPlaying=false;
				oscNode.frequency.value = m_frequency;

				// make the graph connections
				oscNode.connect(gainEnvNode);
				gainEnvNode.connect(gainLevelNode);
			};

			// define the PUBLIC INTERFACE object for the model	
			var myInterface = baseSM({},[],[gainLevelNode]);

			console.log("now I have output nodes");
			myInterface.setName("jsaOsc");
			myInterface.setAboutText("Simple oscillator (type: sine, square, saw, triangle)");

			// ----------------------------------------
			myInterface.onPlay = function (i_ptime) {
				var now = i_ptime || config.audioContext.currentTime;


				//console.log("rebuild model node architecture!");
				buildModelArchitectureAGAIN();   // Yuck - have to do this because we stop() the osc node
				oscNode.start(now);
				oscNode.isPlaying=true;
				gainEnvNode.gain.value = 0;

				gainEnvNode.gain.cancelScheduledValues(now);

				stopTime = config.bigNum;

				// if no input, remember from last time set
				oscNode.frequency.value = m_frequency;

				gainEnvNode.gain.setValueAtTime(0, now);
				gainEnvNode.gain.linearRampToValueAtTime(1, now + m_attackTime); // go to gain level over .1 secs
				gainLevelNode.gain.value = k_gainFactor*m_gainLevel;

			
			};

			myInterface.registerParam(
				"Frequency",			// the name the user will use to interact with this parameter
				"range",				// the type of the parameter
				{
					"min": 40,			// minimum value
					"max": 1000,		// maximum value
					"val": m_frequency  //a variable used to remember value across start/stops
				},
				function (i_freq) {		// function to call when the parameter is changed
					m_frequency = i_freq;
					oscNode && (oscNode.frequency.value = m_frequency);
				}
			);

			myInterface.registerParam(
				"Type",
				"range",
				{
					"min": 0,
					"max": 3.999999,
					"val": m_type
				},
				function (i_type) {
					//console.log("in sm.setFreq, oscNode = " + oscNode);
					i_type=Math.floor(i_type);
					if (m_type === i_type) return;
					m_type=i_type;
					console.log("setting osc type to " + m_type);
					oscNode && (oscNode.setType(m_type));
				}
			);

 
			myInterface.registerParam(
				"Gain",
				"range",
				{
					"min": 0,
					"max": 1,
					"val": m_gainLevel
				},
				function (i_val) {
					//console.log("in sm.setGain, gainLevelNode = " + gainLevelNode);
					m_gainLevel = i_val;
					gainLevelNode.gain.value = k_gainFactor * m_gainLevel;
				}
			);


			myInterface.registerParam(
				"Attack Time",
				"range",
				{
					"min": 0,
					"max": 5,
					"val": m_attackTime
				},
				function (i_val) {
					m_attackTime = parseFloat(i_val);  // javascript makes me cry ....
				}
			);

			myInterface.registerParam(
				"Release Time",
				"range",
				{
					"min": 0,
					"max": 3,
					"val": m_releaseTime
				},
				function (i_val) {
					m_releaseTime = parseFloat(i_val); // javascript makes me cry ....
				}
			);

			// ----------------------------------------
			myInterface.onRelease = function (i_ptime) {
				var rtime = i_ptime || config.audioContext.currentTime; 

				//alert("releasing osc");
				myInterface.schedule(rtime, function (){
					var now = config.audioContext.currentTime;
	
					// ramp gain down to zero over the duration of m_releaseTime
					gainEnvNode.gain.cancelScheduledValues(now);
					gainEnvNode.gain.setValueAtTime(gainEnvNode.gain.value, now ); 
					gainEnvNode.gain.linearRampToValueAtTime(0, now + m_releaseTime);

					// when release is finished, stop everything 
					myInterface.schedule(now + m_releaseTime,  function () {
						if (oscNode && oscNode.isPlaying){
							oscNode.stop();
							oscNode.isPlaying=false; 
						} 
						myInterface.stop();
					});
				});
			};

			console.log("jsaOsc: soundReady");
			i_loadedCB && i_loadedCB(myInterface);
			return myInterface;
		};
	}
);