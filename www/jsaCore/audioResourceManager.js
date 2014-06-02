define(
    ["jsaSound/jsaCore/config", "jsaSound/jsaCore/utils"],
    function AudioResourceManager(config, utils){

    	var resourceManager =  {
			"m_loadedResources" : {}, // stores file names (as property names) and ArrayBuffers (as property values) so audio file resources don't have to be retrieved for than once (for example if multiple instances of a resource-using sound model are loaded). 
			"m_waitingForResource": {}, // queue of callbacks waiting for a buffer already being loaded by another caller

			"loadAudioResource": function(i_url, i_onload){

					var xhr = new XMLHttpRequest();

					xhr.onerror = function (e) {
						console.log("utils.getAudioResource xhr.onload error for " + i_url + ".")
						console.error(e);
					};

					var onDecode=function(b){
						resourceManager.m_loadedResources[i_url]=b;
						i_onload(b);
						// and same for those waiting for this resource
						while (resourceManager.m_waitingForResource[i_url].length > 0){
							console.log("OK, got the resource I was waiting for!");
							resourceManager.m_waitingForResource[i_url].shift()(b);						
						}

					}

					xhr.onload = function () {
						console.log("Sound(s) loaded");
						config.audioContext.decodeAudioData(xhr.response, onDecode, xhr.onerror);
					};


					if (resourceManager.m_loadedResources.hasOwnProperty(i_url)){
						if (resourceManager.m_loadedResources[i_url]==="loading"){
							// queue up call back
							console.log("Somebody else is loading this resource, wait for it....!")
							resourceManager.m_waitingForResource[i_url].push(i_onload);
							return;
						} // else return the buffer previously loaded to the caller. 
						console.log("The url, " + i_url + "was previously loaded. UReturning loaded buffer to caller");
						onDecode(resourceManager.m_loadedResources[i_url]);
						return;
					} else {
						resourceManager.m_loadedResources[i_url]="loading";
						resourceManager.m_waitingForResource[i_url]=[];

						xhr.open('GET', utils.freesoundfix(i_url), true);
						xhr.responseType = 'arraybuffer';
						xhr.send();	
					}
			}
		}

		return resourceManager.loadAudioResource;
    }
);
