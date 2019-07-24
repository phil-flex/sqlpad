#!/bin/sh

ip=`ipconfig|awk '/IPv4/ {print $14}'| sed 's/\\r//g'`
node=`echo $ip|awk -F. '{print $4}'`

cd /opt/sqlpad/server
node server.js --dir  C://cygwin64//var//lib//sqlpad --ip $ip --port 3000 --base-url /sqlpad${node} --public-url https://external.web-site.address --save
