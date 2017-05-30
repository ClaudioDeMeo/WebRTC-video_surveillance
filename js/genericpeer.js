//Webcam peer

var constraints={video : true , audio : false};
var servers = {'iceServers': [{'url': 'stun:stun.l.google.com:19302'}]};
var pc=null;
var offerOptions = {
  offerToReceiveAudio: 0,
  offerToReceiveVideo: 1
};
var dataChannel = null;
var localStreem=null;

//modificare con l'indirizzo del server di segnalazione
var wsc = new WebSocket('ws://localhost:3434');
var sdpTemp=null;
var connected=false;
var sent=false;

//elementi nella pagina
var callerBtn = document.getElementById('call');
var hangupBtn = document.getElementById('hangup');
var localVideo=document.getElementById('local');
var errorMex=document.getElementById('ErrorMex');
var containerMex=document.getElementById('Mex');

callerBtn.disabled = false;
hangupBtn.disabled = true;

//eventi button
callerBtn.onclick = caller;
hangupBtn.onclick = hangup;

navigator.webkitGetUserMedia(constraints,onSuccess,onError);

function onSuccess(stream){
	localStreem=stream;
	console.log('getUserMedia success! Stream: ', stream);						
	console.log('LocalStream', stream.getVideoTracks());
	localVideo.src=window.URL.createObjectURL(stream);						//stream dalla webcam
	console.log("L'utente ha dato il permesso di utilizzare mic e webcam!");
	var videoTracks = stream.getVideoTracks();
    var audioTracks = stream.getAudioTracks();
	if (videoTracks.length > 0) {
		console.log('Using video device: ' + videoTracks[0].label);
	}
	if (audioTracks.length > 0) {
		console.log('Using audio device: ' + audioTracks[0].label);
	}
}

function initPeerConnection(){
	pc = new webkitRTCPeerConnection(servers,{'mandatory':{'OfferToReceiveAudio': false, 'OfferToReceiveVideo': true }});
	pc.onicecandidate=function(e){			
		onIceCandidate(pc,e);
	};
	pc.ondatachannel=dataChannelCallback; 
	pc.oniceconnectionstatechange=function(e){	
		onIceStateChange(pc, e);				
	};
	pc.addStream(localStreem);			//aggiunta stream locale
	console.log('Stream locale aggiunto alla Peer Connection');
}

function closePeerConnection(){
	pc.close();
	dataChannel.close();
	pc = null;
	dataChannel=null;
	connected=false;
	sent=false;
	hangupBtn.disabled = true;
	callerBtn.disabled = false;
}

//chiude peerconnection e data channel
function hangup() {
	sendData(document.getElementById("idcam").value+"\r\nclose");
}

//Set Sdp Offer
function caller(){
	initPeerConnection();
	if (document.getElementById("idcam").value==""){
		alert("Inserire un id");
		return;
	}
	dataConstraint = null;
	dataChannel = pc.createDataChannel('WebRTCSecuritySystem', dataConstraint);
	dataChannel.onopen = function (e) {
		console.log("Data Channel open!", e);
	}; 
	dataChannel.onclose = function (e) { 
		console.log("Data channel closed :(", e);
	};
	dataChannel.onmessage = messageCallback; 
	pc.createOffer(offerOptions).then(	//Crea L'offerta sdp
		function(desc){//On Success
			console.log('PC initiator created offer', desc);
			pc.setLocalDescription(desc).then(function(){
				console.log("Create offer success");
				},onSetSessionDescriptionError);
			console.log("SDP offer should be sent to the callee PC");
		}, onCreateSessionDescriptionError
	);
}

function setSdpAnswer() {
	var sdpAnswer = null;
	if (sdpTemp!=null){
		sdpAnswer = new RTCSessionDescription({type: 'answer', sdp: sdpTemp});
	}else{
		sdpAnswer = new RTCSessionDescription({type: 'answer', sdp: sdpText.value+'\r\n'});
	}
	console.log('set Sdp answer button clicked. Setting answer', sdpAnswer);
	pc.setRemoteDescription(sdpAnswer).then(	// imposta la risposta sdp
		function() {
			console.log("setRemoteDescription was successful");
				callerBtn.disabled = true;
				hangupBtn.disabled = false;
		}, onSetSessionDescriptionError
	);
}

function sendData(data) {	//invia messaggi con data channel
	if(dataChannel!=null && connected){
		console.log("About to send this data: " + data);  
		dataChannel.send(data);
	}
}

//ICE Callbacks
function onIceCandidate(pc, event) {//invia l'offerta sdp
	if(!sent){
		wsc.send(pc.localDescription.sdp);
		sent=true;
	}
}

function onIceStateChange(pc, event) {
  if (pc) {
    console.log('ICE state: ' + pc.iceConnectionState);
	if (pc.iceConnectionState=="completed"){
		connected=true;
	}
  }
}

function dataChannelCallback(event) {
	if (dataChannel === null) { //Callee
		dataChannel = event.channel; //Set the DC = to the event channel
		dataChannel.onmessage = messageCallback;
	}
}

function messageCallback(event) {
	console.log("Got data", event);
	if (event.data=close){
		closePeerConnection();
	}
}

//Error Handling
function onError(error){
	var mex=document.createElement("p");
	console.log("getUserMedia error! Got this error: ",error);
	mex.innerHTML = '<p> Errore! ' + error.name + '</p>' ;
	ErrorMex.appendChild(mex);
}

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
	setSdpAnswer();
}