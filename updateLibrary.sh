#!/bin/sh

echo 'Cloning fixed library'
git clone https://github.com/jgarff/rpi_ws281x.git

echo 'Removing old library'
rm -rf ./node_modules/@gbkwiatt/node-rpi-ws281x-native/src/rpi_ws281x

echo 'Replacing with fixed'
cp -r ./rpi_ws281x ./node_modules/@gbkwiatt/node-rpi-ws281x-native/src/

echo 'Recompiling'
cd ./node_modules/@gbkwiatt/node-rpi-ws281x-native/
npm rebuild
cd ../../../

echo 'Cleaning up'
rm -rf rpi_ws281x

echo 'Done!'

