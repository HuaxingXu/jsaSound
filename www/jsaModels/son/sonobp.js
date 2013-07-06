/* ---------------------------------------------------------------------------------------
This jsaSound Code is distributed under LGPL 3
Copyright (C) 2012 National University of Singapore
Inquiries: director@anclab.org

This library is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser General Public License as published by the Free Software Foundation; either version 3 of the License, or any later version.
This library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNULesser General Public License for more details.
You should have received a copy of the GNU General Public License and GNU Lesser General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>
------------------------------------------------------------------------------------------*/

define(
	["jsaSound/jsaCore/config", "jsaSound/jsaCore/baseSM", "jsaSound/jsaModels/multiBandNoise",  "jsaSound/jsaCore/utils"],
	function (config, baseSM, bpFactory,  utils) {
		return function () {

			k_numFormants=4;
			var i=0;

			var m_Position=0;
			
			var kNumParams = 15;
			var beginstate=[300.52, 12.2, 0.89, 326.82, 14.27, 0.87, 339.97, 17.91, 0.87, 313.67, 18.43, 0.87, 1, 0.05, 1] 
			var endstate = [727.85, 97.32, 0.7, 971.11, 105.1, 0.7, 1234.08, 105.1, 0.7, 1457.61, 106.14, 0.7, 1.5, 0.05, 1] 


			var bpNoiseNode;
			var	gainLevelNode = config.audioContext.createGainNode();

		
			// these are both defaults for setting up initial values (and displays) but also a way of remembring across the tragic short lifetime of Nodes.
			var m_gainLevel = 2.5, // the point to (or from) which gainEnvNode ramps glide
				m_releasetime=3;
				stopTime = 0.0,	// will be > audioContext.currentTime if playing
				now = 0.0;

			// set all formant parameters for voice and vowel type
			var setChildParams = function(interpval){
				for(i=0;i<kNumParams; i++){
					bpNoiseNode.setParam(i, (1-interpval)*beginstate[i]+interpval*endstate[i]);
				};
			};

			// define the PUBLIC INTERFACE for the model	
			var myInterface = baseSM({},[],[gainLevelNode]);
			myInterface.setAboutText("Sweep noise filters to a chord");


			// Create the nodes and thier connections. Runs once on load
			var buildModelArchitecture = (function () {
				bpNoiseNode = bpFactory();
				//gainLevelNode = config.audioContext.createGainNode();
				gainLevelNode.gain.value = m_gainLevel;
				bpNoiseNode.connect(gainLevelNode);
			}());


			// ----------------------------------------
			myInterface.play = function (i_gain) {
				now = config.audioContext.currentTime;
				// The rest of the code is for new starts or restarts	
				stopTime = config.bigNum;

				// if no input, remember from last time set
				gainLevelNode.gain.value = i_gain || m_gainLevel;

				if (myInterface.getNumOutConnections() === 0){
					myInterface.connect(config.audioContext.destination);
				}
				setChildParams(0);
				bpNoiseNode.setParam("Release Time", m_releasetime);
				bpNoiseNode.play();
			};

			// ----------------------------------------
	
			myInterface.setPosition = myInterface.registerParam(
				"Position",
				"range",
				{
					"min": 0,
					"max": 1,
					"val": m_Position
				},
				function (i_val) {
					m_Position=i_val;
					setChildParams(m_Position);				
				}
			);

			//myInterface.registerChildParam(bpNoiseNode, "Attack Time");
			//myInterface.registerChildParam(bpNoiseNode, "Release Time");

			// ----------------------------------------		
			myInterface.setGain = myInterface.registerParam(
				"Gain",
				"range",
				{
					"min": 0,
					"max": 3,
					"val": m_gainLevel
				},
				function (i_val) {
					gainLevelNode.gain.value = m_gainLevel = i_val;
				}
			);

			// ----------------------------------------
			myInterface.release = function () {
				bpNoiseNode.release(); // twould be nice to be able to provide a time argument here
			};
			//--------------------------------------------------------------------------------
			// Other methods for the interface
			//----------------------------------------------------------------------------------

				
			return myInterface;
		};
	}
);