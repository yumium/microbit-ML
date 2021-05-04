import tensorflow as tf
import os
import tensorflowjs as tfjs

model = tfjs.converters.load_keras_model("directory/my-model.json")
model.save("directory")



converter = tf.lite.TFLiteConverter.from_saved_model("directory")
tflite_model = converter.convert()
open("converted_model.tflite", "wb").write(tflite_model)

print("lalala")
os.system("pause")