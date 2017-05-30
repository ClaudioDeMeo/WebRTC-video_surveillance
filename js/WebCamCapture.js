;(function(App) {
	
	"use strict";

	App.WebCamCapture = function(videoElement) {

		var webCamWindow = false;
		var width = 640;
		var height = 480;

		function initialize(videoElement) {
			if(typeof videoElement != 'object') {
				webCamWindow = document.getElementById(videoElement);
			} else {
				webCamWindow = videoElement;
			}
		}

		function captureImage(append) {
			var canvas = document.createElement('canvas');
			canvas.width = width;
			canvas.height = height;
			canvas.getContext('2d').drawImage(webCamWindow, 0, 0, width, height);

			var pngImage = canvas.toDataURL("image/png"); 
			
			if(append) {
				append.appendChild(canvas);	
			}

			return canvas;
		}

		function setSize(w, h) {
			width = w;
			height = h;
		}

		initialize(videoElement);

		return {
			setSize: setSize,
			captureImage: captureImage
		};

	}

})(MotionDetector);