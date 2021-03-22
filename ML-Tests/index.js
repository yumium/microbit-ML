// Model ----------------------------------------------------

const recordingLength = 70;
const clapLength = 3;
const maxGapLength = 7;

var data = [];
const N = 5000;

// Generate Data

var i;
for(i = 0; i < N; i++){
	var nextData = new Array(Math.floor(Math.random() * 20) + 10).fill(0);

	var claps = 0;
	
	// while(nextData.length < (recordingLength - clapLength)){
	while(claps < 5){
		nextData = nextData.concat(new Array(Math.floor(Math.random() * 3) + clapLength - 1).fill(1));
		nextData = nextData.concat(new Array(Math.floor(Math.random() * maxGapLength) + 1).fill(0));
		claps += 1
	}
	
	// console.log(nextData)

	nextData = nextData.slice(0, recordingLength);

	// console.log(nextData)

	while(nextData.length < recordingLength){
		nextData = nextData.concat([0])
	}

	// console.log(nextData)
	// console.log(nextData.length)

	// console.log("------------------")

	data.push([nextData, 0])
}

var target = data[0][0]

function distance(rec1, rec2){
	var dist = 0;
	for(i = 0; i < rec1.length; i++){
		if(rec1[i] != rec2[i]){
			dist += 1;
		}
	}

	return dist
}

function update(d, t){
	var newData = [];
	
	for(var i = 0; i < d.length; i++){
		//console.log(distance(t, d[i][0]))
		if(distance(t, d[i][0]) < 15){
			newData.push([d[i][0], 1]);
		}
		else{
			newData.push(d[i])
		}
	}

	return newData
}

// data = update(data, target);
console.log(data.map(x => x[0]))

let model;

function buildModel(){
	model = tf.sequential({
		layers: [
			tf.layers.dense({
				inputShape: [recordingLength],
				units: 7,
				activation: 'relu'
			}),
			tf.layers.dense({
				units: 2,
				activation: 'softmax'
			})
		]
	});

	model.compile({
		optimizer: tf.train.adam(0.01),
		loss: 'categoricalCrossentropy',
		metrics: ['accuracy']
	});	
	
	console.log("done building")
}

function trainModel(){
	model.fit(
		tf.tensor(data.map(x => x[0])),
		tf.oneHot(data.map(x => x[1]), 2),
		{
			batchSize: 10,
			epochs: 5,
			callbacks: {
				onEpochEnd: (epoch, logs) => {
				// document.querySelector('#console').textContent =
				// 	`Accuracy: ${(logs.acc * 100).toFixed(1)}% Epoch: ${epoch + 1}`;
				// }

				console.log(
					`Accuracy: ${(logs.acc * 100).toFixed(1)}% Epoch: ${epoch + 1}`
				)}
			}
		}
	);

	console.log("done training")
}

// AUDIO -----------------------------------------------------

var stopped = false;
var shouldStop = false;
var recordedChunks = [];

// Array storing the audio recordings
var recordings = [];
// Array storing the indices of deleted audio recordings
var ignore = [];

// Binary data of the audio recordings
var recordingsBin = [];

function listen(predict) {
	
	var handleSuccess = function(stream) {
		var options = { mimeType: 'audio/webm'};
		recordedChunks = [];
		var mediaRecorder = new MediaRecorder(stream, options);
		var time = 3;

		mediaRecorder.addEventListener("dataavailable", function(e) {
			console.log("Data available")
			time -= 1;

			if(!stopped && e.data.size > 0){
				recordedChunks.push(e.data);
			}

			if(time == 0 || (shouldStop === true && stopped === false)) {
				mediaRecorder.stop();
				recordings.push(recordedChunks);
				stopped = true;
				shouldStop = false;
			}
		});

		mediaRecorder.addEventListener("stop", function() {
			var blob = new Blob(recordedChunks, {
				type: 'audio/webm'
			});
			var url = URL.createObjectURL(blob);
			// $('#array').attr("href", url);
			// $('#array').attr("download", "test.webm");

			var audioElement = document.createElement('audio');

			audioElement.controls = true;
			audioElement.src = url;
			audioElement.id = "audio";

			recordedChunks = [];

			audioToBinary(audioElement);
		})

		var audioToBinary = function(audio){
			var ctx = new AudioContext()
			// 2048 sample buffer, 1 channel in, 1 channel out  
			, processor = ctx.createScriptProcessor(2048, 1, 1)
			, source
			, binResults = []
			, unfinished = true

			audio.crossOrigin = 'anonymous'

			audio.addEventListener('canplaythrough', function(){
			source = ctx.createMediaElementSource(audio)
			source.connect(processor)
			source.connect(ctx.destination)
			processor.connect(ctx.destination)
			audio.play()
			}, false);

			// loop through PCM data and calculate average
			// volume for a given 2048 sample buffer
			processor.onaudioprocess = function(evt){
				var input = evt.inputBuffer.getChannelData(0)
					, len = input.length   
					, total = 0
					, i = 0
					, rms
				while ( i < len ) total += Math.abs( input[i++] )
				rms = Math.sqrt( total / len )
				// TODO: fix bug (this is a temporary fix)
				if (binResults.length < 70) {
					// console.log("rms: "+rms)
					binResults.push(rms > 0.1 ? 1 : 0)
				} else if (unfinished) {
					unfinished = false
					recordingsBin.push(binResults)
					console.log(binResults)

					if(predict){
						console.log(distance(target, binResults))
						const prediction = model.predict(tf.tensor([binResults])).arraySync();
						console.log(prediction[0][0] > prediction[0][1] ? 0 : 1)

						// var prediction2 = model.predict(tf.tensor(target, [1,target.length])).arraySync();
						// console.log(prediction2[0])

						// for(var i = 0; i < data.length; i++){
						// 	//console.log(distance(t, d[i][0]))
						// 	if(i % 10 == 0){
						// 		console.log(data[i][1])
						// 		var prediction2 = model.predict(tf.tensor([data[i][0]])).arraySync();
						// 		console.log(prediction2[0][0] > prediction2[0][1] ? 0 : 1)
						// 		console.log("----------------")
						// 	}
						// }

					} else {
						target = binResults
						data = update(data, target)

						var count = 0;

						for(var i = 0; i < data.length; i++){
							//console.log(distance(t, d[i][0]))
							if(data[i][1] == 1){
								count += 1;
							}
						}
					
						console.log(count)
					}
				}
			}

		};

		mediaRecorder.start(1000);
	}

	stopped = false
	navigator.mediaDevices.getUserMedia({ audio: true, video: false })
	.then(handleSuccess);
}

