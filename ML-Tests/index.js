// Model ----------------------------------------------------

const recordingLength = 70;
const minClapLength = 2;
const maxClapLength = 4;
const maxNumClaps = 10
const N = 50000;

var data = [];

var correctSeqCount = 0;

// Generate Data

var i;
for(i = 0; i < N; i++){

	// can have between 0 and maxNumClaps claps
	var numClaps = Math.floor((i / Math.floor(N / maxNumClaps)));

	var claps = 0;

	// initially have a period with no claps (leaving space for all the claps to occur)
	var nextData = new Array(Math.floor(Math.random() * (recordingLength - numClaps * (maxClapLength + 1)))).fill(0);

	// while(nextData.length < (recordingLength - clapLength)){
	while(claps < numClaps){
		// add a clap of correct length
		nextData = nextData.concat(new Array(Math.floor(Math.random() * (maxClapLength - minClapLength + 1)) + minClapLength).fill(1));
		claps += 1;
		// add a pause of arbitrary length (leaving enough space for the remaining claps)
		var maxGapLength = Math.floor((recordingLength - nextData.length - ((numClaps - claps) * (maxClapLength + 1))));
		nextData = nextData.concat(new Array(Math.floor(Math.random() * maxGapLength) + 1).fill(0));
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

// alternative distance function which measures space between successive claps and evaluates the total distance
// to be the mean of these spaces
// if uneven number of claps, adds the position of each extra clap in recording
function altDistance(rec1, rec2) {

	var dist = 0;
	var i = 0;
	var j = 0;
	var numClaps = 0;

	var lastClapi = 0;
	var lastClapj = 0;
	var findingInitial = true;

	// get positions of initial claps
	while (i < rec1.length && j < rec2.length && findingInitial) {
		if (rec1[i] == 0) {
			i += 1;
		}
		else if (rec2[j] == 0) {
			j += 1;
		}
		else {
			numClaps += 1
			findingInitial = false;
			lastClapi = i;
			lastClapj = j;
			while (i < rec1.length && rec1[i] == 1) {
				i += 1;
			}
			while (j < rec2.length && rec2[j] == 1) {
				j += 1;
			}
		}
	}
	// use this to calculate distance
	while (i < rec1.length && j < rec2.length) {
		if (rec1[i] == 0) {
			i += 1
		}
		else if (rec2[j] == 0) {
			j += 1
		}
		else {
			numClaps += 1
			dist += Math.abs((i - lastClapi) - (j - lastClapj));
			lastClapi = i;
			lastClapj = j;
			while (i < rec1.length && rec1[i] == 1) {
				i += 1;
			}
			while (j < rec2.length && rec2[j] == 1) {
				j += 1;
			}
		}
	}

	// add all the extra claps to distance
	while (i < rec1.length) {
		if (rec1[i] == 0) {
			i += 1
		}
		else {
			dist += i - lastClapi
			while (i < rec1.length && rec1[i] == 1) {
				i += 1;
			}
		}
	}
	while (j < rec2.length) {
		if (rec2[j] == 0) {
			j += 1
		}
		else {
			dist += j - lastClapj
			while (j < rec2.length && rec2[j] == 1) {
				j += 1;
			}
		}
	}
	// numClaps + 1 to prevent division by 0 so overall will be space between claps / (number of spaces + 2)
	// so not exact mean, but effective enough for purpose
	return (dist / (numClaps + 1))
}



function update(d, t){
	var newData = [];
	
	for(var i = 0; i < d.length; i++){
		//console.log(distance(t, d[i][0]))
		/*
		if(distance(t, d[i][0]) < 15){
			newData.push([d[i][0], 1]);
		}
		else{
			newData.push(d[i])
		}
		*/
		if(altDistance(t, d[i][0]) < 3){
			newData.push([d[i][0], 1]);
		}
		else{
			newData.push(d[i])
		}
	}

	return newData
}


// function that removes incorrect (and some correct if necessary) data points until dataset is a certain size
function reduceDataSize(data) {
	var newData = data;
	var index = 0;
	// remove incorrect data until dataset is 50/50 or at correct size
	while (newData.length > 2 * correctSeqCount && newData.length > 5000) {
		index = Math.floor(Math.random() * newData.length)
		while (newData[index][1] == 1) {
			index = Math.floor(Math.random() * newData.length)
		}
		newData.splice(index, 1)
	}
	// remove random data until dataset is at correct size
	while (newData.length > 5000) {
		index = Math.floor(Math.random() * newData.length)
		newData.splice(index, 1)
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
	data = reduceDataSize(data)
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
				)},
				onBatchEnd: (epoch, logs) => {
					console.log("done training")
					// save model
				}
			}
		}
	);
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

						console.log(altDistance(target, binResults))
						// console.log(distance(target, binResults))
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

						correctSeqCount = count;
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

