#!/bin/bash
sudo apt-get update
sudo apt-get upgrade -y
sudo apt-get -y install curl
curl -sL https://deb.nodesource.com/setup_16.x -o /tmp/nodesource_setup.sh
sudo bash /tmp/nodesource_setup.sh
sudo apt-get install nodejs
sudo apt-get install unzip
unzip /home/ubuntu/webapp.zip -d /home/ubuntu/webapp
# sleep 10
cd /home/ubuntu/webapp || exit
npm i
# sleep 10
sudo mv /home/ubuntu/webapp/node.service /etc/systemd/system/node.service
# sudo systemctl daemon-reload
# sudo systemctl status node.service
sudo systemctl enable node.service
sudo systemctl start node.service

# sudo npm i pm2

# sudo npm i -g pm2

# sudo pm2 start index.js

# sudo pm2 startup systemd



# sudo apt-get clean