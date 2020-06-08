export PORT=3000 
export ROOT_URL=http://localhost/ 
export MONGO_URL='mongodb://localhost:27017/localhost-testnet' 
export METEOR_SETTINGS="$(cat settings.json)" 

echo launching Explorer at `pwd`
cd bundle

node main.js
