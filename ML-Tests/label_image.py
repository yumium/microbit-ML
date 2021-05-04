# Copyright 2018 The TensorFlow Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
# ==============================================================================
"""label_image for tflite."""

from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import argparse
import time

import numpy as np
from PIL import Image
import tflite_runtime.interpreter as tflite


def load_labels(filename):
  with open(filename, 'r') as f:
    return [line.strip() for line in f.readlines()]


if __name__ == '__main__':
  parser = argparse.ArgumentParser()
  parser.add_argument(
      '-m',
      '--model_file',
      default='converted_model.tflite',
      help='.tflite model to be executed')
  parser.add_argument(
      '-i',
      '--input_array',
      help='input array to be evaluated')
  args = parser.parse_args()

  interpreter = tflite.Interpreter(model_path=args.model_file)
  interpreter.allocate_tensors()

  input_details = interpreter.get_input_details()
  output_details = interpreter.get_output_details()

  # check the type of the input tensor
#   floating_model = input_details[0]['dtype'] == np.float32

  # NxHxWxC, H:1, W:2
#   height = input_details[0]['shape'][1]
#   width = input_details[0]['shape'][2]
#   img = Image.open(args.image).resize((width, height))

  # add N dim
#   input_data = np.expand_dims(img, axis=0)

#   if floating_model:
#     input_data = (np.float32(input_data) - args.input_mean) / args.input_std
  print("input_details")
  print(input_details)

  prelim_input = eval(args.input_array)
  print("prelim_input: "+",".join([str(i) for i in prelim_input]))

  float_input = np.array(prelim_input, dtype=np.float32)
  print("float_input: "+",".join([str(i) for i in float_input]))
  interpreter.set_tensor(input_details[0]['index'], np.expand_dims(float_input, axis=0))

  start_time = time.time()
  interpreter.invoke()
  stop_time = time.time()

  output_data = interpreter.get_tensor(output_details[0]['index'])
  print("output: "+",".join([str(i) for i in output_data]))
#   results = np.squeeze(output_data)

#   top_k = results.argsort()[-5:][::-1]
#   labels = load_labels(args.label_file)
#   for i in top_k:
#     if floating_model:
#       print('{:08.6f}: {}'.format(float(results[i]), labels[i]))
#     else:
#       print('{:08.6f}: {}'.format(float(results[i] / 255.0), labels[i]))

#   print('time: {:.3f}ms'.format((stop_time - start_time) * 1000))

