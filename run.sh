export PORT=3000 
export ROOT_URL=http://localhost/ 
export MONGO_URL='mongodb://localhost:27017/color-rc' 

echo launching Explorer at `pwd`

meteor run -p $PORT  --settings settings.json
