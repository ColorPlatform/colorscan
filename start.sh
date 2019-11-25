#!/bin/bash

echo "stating for production..."
echo $MONGO_URL
echo $METEOR_SETTINGS
PORT=3000 ROOT_URL=http://localhost/ MONGO_URL=$MONGO_URL METEOR_SETTINGS=$METEOR_SETTINGS meteor node main.js


