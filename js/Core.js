;(function(App) {

	"use strict";
	
	App.Core = function() {

		var rendering = false;

		var width = 64;
		var height = 48;

		var webCam = null;
		var imageCompare = null;

		var currentImage = null;
		var oldImage = null;

		var topLeft = [Infinity,Infinity];
		var bottomRight = [0,0];
		var mov=false;
		var raf = (function(){
			return  window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame ||
			function( callback ){
				window.setTimeout(callback, 1000/60);
			};
		})();

		function initialize() {
			imageCompare = new App.ImageCompare();
			webCam = new App.WebCamCapture(document.getElementById('local'));
			rendering = true;

			main();
		}
		
		function render() {
			oldImage = currentImage;
			currentImage = webCam.captureImage(false);
			if(!oldImage || !currentImage) {
				return;
			}
			var vals = imageCompare.compare(currentImage, oldImage, width, height);//area interessata dal movimento
			topLeft[0] = vals.topLeft[0] * 10;
			topLeft[1] = vals.topLeft[1] * 10;
			bottomRight[0] = vals.bottomRight[0] * 10;
			bottomRight[1] = vals.bottomRight[1] * 10;
			var motion=document.getElementById("idcam").value+"\r\n top:"+topLeft[1] + "px;left:"+topLeft[0]+"px;width:"+(bottomRight[0] - topLeft[0])+"px;height:"+(bottomRight[1] - topLeft[1])+"px;";
			//sendData(motion);
			if(topLeft[0]!="Infinity"){
				sendData(motion);		//invia le coordinate dell'area in cui è stato rilevato il movimento
				mov=false;
			}else if(topLeft[0]=="Infinity" && !mov){
				sendData(motion);
				mov=true;
			}
			topLeft = [Infinity,Infinity];
			bottomRight = [0,0]

		}

		function main() {
			try{
				render();
			} catch(e) {
				console.log(e);
				return;
			}

			if(rendering == true) {
				raf(main.bind(this));
			}
		}
		
		initialize();
	};
})(MotionDetector);