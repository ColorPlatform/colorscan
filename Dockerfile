FROM ubuntu:xenial-20191024

RUN apt-get update
RUN apt-get -y install curl gnupg
RUN curl -sL https://deb.nodesource.com/setup_11.x  | bash -
RUN apt-get -y install nodejs

RUN curl https://install.meteor.com/ | sh
RUN apt-get update && echo Y | apt-get install build-essential 
WORKDIR /usr/src/app

COPY bundle/ /usr/src/app/
COPY start.sh /usr/src/app/
#COPY settings.json /usr/src/app/
RUN npm install -C programs/server/
CMD ["sh","start.sh"] 


