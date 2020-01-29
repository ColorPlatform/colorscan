#!/bin/bash

echo "Builing for production..."
meteor build output/ --architecture os.linux.x86_64 --server-only

rm -rf bundle
tar -xvf output/explorer.tar.gz
# rm -rf output

cd bundle/programs/server && meteor npm install --save
