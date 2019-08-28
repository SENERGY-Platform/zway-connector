FROM arm32v7/debian:stretch-slim

ENV LD_LIBRARY_PATH=/opt/z-way-server/libs
ENV PATH=/opt/z-way-server:$PATH
ENV ZWAY_VERSION=2.3.8

RUN apt-get update
RUN apt-get -y install wget sharutils tzdata gawk libc-ares2 libavahi-compat-libdnssd-dev libarchive-dev unzip python \
    iproute2 libcurl4-openssl-dev zlib1g-dev libc-ares-dev libv8-dev cron

RUN mkdir /etc/z-way
RUN touch /etc/z-way/box_type

COPY zway-install.sh /opt/zway-install.sh
COPY zway-start.sh /opt/zway-start.sh

RUN chmod +x /opt/zway-install.sh
RUN chmod +x /opt/zway-start.sh
RUN /opt/zway-install.sh
COPY config.xml /opt/z-way-server/config.xml
COPY connector-app /opt/z-way-server/automation/userModules/SenergyConnector

WORKDIR /opt/z-way-server/

CMD ["/opt/zway-start.sh"]
