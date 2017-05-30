;(function(App) {

	"use strict";
	
	App.ImageCompare = function() {
		var sensitivity, temp1Canvas, temp1Context, temp2Canvas, temp2Context, topLeft, bottomRight;

		function initialize() {
			sensitivity = 40;

			if(!temp1Canvas) {
				temp1Canvas = document.createElement('canvas');
				temp1Context = temp1Canvas.getContext("2d");
			}

			if(!temp2Canvas) {
				temp2Canvas = document.createElement('canvas');
				temp2Context = temp2Canvas.getContext("2d");
			}

			topLeft = [Infinity,Infinity];
			bottomRight = [0,0];
		}

		function compare(image1, image2, width, height) {
			initialize();

			if(!image1 || !image2) {
				return;
			}

			temp1Context.clearRect(0,0,100000,100000);
			temp1Context.clearRect(0,0,100000,100000);

			temp1Context.drawImage(image1, 0, 0, width, height);
			temp2Context.drawImage(image2, 0, 0, width, height);


			for(var y = 0; y < height; y++) {
				for(var x = 0; x <  width; x++) {
					var pixel1 = temp1Context.getImageData(x,y,1,1);
					var pixel1Data = pixel1.data;

					var pixel2 = temp2Context.getImageData(x,y,1,1);
					var pixel2Data = pixel2.data;

					if(comparePixel(pixel1Data, pixel2Data) == false) {
						setTopLeft(x,y);
						setBottomRight(x,y);
					}					
				}
			}

			return {
				'topLeft': topLeft,
				'bottomRight': bottomRight
			}
		}

		function comparePixel(p1, p2) {
			var matches = true;

			for(var i = 0; i < p1.length; i++) {
				var t1 = Math.round(p1[i]/10)*10;
				var t2 = Math.round(p2[i]/10)*10;

				if(t1 != t2) {
					if((t1+sensitivity < t2 || t1-sensitivity > t2)) {
						matches = false;
					}
				}
			}

			return matches;
		}

		function setTopLeft(x,y) {
			if(x < topLeft[0] ) {
				topLeft[0] = x;
			}
			if(y < topLeft[1]) {
				topLeft[1] = [y];
			}
		}

		function setBottomRight(x,y) {
			if(x > bottomRight[0]) {
				bottomRight[0] = [x];
			}
			if(y > bottomRight[1]) {
				bottomRight[1] = [y];
			}
		}

		initialize();

		return {
			compare: compare
		}
	};
})(MotionDetector);
