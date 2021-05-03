import random
import numpy as np

recordingLength = 100
clapLength = 10
maxGapLength = 20

data = []
N = 10000

for i in range(0, N):
	nextData = [0]*random.randint(1, 5)

	while len(nextData) < (recordingLength - clapLength):
		nextData = nextData + [1]*(clapLength + 4*random.randint(-1, 1))
		nextData = nextData + [0]*random.randint(1, maxGapLength)

	nextData = nextData[:recordingLength]

	while len(nextData) < recordingLength:
		nextData = nextData + [0]

	data.append((nextData, 0))

# target = [0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 0, 0]
target = data[0][0]

def distance(rec1, rec2):
	dist = 0
	for i in range(0, len(rec1)):
		if rec1[i] != rec2[i]:
			dist += 1

	return dist

def update(data, target):
	newData = []
	for datum in data:
		if distance(target, datum[0]) < clapLength*3:
			newData.append((datum[0], 1))
		else:
			newData.append(datum)

	return newData

data = update(data, target)

count = 0

for datum in data:
	if datum[1] == 1:
		count += 1
		
		# print(datum)

print("Number of accepts", count)

trainingData = data[:int(0.8*N)]
testingData = data[int(0.8*N):]

import tensorflow as tf

model = tf.keras.models.Sequential()
model.add(tf.keras.Input(shape=(recordingLength,)))
model.add(tf.keras.layers.Dense(recordingLength*2, activation='relu'))
model.add(tf.keras.layers.Dense(2, activation='softmax'))

model.summary()

model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
    loss=tf.keras.losses.CategoricalCrossentropy(from_logits=True),
    metrics=['accuracy']
)

print(np.array(tf.one_hot([d[1] for d in trainingData], 2))[:10].shape)

x_train = np.array([d[0] for d in trainingData])

history = model.fit(
    x_train, 
    np.array(tf.one_hot([d[1] for d in trainingData], 2, axis=-1)),
    batch_size=10, 
    epochs=5, 
    validation_data=(
		np.array([d[0] for d in testingData]), 
		np.array(tf.one_hot([d[1] for d in testingData], 2, axis = -1))
	) #FIX LABELS
)

prediction = model.predict(np.array([data[0][0]]))
print(prediction)

prediction = model.predict(np.array([data[1][0]]))
print(prediction, data[1][1])

# Convert the model to the TensorFlow Lite format
converter = tf.lite.TFLiteConverter.from_keras_model(model)

# # Use quantization
# def representative_dataset():
#   for i in range(500):
#     yield([x_train[i].reshape(1, 1)])
# # Set the optimization flag.
# converter.optimizations = [tf.lite.Optimize.DEFAULT]
# # Enforce integer only quantization
# converter.target_spec.supported_ops = [tf.lite.OpsSet.TFLITE_BUILTINS_INT8]
# converter.inference_input_type = tf.int8
# converter.inference_output_type = tf.int8
# # Provide a representative dataset to ensure we quantize correctly.
# converter.representative_dataset = representative_dataset
model_tflite = converter.convert()
# raises error on M1 chip https://github.com/apple/tensorflow_macos/issues/133

# # Save the model to disk
open('model.tflite', "wb").write(model_tflite)