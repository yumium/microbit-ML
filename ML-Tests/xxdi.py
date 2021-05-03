#!/usr/bin/python
#coding=utf-8
# SOURCE: https://www.tutorialfor.com/blog-182584.htm
# Python script emulating the functionality of the terminal command: xxd -i
# in order to convert an exported TensorflowLite model into a C array

import os, re, sys
from functools import reduce

# Constants
COLS=12
#Determine if the C language keyword
ckeywords=("auto", "break", "case", "char", "const", "continue", "default","do", "double", "else", "enum", "extern", "float", "for","goto", "if", "int", "long", "register", "return", "short","signed", "static", "sizeof", "struct", "switch", "typedef", "union","unsigned", "void", "volatile", "while", "_bool") #_bool is a new c99 keyword

def isckeywords(name):
    for x in ckeywords:
        if x == name:
            return True
    return False

def generatecarrayname(infile):
    #All characters except alphanumeric underscore are underlined
    #The definition of "int $= 5;" compiles and passes in gcc 4.1.2,But still considered illegal identifier here
    infile=re.sub ("[^ 0-9a-za-z \ _]", "_", infile) #"_" changed to "" to remove illegal characters
    #Beginning of numbers plus double underscore
    if infile[0].isdigit ():
        infile="__" + infile
        #If the input file name is a C language keyword,Then capitalize and underline the suffix as the array name
        #Cannot just capitalize or underline before,Otherwise it is easy for user-defined name conflicts
    if isckeywords (infile):
        infile="%s_"%infile.upper()
    return infile

def xxdi(infile, outfile, carrayname):
    if os.path.isfile (infile) is False:
        print(infile+" is not a file!")
        return
    with open (infile, "rb") as file: #Must access the binary file in "b" mode
        #Do not use for line in file or readline (s) to avoid "0x0a" line break
        content=file.read()
        #"Break" the file contents into a byte array and convert each byte to hexadecimal form
        # SOURCE: https://stackoverflow.com/questions/11676864/how-can-i-format-an-integer-to-a-two-digit-hex
        content=list(map (lambda x: "0x{:02x}".format(x), content))

    #Constructing array definition header and length variables
    carrayheader='''#include "model.h"
                    
// Keep model aligned to 8 bytes to guarantee aligned 64-bit accesses.
alignas(8) const unsigned char %s[] = {'''%carrayname
    carraytailer="};\nconst int %s_len = %d;"%(carrayname, len (content))

    #print will wrap automatically after each line of output
    if outfile is None:
        print(carrayheader)
        for i in range (0, len (content), COLS):
            line="," .join (content [i:i + COLS])
            print("" + line + ",")
            print(carraytailer)
            return
    with open (outfile, "w") as file:
        file.write (carrayheader + "\n")
        for i in range (0, len (content), COLS):
            line= reduce(lambda x, y:", " .join ([x, y]), content [i:i + COLS])
            file.write ("%s, \n"%line)
            file.flush ()
        file.write (carraytailer)

        
if __name__ == "__main__":
    xxdi(infile="model.tflite", outfile="model.cpp", carrayname='g_model')

#xxdi ()