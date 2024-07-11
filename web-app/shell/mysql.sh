#!/bin/bash
# sudo apt update
# sudo apt install mysql-server
# sudo systemctl start mysql.service
# sudo mysql
# ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'password';
# sudo mysql_secure_installation
# sudo systemctl status mysql.service

# "sudo apt-get -y install mysql-server",
    #   "sudo systemctl stop mysql.service",
    #   "sudo systemctl start mysql.service",
    #   "sudo systemctl enable mysql.service",
    #   "sudo systemctl status mysql.service",

echo "Installing mysql server"

sudo apt-get install mysql-server -y

sudo mysql <<EOF

CREATE DATABASE userdb;
DROP USER root@localhost;
FLUSH PRIVILEGES;
CREATE USER 'root'@'localhost' IDENTIFIED BY 'password';

GRANT ALL PRIVILEGES ON userdb.* TO 'root'@'localhost' WITH GRANT OPTION;

FLUSH PRIVILEGES;

EOF

echo "Starting mysql server"

sudo service mysql start



sudo npm i pm2

sudo npm i -g pm2

sudo pm2 start webapp/index.js

sudo pm2 startup systemd



sudo apt-get clean