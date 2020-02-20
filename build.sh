#!/bin/bash

echo "Builing for production..."
meteor build ../output/ --architecture os.linux.x86_64 --server-only

echo BUILD FINISHED
echo UNPACK BUNDLE
rm -rf bundle
tar -xf ../output/explorer.tar.gz
# rm -rf output

echo INSTALL DEPENDENCIES
cd bundle/programs/server && meteor npm install --save
