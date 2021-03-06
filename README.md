# microbit-ML
A proof of concept of teaching ML on the new micro:bit v2. 

This repository implements a simple clap pattern detection module in micropython, where a model can be trained for a specific clap pattern and inference can be done on the micro:bit. To use the module, simply import it in micropython.

```
>>> import clapdetector
+-xkcd.com/353---------------------------------------------------+
|                                                                |
|                                                    \0/         |
|                                                  /   \         |
|        You're clapping!                Machine Learning!       |
|            Why?                                      \ \       |
|            /                                                   |
|          0                                                     |
|         /|\                                                    |
|          |                                                     |
|-----____/_\______________________________----------------------|
|                                                                |
+----------------------------------------------------------------+
```
Several methods are available for the module:

`clapdetector.listen()`: Clap detector starts actively listening for claps

`clapdetector.stop()`: Clap detector stops listening for claps

`clapdetector.is_listening()`: Returns a boolean indicating whether the clap detector is listening for claps

`clapdetector.was_detected()`: Returns if the clap pattern was detected since the last call to this function, and set the internal was_detected flag to *false*

Here is a simple program that lets the micro:bit play a happy sound whenever it detects the clap pattern:

```python
import clapdetector

clapdetector.listen()
while True:
    if clapdetector.was_detected():
        audio.play(Sound.HAPPY)
```

---

### An overview of the directory

├── **codal-microbit-v2**: Codal for microbit v2

├── **micropython-microbit-v2**: Micropython builder for the micro:bit

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├── lib

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├── **codal**: Codal builder, set to track the forked codal-microbit-v2

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├── **micropython**: MicroPython code base

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├── src

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├── codal_app

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├── codal_port

├── ML-Tests

├── **PythonEditor**: PythonEditor code base

└── README.md

Submodule directories are indicated in bold.

No changes were made to the **codal-microbit-v2** subrepository, but it is included for reference. Details regarding development within the other subrepositories are provided below.

---

### micropython-microbit-v2

In order to run TensorFlow Lite on the micro:bit, numerous modifications have been made to the underlying MicroPython library used for the micro:bit. These changes were made within the `src` directory, which contains two  subdirectories of interest: `codal_app` and `codal_port`.

#### codal_app

This is where the TensorFlow Lite library resides, along with code required for model inference. Three subdirectories have been added here to encapsulate all of the TensorFlow-related code:
1. `tensorflow/lite` contains a pared down version of the TFLite library
2. `tflite` contains files specific to the Clap Detector model
	* *model.cpp* defines an array `g_model` which represents the TFLite model to be used for inference
	* *tflite_predict.cpp* defines two functions, `setup` and `predict`, which are used to initialize the TFLite model and run inference, respectively
3. `third_party` contains code for FlatBuffer conversions which is required for our usage of TensorFlow Lite

The TFLite library used is similar to the one used in Edge Impulse's ["Voice Activated Micro:bit with Machine Learning"](https://www.edgeimpulse.com/blog/voice-activated-microbit) tutorial. The relevant source code can be found [here](https://github.com/edgeimpulse/voice-activated-microbit/tree/master/source/edge-impulse-sdk).

Due to the memory limitations of the micro:bit, unused TFLite scripts have been removed to conserve space. Additionally, the majority of operations defined for the `AllOpsResolver` have been redacted in *all_ops_resolver.cc*—only two required for the Clap Detector model remain, but other operations can be reinstated if needed (by uncommenting them out in *all_ops_resolver.cc*).

Additionally, we have set the `MICROBIT_BLE_ENABLED` flag used for building to 0, to exclude the micro:bit's Bluetooth library. Doing so frees up approximately 20KB of space on the micro:bit, which leaves enough memory for the Clap Detector model to be run in TensorFlow.

*main.cpp* was also augmented with new event handlers specific to the Clap Detector modules. Two different callback functions are defined:
1. `microbit_hal_clap_detector_level_callback` responds to audio level events generated by the microphone, and is utilized by *microbit_clap_detector.c*
2. `microbit_hal_clap_detector_callback` responds to events generated every 40ms by the timer, and is utilized by *modclapdetector.c*

The TFLite model is also initialized by a call to `setup` in *main.cpp*.

#### codal_port

Development within this subdirectory largely occured within 3 files:

1. ***microbit_clap_detector.c***
	This forms a framework for a Clap Detector module to be defined in terms of audio level events generated by the microphone. The implementation is incomplete, but could easily be finished off using code similar to that in *modclapdetector.c*, if this framework is more desirable.
2. ***modclapdetector.c***
	This is the complete implementation of the Clap Detector module. It handles interrupts every 40ms and when it is listening, calls the microphone module accordingly to get audio inputs. It then stores the audio event as a 1 if the volume exceeds `VOLUME_THRESHOLD` or a 0 otherwise, and appends it to the `sound_event_history_array` buffer. When this buffer is full, every subsequent timer interrupt results in a call to TensorFlow to run inference on the audio event history, and sets the `detected` flag accordingly.
3. ***mpconfigport.h***
	The Clap Detector module is declared here.

The `Makefile` in this directory was also modified with the names of the Clap Detector module files, in order to ensure that they are built by the compiler upon calls to `make`.

#### Other Changes

In order to compile the C++ scripts comprising the TensorFlow library, the *CMakeLists.txt* file in the `lib/codal` was extended with a rule to compile C++ files ending in *.cc*.

---

### ML-Tests

This contains the original files used to create the model. The python file `model.py` contains the python version of the model in Tensorflow, which was then converted into a javascript version in `index.html` and `index.js`, which provide a browser based way to train and test a model.

Other scripts in this directory are detailed below:
* ***converter.py***: Python script which converts a TensorFlow Lite model in JSON format (along with a .bin file containing the model's weights) to a .tflite file; used in conjunction with *xxdi.py* to prepare the model output by TensorFlowJS for inference on the micro:bit
* *label_image.py*: script used to run inference on a TFLite model in Python; used primarily for testing
* *Running_TensorFlow_Lite.ipynb*: used to run the *converter.py* and *xxdi.py* scripts together for testing; includes a link to an equivalent Google Colab notebook that can be run in the browser
* ***xxdi.py***: Python script which converts a TensorFlow Lite model in .tflite format to a C++ array of unsigned characters, which is compatible with the TensorFlow Lite build running on the micro:bit

Scripts involved in the end-to-end pipeline are bolded; other scripts are used solely for testing.

---

### PythonEditor

Within the PythonEditor subrepository, edits were made to the following files:

1. *js/python-main.js*
2. *editor.html*
3. *lang/en.js*

The majority of development occurred within *python-main.js*, with supporting edits in *editor.html* and *lang/en.js*.

In *editor.html*, a "Make Model" button is added along with a graphical interface used to record audio, train the model, and download files. The code which provides these functionalities is defined in *js/python-main.js*, and constant strings used in this addition to the editor are defined in *lang/en.js*.

The code added to *js/python-main.js* is encapsulated in a function called `doModel()`. This function performs a number of actions, including:

* Setting up the buttons in the GUI along with appropriate functions to be called when the buttons are clicked
* Initializing an instance of a MediaRecorder for use when recording audio clips
* Functions for creating supplementary training data for the ML model
* Method to train the TensorFlow model once sufficient data has been collected

The modified Python Editor can be tested by executing `./bin/show` in the command line to serve the editor, and then visiting http://localhost:8000/editor.html in the browser (as noted in `README.rst` in the PythonEditor repo).

*Note: the audio recorder has some security constraints, and may fail to run if these constraints are not met. This was not an issue during the development stage, but more testing may be needed to determine if this will impact users. Documentation on the audio recorder is available [here](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia#security).*