#FROM ubuntu
#FROM debian
#FROM maidbot/resin-raspberrypi3-qemu
FROM resin/raspberrypi3-debian
#FROM eugenmayer/zway

RUN apt-get -y update
RUN apt-get -qy install libxml2 libarchive-dev curl
RUN apt-get -qy install sharutils tzdata gawk
RUN apt-get -qy install libavahi-compat-libdnssd-dev

RUN apt-get -qy install libcurl4-openssl-dev

#RUN ln -s /usr/lib/x86_64-linux-gnu/libarchive.so.13 /usr/lib/x86_64-linux-gnu/libarchive.so.12
RUN ln -s /usr/lib/arm-linux-gnueabihf/libarchive.so.13 /usr/lib/arm-linux-gnueabihf/libarchive.so.12

RUN apt-get -qy install libc-ares-dev

RUN apt-get -qy install libwebsockets-dev

RUN apt-get -qy install wget
#RUN wget http://razberry.z-wave.me/z-way-server/z-way-server-Ubuntu-v2.0.1.tgz
#RUN wget http://razberry.z-wave.me/z-way-server/z-way-server-Ubuntu-v2.3.0.tgz
#RUN wget http://razberry.z-wave.me/z-way-server/z-way-server-Debian-v2.3.0.tgz
RUN wget http://razberry.z-wave.me/z-way-server/z-way-server-RaspberryPiXTools-v2.3.0.tgz

#RUN tar -zxf z-way-server-Ubuntu-v2.0.1.tgz -C /opt/
#RUN tar -zxf z-way-server-Ubuntu-v2.3.0.tgz -C /opt/
#RUN tar -zxf z-way-server-Debian-v2.3.0.tgz -C /opt/
RUN tar -zxf z-way-server-RaspberryPiXTools-v2.3.0.tgz -C /opt/

EXPOSE 8083
EXPOSE 8183

WORKDIR /opt/z-way-server/

COPY ./connector ./automation/userModules/SeplConnector
COPY ./config.xml ./config.xml

ENV LD_LIBRARY_PATH=libs

CMD ./z-way-server

#CMD /usr/bin/qemu-arm-static ./z-way-server #tail -f z-way-server.log
#CMD [ "/usr/bin/qemu-arm-static", "/opt/z-way-server/z-way-server"]
