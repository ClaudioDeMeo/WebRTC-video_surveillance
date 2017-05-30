// Peer principale

var constraints={video : false , audio : false};
var servers = {'iceServers': [{'url': 'stun:stun.l.google.com:19302'}]};
var pc=new Array();
i=-1;
var offerOptions = {
  offerToReceiveAudio: 0,
  offerToReceiveVideo: 1
};
var dataChannel = new Array();

//modificare con l'indirizzo del server di segnalazione
var wsc = new WebSocket('ws://localhost:3434');
var sdpTemp=null;

//elementi nella pagina
var hangupBtn = document.getElementById('hangup');
var downloadlogBtn=document.getElementById('downloadlog');
var downloadVideoBtn=document.getElementById('downloadvideo');
var errorMex=document.getElementById('ErrorMex');
var containerMex=document.getElementById('Mex');
var sdpOffer=document.getElementById('sdpAnswer');
var containerVideo=document.getElementById('containerVideo');
var inputVideoText=document.getElementById('inputVideoText');

//strutture dati
var video=new Array();
var movement=new Array();
var mediaRecorder=new Array();
var recordedBlobs=new Array();
var log=new Array();
var time=new Array();
var infinity=false;

hangupBtn.disabled = true;
downloadlogBtn.disabled=true;
downloadVideoBtn.disabled=true;


hangupBtn.onclick = function(e){
	hangup(document.getElementById("inputText").value);
};

downloadlogBtn.onclick=function (e){
	var tempLog="{\r\n";
	for (j=0;j<=i;j++){
		if(log[j].substring(log[j].lastIndexOf('durata')+8,log[j].lastIndexOf('durata')+9)==" "){
			durata=new Date().getTime()-time[j].getTime();
			log[j]=log[j].substring(0,log[j].lastIndexOf('durata')+8)+'"'+durata+'ms"'+log[j].substring(log[j].lastIndexOf('durata')+8,log[j].lenght);
		}
		tempLog=tempLog+log[j]+"],\r\n\t],\r\n";
	}
	if (tempLog.substring(tempLog.lastIndexOf('[{')+2,tempLog.lastIndexOf('[{')+3)==']'){
		tempLog=tempLog.substring(0,tempLog.lastIndexOf('durata')-7)+tempLog.substr(tempLog.lastIndexOf('[{')+5)
	}
	tempLog=tempLog.substring(0,tempLog.length-3)+"\r\n}";
	//download dei file di log
	download([tempLog],"log.json","application/octet-stream");
};

downloadVideoBtn.onclick=function (e){
	if (inputVideoText.value==""){
		alert("Inserire nome camera");
	}else{
		var trovato=false;
		var j=0;
		while (!trovato && j<=i){
			trovato=(movement[j].getAttribute("id")==inputVideoText.value);
			j++;
		}
		if (trovato){
			mediaRecorder[j-1].requestData();
			setTimeout(function(){
				download(recordedBlobs[j-1],inputVideoText.value+'.webm','video/webm');
			},100);
		}else{
			alert("Camera "+inputVideoText.value+" non trovata");
		}
	}
	
};

//funzione per il download dei dati in locale
function download(dato,nome,tipo){
	var blob = new Blob(dato, {type: tipo});
	var url = window.URL.createObjectURL(blob);
	var a = document.createElement('a');
	a.style.display = 'none';
	a.href = url;
	a.download = nome;
	document.body.appendChild(a);
	a.click();
	setTimeout(function() {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
	}, 100);
}

//inizializza la peerconnection e il data channel
function initPeerConnection(){
	pc[i]= new webkitRTCPeerConnection(servers,{'mandatory':{'OfferToReceiveAudio': true, 'OfferToReceiveVideo': true }});
	pc[i].onicecandidate=function(e){
		onIceCandidate(pc[i],e);
	};	
	dataChannel[i]=null;
	pc[i].ondatachannel=dataChannelCallback;		//creazione datachannel
	pc[i].oniceconnectionstatechange=function(e){
		onIceStateChange(pc[i], e);
	};
	pc[i].onaddstream=gotRemoteStream;		//aggiunge stream remoto
}

function gotRemoteStream(e) {	//aggiunge stream remoto
	console.log("Got remote stream!", e);	
	video[i]=document.createElement("video");
	movement[i]=document.createElement("div");
	var videoId=document.createAttribute("id");
	videoId.value="remote"+i;
	video[i].setAttributeNode(videoId);
	video[i].autoplay=true;
	video[i].controls=true;
	video[i].style.width='640px';
	video[i].style.height='480px';
	video[i].src = window.URL.createObjectURL(e.stream);
	startRecording(e.stream);
	log[i]="";
	containerVideo.appendChild(video[i]);
	hangupBtn.disabled = false;
	downloadlogBtn.disabled=false;
	downloadVideoBtn.disabled=false;
}
	
function startRecording(stream){
	recordedBlobs[i]= [];
	mediaRecorder[i] = new MediaRecorder(stream,{mimeType: 'video/webm;codecs=vp9'});
	console.log('Created MediaRecorder', mediaRecorder[i]);
	mediaRecorder[i].onstop = function (e){
		console.log('Recorder stopped: ', e);
	};
	mediaRecorder[i].ondataavailable=function(e){
		if (e.data && e.data.size > 0) {
			recordedBlobs[i].push(e.data);
		}
	};
	mediaRecorder[i].start();
	//mediaRecorder[i].requestData();
	console.log('MediaRecorder started', mediaRecorder[i]);
}
	
function calle(){//crea l'offerta
	var sdpOffer=null;
	i++;
	initPeerConnection();
	
	console.log('set Sdp offer button clicked');
	
	if (sdpTemp!=null){
		sdpOffer =  new RTCSessionDescription({type: 'offer', sdp: sdpTemp});
	}else{
		sdpOffer =  new RTCSessionDescription({type: 'offer', sdp: sdpText.value+'\r\n'});
	}
	pc[i].setRemoteDescription(sdpOffer).then(
    function() { //onSuccess
   	console.log('Set remote Success. Creating answer');
	pc[i].createAnswer().then(
	   function (desc) {
			console.log('Created answer', desc);
			sdpOffer.innerHTML = '<pre>' + desc.sdp + '</pre>'; 
            pc[i].setLocalDescription(desc).then(
				function() {
				},//Errori
				onSetSessionDescriptionError
			);
	   },
	   onCreateSessionDescriptionError
	);
    },
    onSetSessionDescriptionError
	);
}

//chiude peerconnection e data channel
function hangup(camToDelete) {
	var trovato=false;
	var j=0;
	while (!trovato && j<=i){
		trovato=(movement[j].getAttribute("id")==camToDelete);
		j++;
	}
	if (trovato){
		dataChannel[j-1].send("close");
		pc[j-1].close();
		dataChannel[j-1].close();
		mediaRecorder[j-1].stop();
		console.log(mediaRecorder[j-1].state);
		console.log("recorder stopped");
		console.log('Recorded Blobs: ', recordedBlobs[j-1]);
		containerVideo.removeChild(video[j-1]);
		containerVideo.removeChild(movement[j-1]);
		for (k=j-1;k<i;k++) {
			pc[k]=pc[k+1];
			dataChannel[k]=dataChannel[k+1];
			video[k]=video[k+1];
			movement[k]=movement[k+1];
			mediaRecorder[k]=mediaRecorder[k+1];
			recordedBlobs[k]=recordedBlobs[k+1];
			log[k]=log[k+1];
		}
		pc.pop();
		dataChannel.pop();
		video.pop();
		movement.pop(); 
		mediaRecorder.pop();
		recordedBlobs.pop();
		log.pop();
		var mex=document.getElementById("mex"+camToDelete);
		containerMex.removeChild(mex);
		i--;
		if(i==-1){
			hangupBtn.disabled = true;
			downloadVideoBtn.disabled=true;
			downloadlog.disabled=true;
			sdpOffer.innerHTML = '<pre></pre>';
		}
	}else if(camToDelete!=""){
		alert("Nessuna camera chiamata "+ camToDelete);
	}
}

//imposta la risposta sdp proveniente dal peer remoto
function setSdpAnswer() {
	var sdpAnswer = null;
	if (sdpTemp!=null){
		sdpAnswer = new RTCSessionDescription({type: 'answer', sdp: sdpTemp});
	}else{
		sdpAnswer = new RTCSessionDescription({type: 'answer', sdp: sdpText.value+'\r\n'});
	}
	console.log('set Sdp answer button clicked. Setting answer', sdpAnswer);
	pc[i].setRemoteDescription(sdpAnswer).then(	// imposta la risposta sdp
		function() {
			console.log("setRemoteDescription was successful");
		}, onSetSessionDescriptionError
	);
}

//ICE Callbacks
function onIceCandidate(pc, event) {
	//sdpOffer.innerHTML = '<pre>' + pc.localDescription.sdp + '</pre>';
	wsc.send(pc.localDescription.sdp);
}

function onIceStateChange(pc, event) {
	if (pc) {
		console.log('ICE state: ' + pc.iceConnectionState);
	}
}

function dataChannelCallback(event) {
	if (dataChannel[i] === null) { //Callee
		dataChannel[i] = event.channel; //Set the DC = to the event channel
		dataChannel[i].onmessage = messageCallback;
	}
}


function messageCallback(event) {
	var inizio=event.data.indexOf("\r\n");
	var idPeer=event.data.substring(0,inizio);
	var fine=event.data.length;
	if (event.data.substring(fine-5,fine)=="close"){
		hangup(idPeer);
		return;
	}
	console.log("Got data", event);
	var trovato=false;
	var j=0;
	var pos=i;
	while (!trovato && j<=i){
		trovato=(event.data.indexOf(movement[j].getAttribute("id"))>-1);
		if(trovato){
			pos=j;
		}
		j++;
	}
	var mex=document.createElement("div");
	var style=document.createAttribute("style");
	var newTop=(parseInt(event.data.substring(event.data.indexOf("top:")+4,event.data.indexOf("px;")))+video[pos].offsetTop) +"px;";
	var newLeft=(parseInt(event.data.substring(event.data.indexOf("left:")+5,event.data.indexOf("px;",event.data.indexOf("left:")+5)))+video[pos].offsetLeft)+"px;";
	var durata="";
	style.value="position:absolute;border: 1px solid red;background: rgba(255,0,0,0.3);top:"+newTop+"left:"+newLeft+event.data.substring(event.data.indexOf("width:"),fine);
	if (trovato){
		movement[pos].setAttributeNode(style);
		newTime=new Date();
		log[pos]=log[pos]+'\r\n\t\t\t{\r\n\t\t\t"box": "'+event.data.substring(event.data.indexOf("top:"),fine)+'",\r\n\t\t\t"time": "'+newTime+'"\r\n\t\t\t},\r\n\t\t\t';
		if (newTop=="NaNpx;"){
			durata=newTime.getTime()-time[pos].getTime();
			log[pos]=log[pos].substring(0,log[pos].lastIndexOf('durata')+8)+'"'+durata+'ms"'+log[pos].substring(log[pos].lastIndexOf('durata')+8,log[pos].lenght)+'\r\n\t\t]},\r\n\t\t{\r\n\t\t "durata": ,\r\n\t\t "movimento":[{';
			infinity=true;
		}else{
			if (infinity){
				time[pos]=newTime;
				infinity=false;
			}
		}
	}else{
		sdpOffer.innerHTML = '<pre></pre>';
		var movementId=document.createAttribute("id");
		movementId.value=idPeer;
		movement[i].setAttributeNode(movementId);
		movement[i].setAttributeNode(style);
		time[i]=new Date();
		log[i]='"'+idPeer+'":[{\r\n\t\t"durata": ,\r\n\t\t"movimento":[{\r\n\t\t\t"box": "'+event.data.substring(event.data.indexOf("top:"),fine)+'",\r\n\t\t\t"time": "'+time[i]+'"\r\n\t\t\t},\r\n\t\t\t';
		containerVideo.appendChild(movement[i]);
		var mexId=document.createAttribute("id");
		mexId.value="mex"+idPeer;
		mex.setAttributeNode(mexId);
		mex.innerHTML=idPeer+" OK";
		containerMex.appendChild(mex);
	}
	
}

//Error Handling

function onCreateSessionDescriptionError(error) {
	console.log('Error setting SDP: ' + error.toString(), error);
	errordiv.innerHTML = 'Error setting SDP';
}

function onSetSessionDescriptionError(error) {
	console.log("Set session desc. error!", error);
}

function onAddIceCandidateError(pc, error) {
	console.log('failed to add ICE Candidate: ' + error.toString());
}

wsc.onmessage = function (event) {	
	sdpTemp=event.data;
	calle();
}