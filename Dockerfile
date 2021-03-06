ARG image
ARG environment

FROM ${image}:${environment}

LABEL org.opencontainers.image.source https://github.com/SENERGY-Platform/zway-connector

COPY connector-app /opt/z-way-server/automation/userModules/SenergyConnector
RUN chmod -R ug+rwx /opt/z-way-server/automation/userModules/SenergyConnector
