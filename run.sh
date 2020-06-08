export PORT=3000 
export ROOT_URL=http://localhost/ 
export MONGO_URL='mongodb://localhost:27017/colorplatform' 
# export METEOR_SETTINGS="$(cat settings.json)" 

echo launching Explorer at `pwd`

meteor run -p $PORT  --settings settings.json
