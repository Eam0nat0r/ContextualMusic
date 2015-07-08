var song = ""; //JSON object is loaded into this variable
var time = new Date();
time = time.getTime(); //Appended to XHR for disabling any possible caching of JSON file.
var tracks = new Array(); //Master Track List in file # order
var speedPace = new Array(); //Track increment order
var slowPace = new Array(); //Track decrement order (After full intensity reached)
var trackZones = new Array(); //Track heartrate threshold

var context; //Audio Context
var bufferLoader; //Audio bufferLoader
var gainList = new Array(); //Variable dedicated to adjusting volume gains
var sourceList = new Array(); //gainList assigned to each track here.

function songLoader() {

    directory = document.getElementById("loadSel").value;
    file = directory + "info.json";
    console.log(file);
    document.cookie = "song=" + file;
    document.getElementById("preload").innerHTML = "LOADING...";
    document.getElementById("preload").disabled = true;
    document.getElementById("loadSel").disabled = true;
    grabSongReference();


    function loadJSON(callback) {

        var xobj = new XMLHttpRequest();
        xobj.overrideMimeType("application/json");
        xobj.open('GET', file + "?" + time, true);
        xobj.onreadystatechange = function () {
            if (xobj.readyState == 4 && xobj.status == "200") {
                callback(xobj.responseText);
            }
        };
        xobj.send(null);
    }


    function grabSongReference() {
        loadJSON(function (response) {
            song = JSON.parse(response);
            enumTracks();
            reorderTracks();
            init();
        });
    }

    function enumTracks() {
        for (var key in song.info.tracks) {
            if (song.info.tracks.hasOwnProperty(key)) {
                tracks.push(directory + song.info.tracks[key]);


            }
        }

    }


    function reorderTracks() {
        for (var key in song.order.speedup) {
            if (song.order.speedup.hasOwnProperty(key)) {
                speedPace.push(song.order.speedup[key]);
            }


        }
        for (var key in song.order.slowdown) {
            if (song.order.slowdown.hasOwnProperty(key)) {
                slowPace.push(song.order.slowdown[key]);
            }


        }

        for (i = 0; i < tracks.length; i++) {

            trackZones[i] = zones(
                i,
                document.getElementsByName("rest")[0].value,
                document.getElementsByName("full")[0].value,
                tracks.length

            );
        }
    }
}







function init() {
    // Fix up prefixing
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    context = new AudioContext();

    bufferLoader = new BufferLoader(
        context, tracks,
        finishedLoading
    );

    bufferLoader.load();
}

function finishedLoading(bufferList) {
    // Create two sources and play them both together.
    var source = new Array();
    var gainNode = new Array();
    var vol = new Array();
    for (i = 0; bufferList.length > i; i++) {
        source[i] = context.createBufferSource();
        gainNode[i] = context.createGain();
        source[i].buffer = bufferList[i];
        source[i].connect(gainNode[i]);
        vol[i] = createVolBar();
        document.getElementById("player").appendChild(vol[i]);
        gainNode[i].connect(context.destination);
        source[i].loop = true;
        gainNode[i].gain.value = 0; //Mute all tracks at start.
        gainList[i] = gainNode[i];
        sourceList[i] = source[i];

    }
    gainNode[parseInt(speedPace[0])].gain.linearRampToValueAtTime(1, context.currentTime + 3);
    for (i = 0; source.length > i; i++) {
        source[i].start(0);
    }
    updateUI();



}



function BufferLoader(context, urlList, callback) {
    this.context = context;
    this.urlList = urlList;
    this.onload = callback;
    this.bufferList = new Array();
    this.loadCount = 0;
}

BufferLoader.prototype.loadBuffer = function (url, index) {
    // Load buffer asynchronously
    var request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.responseType = "arraybuffer";

    var loader = this;

    request.onload = function () {
        // Asynchronously decode the audio file data in request.response
        loader.context.decodeAudioData(
            request.response,
            function (buffer) {
                if (!buffer) {
                    alert('error decoding file data: ' + url);
                    return;
                }
                loader.bufferList[index] = buffer;
                if (++loader.loadCount == loader.urlList.length)
                    loader.onload(loader.bufferList);
            },
            function (error) {
                console.error('decodeAudioData error', error);
            }
        );
    }

    request.onerror = function () {
        alert('BufferLoader: XHR error');
    }

    request.send();
}

BufferLoader.prototype.load = function () {
    for (var i = 0; i < this.urlList.length; ++i)
        this.loadBuffer(this.urlList[i], i);
}

function createVolBar() {
    //For manual control and testing purposes.
    var x = document.createElement("input");
    x.setAttribute("type", "range");
    x.setAttribute("max", "100");
    x.setAttribute("min", "0");
    x.setAttribute("value", "0");
    x.setAttribute("onInput", "trackVol(this)");
    x.setAttribute("id", "volSlider_" + i);
    x.setAttribute("class", "volSliders");
    return x;
}

function trackVol(e) {
    var vol = parseInt(e.value) / parseInt(e.max);
    var id = parseInt(e.id.split("_")[1]);
    gainList[id].gain.value = vol;
    //console.log("id: "+id+"\nvol: "+vol+".");

}

function zones(track, min, max, total) {
    //Zones are meant for splitting the allowable heartbeat range into intensity ranges for the music to play at.
    return parseInt(min) + parseInt(track * Math.floor((max - min) / total));

}

function meterChange(num) {

    var muteThese = speedPace.length - num;
    //gainList merely uses tracks in file order but speedPace is user defined in the JSON file.
    var musicTime = context.currentTime;
    if (muteThese !== 8) {
        for (i = 0; i < num; i++) {
            gainList[parseInt(speedPace[i])].gain.linearRampToValueAtTime(1, musicTime + 7);
            //console.log(i+" unmuted");
        }
        for (i = num; i < speedPace.length; i++) {
            gainList[parseInt(speedPace[i])].gain.linearRampToValueAtTime(0, musicTime + 7);
            //console.log(i+" muted");
        }
    }
}

function toggleTrax() {


    if (document.getElementById("player").getAttribute("class") == "hidden") {


        document.getElementById("player").removeAttribute("class");

    } else document.getElementById("player").setAttribute("class", "hidden");

}

function updateUI() {

    document.getElementById("preload").remove();
    document.getElementById("loadSel").remove();
    document.getElementById("songTitle").innerHTML = song.info.title;
    document.getElementById("songArtist").innerHTML = song.info.artist;
    document.getElementById("intensity").disabled = false;
    document.getElementById("trackCounter").disabled = false;
    document.getElementById("zoneSize").disabled = false;
    document.getElementById("restNum").disabled = false;
    document.getElementById("fullNum").disabled = false;
    document.getElementById("actNum").disabled = false;
    document.getElementById("trackCounter").value = tracks.length;
    heartCalcs();
    
}

function HeartRate(currentHR) {
    var bar = trackZones[document.getElementById("intensity").value - 1];
    var zs = parseInt(document.getElementById("zoneSize").value);
    //console.log(Math.abs(bar - currentHR));
    if (Math.abs(bar - currentHR) >= zs) {
        var change = 0;
        var a = parseInt(document.getElementById("intensity").value) - 1;
        if (currentHR > bar) {
            
            while (trackZones[a] < currentHR) {
                change++;
                a++;

            }
        } else {
            
            while (trackZones[a] > currentHR && a >= 0) {
                change--;
                a--;

            }
        }
        
        document.getElementById("intensity").value = parseInt(document.getElementById("intensity").value) + change;
        meterChange(document.getElementById("intensity").value);
    }


}

function heartCalcs(){
    document.getElementById("zoneSize").value = parseInt(Math.floor((document.getElementById("fullNum").value - document.getElementById("restNum").value) / tracks.length));
}