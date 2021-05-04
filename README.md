# microbit-ML
A proof of concept of teaching ML on the new micro:bit v2

### An overview of the directory

├── ML-Tests

├── **codal-microbit-v2**

├── **micropython-microbit-v2**

​        ├── lib

​                ├── **codal**

​                ├── **micropython**

├── **PythonEditor**

└── README.md

bold directories are submodules

ML-Tests

This contains the original files used to create the model. The python file `model.py` contains the python version of the model in Tensorflow, which was then converted into a javascript version in `index.html` and `index.js`, which provide a browser based way to train and test a model.

The file `xxdi.py` file is a converter from the TensorflowLite model to a `.cpp` file containing the model which can be used in micropython.

**codal-microbit-v2**: Codal for microbit v2

**micropython-microbit-v2**: Micropython builder for the micro:bit

**codal**: Codal builder. I have set the url to track the forked codal-microbit-v2

**micropython**: Micropython code base

**PythonEditor**: PythonEditor code base

