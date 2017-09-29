##Dependencies
http://blog.ubergarm.com/run-arm-docker-images-on-x86_64-hosts/

##docker start

```
docker run -it -p 8090:8083 -p 8183:8183 -v /usr/bin/qemu-arm-static:/usr/bin/qemu-arm-static --name zway --restart=always zway
```

##rasp deploy

```
cd /opt/z-way-server/automation/userModules/<<zway-connector-project>>
sudo cp -r connector ../SeplConnector
sudo service z-way-server restart
tail -f /var/log/z-way-server.log
```