/* ---------------------------------------------------------------------------------------
This jsaSound Code is distributed under LGPL 3
Copyright (C) 2012 National University of Singapore
Inquiries: director@anclab.org

This library is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser General Public License as published by the Free Software Foundation; either version 3 of the License, or any later version.
This library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNULesser General Public License for more details.
You should have received a copy of the GNU General Public License and GNU Lesser General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>
------------------------------------------------------------------------------------------*/


define(
	["jsaSound/jsaSndLib/config", "jsaSound/jsaSndLib/baseSM", "jsaSound/jsaSndLib/jsaOpCodes/nativeFModOsc","jsaSound/jsaSndLib/GraphNode", "jsaSound/jsaSndLib/audioUtils"],
	function (config, baseSM, fmodOscFactory, GraphNode, audioUtils) {
        return function () {

            var m_cfRatio = 4.01
            
            var m_basefreq = 130.81 ; // C3, MIDI note 48, octave below middle C 
            var m_lowNote = 48;
            var m_hiNote = 84; //(inclusive) C6, MIDI note 84, 2 octaves above middle C
            m_noteNum = 60;


            var	oscModulatorNode;
            var m_CarrierNode;
            var	gainEnvNode;
            var	gainLevelNode;

            // these are defaults for setting up initial values (and displays) but also a way of remembring across the tragic short lifetime of Nodes.
            var m_gainLevel = .25;    // the point to (or from) which gainEnvNode ramps glide
            var m_car_freq = 440;
            var m_mod_freq = 30;
            var m_modIndex = 75;
            var m_attackTime = 0.01;
            var m_releaseTime = 1.0;

            // Setup the fixed nodes that the FM modulator node (oscModulatorNode)
            // must connect to.
            // -Kumar
            // -- BEGIN FIXED SETUP --
            m_CarrierNode = fmodOscFactory();
            gainEnvNode = config.audioContext.createGain();
            gainLevelNode = config.audioContext.createGain();

            //console.log("in BUILD, gain level node is " + gainLevelNode );

            // Also have to set all of their state values since they all get forgotten, too!!
            gainLevelNode.gain.value = m_gainLevel;
            gainEnvNode.gain.value = 0;

            m_CarrierNode.setParam("modIndex", m_modIndex);

            // make the graph connections
            m_CarrierNode.connect(gainEnvNode);

            gainEnvNode.connect(gainLevelNode);
            // -- END FIXED SETUP --

            var myInterface = baseSM({},[],[gainLevelNode]);
            myInterface.setAboutText("A simple frequency modulator with sample-rate modulation of the carrier frequency.");
            myInterface.afooname="dong...";

            myInterface.onPlay = function (i_ptime) {
                var now = config.audioContext.currentTime;

                // The model uses an oscillator "voice" as the input that
                // controls the fmodOsc. We make one of these on every play()
                // and throw it away on every release(). Note that the
                // rest of the graph is not remade.
                // -Kumar

                if (!oscModulatorNode) {
                    oscModulatorNode = config.audioContext.createOscillator();
                    oscModulatorNode.setType(0);  //sin
                    oscModulatorNode.frequency.value = m_mod_freq;

                    oscModulatorNode.connect(m_CarrierNode);
                    oscModulatorNode.start(now);
                }
                    

                    gainLevelNode.gain.value = m_gainLevel;

                    gainEnvNode.gain.cancelScheduledValues(now);
                    gainEnvNode.gain.setValueAtTime(0, now);
                    gainEnvNode.gain.linearRampToValueAtTime(gainLevelNode.gain.value, now + m_attackTime); // go to gain level over .1 secs	


                    var stopTime = now + m_attackTime + m_releaseTime;
                    gainEnvNode.gain.linearRampToValueAtTime(0, stopTime);

                    myInterface.schedule(stopTime, function () {
                        myInterface.stop(stopTime);
                        oscModulatorNode && oscModulatorNode.stop(stopTime);
                        oscModulatorNode = null;
                   });

            };

            myInterface.onRelease = function (i_ptime) {
                if (oscModulatorNode) {
                    // Good to keep these local variables instead of
                    // common model ones
                    // -Kumar
                    var now = config.audioContext.currentTime;
                    var stopTime = now + m_releaseTime;

                    gainEnvNode.gain.cancelScheduledValues(now);
                    gainEnvNode.gain.setValueAtTime(gainEnvNode.gain.value, now ); 
                    gainEnvNode.gain.linearRampToValueAtTime(0, stopTime);

                    myInterface.schedule(stopTime, function () {
                        myInterface.stop(stopTime);
                        oscModulatorNode && oscModulatorNode.stop(stopTime);
                        oscModulatorNode = null;
                   });

                }
            };

            myInterface.onStop = function (i_ptime){
                
            }



           myInterface.registerParam(
                    "Note Number",
                    "range",
                    {
                        "min": lowNote,
                        "max": hiNote,
                        "val": m_noteNum
                    },
                    function (i_val) {
                        var nomFreq=m_basefreq * 2 Math.pow((i_val-lowNote)/12); // audioUtils.note2Freq(notes[0][Math.floor(i_val)])
                        m_car_freq = (.99 +.02*Math.random())*nomFreq;
                        m_CarrierNode.setParam("carrierFrequency", m_car_freq);

                        m_mod_freq = m_car_freq/((.99 +.02*Math.random())*4.0);
                        oscModulatorNode && (oscModulatorNode.frequency.value = m_mod_freq);

                    }
                    );



            myInterface.registerParam(
                    "Modulation Index",
                    "range",
                    {
                        "min": 0,
                        "max": 100,
                        "val": m_modIndex
                    },
                    function (i_val) {
                        m_modIndex = i_val;
                        m_CarrierNode.setParam("modIndex", m_modIndex);
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
                        gainLevelNode.gain.value = m_gainLevel = i_val;
                    }
                    );

            myInterface.registerParam(
                    "Attack Time",
                    "range",
                    {
                        "min": 0,
                        "max": 1,
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

            

            /* just experimenting ....
            myInterface.storeCurrentPSet();
            myInterface.setParamNorm("Gain", 0.1);
            myInterface.storeCurrentPSet();
            myInterface.savePSets();
            */

            myInterface.setParam("Note Number", m_noteNum);

            return myInterface;
        };
    }
);