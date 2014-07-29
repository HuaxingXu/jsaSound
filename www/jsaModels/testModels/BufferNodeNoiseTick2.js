/* ---------------------------------------------------------------------------------------
This jsaSound Code is distributed under LGPL 3
Copyright (C) 2012 National University of Singapore
Inquiries: director@anclab.org

This library is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser General Public License as published by the Free Software Foundation; either version 3 of the License, or any later version.
This library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNULesser General Public License for more details.
You should have received a copy of the GNU General Public License and GNU Lesser General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>
------------------------------------------------------------------------------------------*/

/* --------------------------------------------------------------
	Just a short blast of noise
*/

define(
	["jsaSound/jsaSndLib/config", "jsaSound/jsaSndLib/baseSM", "jsaSound/jsaSndLib/jsaOpCodes/jsaBufferNoiseNodeFactoryMaker"],
	//["jsaSound/jsaSndLib/config", "jsaSound/jsaSndLib/baseSM", "jsaSound/jsaSndLib/jsaOpCodes/nativeNoiseNode"],
	function (config, baseSM, noiseNodeFactoryMaker) {
		return function () {
			var m_attack = 0.002;
			var m_sustain = 0.01;
			var m_release = 0.002;
			var m_gain = 0.80;

			var stopTime = 0.0;        // will be > audioContext.currentTime if playing
			var now;
			//var val;

			var noiseNodeFactory = noiseNodeFactoryMaker();

			var noiseNode = noiseNodeFactory();
			noiseNode.loop=true;
			noiseNode.start();
			
			var	gainEnvNode = config.audioContext.createGain();

			noiseNode.connect(gainEnvNode);
			gainEnvNode.gain.setValueAtTime(0, 0);
			

			var myInterface = baseSM({},[],[gainEnvNode]);
			myInterface.setAboutText("EXPERIMENTAL.");

			myInterface.onPlay = function (i_ptime) {

				var ptime = i_ptime;


				gainEnvNode.gain.cancelScheduledValues(ptime);
				// The model turns itself off after a fixed amount of time	
				stopTime = ptime + m_attack + m_sustain + m_release;

				// Generate the "event"
				gainEnvNode.gain.setValueAtTime(0, ptime);
				gainEnvNode.gain.linearRampToValueAtTime(m_gain, ptime + m_attack);
				gainEnvNode.gain.linearRampToValueAtTime(m_gain, ptime + m_attack + m_sustain);
				gainEnvNode.gain.linearRampToValueAtTime(0, ptime + m_attack + m_sustain + m_release);
			};

			myInterface.registerParam(
				"Gain",
				"range",
				{
					"min": 0,
					"max": 1,
					"val": m_gain
				},
				function (i_val) {
					m_gain = parseFloat(i_val);
				}
			);

			myInterface.registerParam(
				"Attack Time",
				"range",
				{
					"min": 0,
					"max": 1,
					"val": m_attack
				},
				function (i_val) {
					m_attack = parseFloat(i_val);  // javascript makes me cry ....
				}
			);

			myInterface.registerParam(
				"Sustain Time",
				"range",
				{
					"min": 0,
					"max": 3,
					"val": m_sustain
				},
				function (i_val) {
					m_sustain = parseFloat(i_val); // javascript makes me cry ....
				}
			);

			myInterface.registerParam(
				"Release Time",
				"range",
				{
					"min": 0,
					"max": 3,
					"val": m_release
				},
				function (i_val) {
					m_release = parseFloat(i_val); // javascript makes me cry ....
				}
			);

			//console.log("paramlist = " + myInterface.getParamList().prettySstring());					
			return myInterface;
		};
	}
);