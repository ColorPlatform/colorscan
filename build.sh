#!/bin/bash

echo "Builing for production..."
rm -rf bundle
meteor build output/ --architecture os.linux.x86_64 --server-only
tar -xvf output/explorer.tar.gz
rm -rf output

cd bundle/programs/server && meteor npm install --save
