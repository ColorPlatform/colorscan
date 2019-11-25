#!/bin/bash

echo "Starting Docker"
docker run -d -p 3000:3000  -e MONGO_URL=mongodb://rnssol:rnssol1234@18.223.52.186:27017/colorplatform -e METEOR_SETTINGS="$(cat settings.json)" --name explorer rnssolutions/explorer:0.1.3

