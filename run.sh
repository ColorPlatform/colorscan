export PORT=3000 
export ROOT_URL=http://localhost/ 
export MONGO_URL='mongodb://paxtest2:27017/localhost-testnet' 
# export METEOR_SETTINGS="$(cat settings.json)" 

echo launching Explorer at `pwd`

meteor run -p $PORT  --settings settings.json
