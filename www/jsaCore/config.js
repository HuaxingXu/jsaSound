/* ---------------------------------------------------------------------------------------
This jsaSound Code is distributed under LGPL 3
Copyright (C) 2012 National University of Singapore
Inquiries: director@anclab.org

This library is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser General Public License as published by the Free Software Foundation; either version 3 of the License, or any later version.
This library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNULesser General Public License for more details.
You should have received a copy of the GNU General Public License and GNU Lesser General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>
------------------------------------------------------------------------------------------*/
// TODO: All sound models need an audioContext

define(
	["jsaSound/jsaCore/wheredoilive"],
	function (wheredoilive) {
		/*
		if (!window.webkitAudioContext) {
			alert("Web Audio API is not supported. Try Chrome!");
			return;
		}
		*/
		// This file of code needs an instantiated webkitAudioContext in order to load, so we can't wait for the
		// html window to be loaded before creating audioContext even though it might cause errors if WebAudio isn't supported. 
		var exports = {};
		//exports.resourcesPath = "http://localhost:8001";
		exports.resourcesPath = wheredoilive;
		exports.audioContext=null;
		if (typeof AudioContext !== "undefined") {
		    exports.audioContext = new AudioContext();
		} else if (typeof webkitAudioContext !== "undefined") {
		    exports.audioContext = new webkitAudioContext();
		} else {
		    throw new Error('AudioContext not supported. :(');
		}

		exports.bigNum = 10000000000.0;// Infinity;  
		exports.k_bufferLength = 1024;// What is the right way to set the so that all nodes agree?

		exports.microphone=undefined;

		return exports;
	}
);