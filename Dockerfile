FROM arm32v7/debian:stretch-slim

COPY docker_resources/qemu-arm-static /usr/bin

RUN apt-get -y update
RUN apt-get -y install wget libcurl4-openssl-dev net-tools iproute2 systemd insserv

RUN mkdir /etc/z-way
RUN touch /etc/z-way/box_type

ADD http://support.zwave.eu/libs /opt/zway-libs.sh
RUN chmod +x /opt/zway-libs.sh
RUN /opt/zway-libs.sh
ADD http://razberry.z-wave.me/install /opt/zway-install.sh
RUN chmod +x /opt/zway-install.sh
RUN /opt/zway-install.sh

EXPOSE 8083
EXPOSE 8183

WORKDIR /opt/z-way-server/

COPY ./connector ./automation/userModules/SeplConnector
COPY SenergyConnector ./automation/userModules/SenergyConnector
COPY ./docker_resources/config.xml ./config.xml

ENV LD_LIBRARY_PATH=libs

RUN touch /var/log/z-way-server.log

CMD ./z-way-server
