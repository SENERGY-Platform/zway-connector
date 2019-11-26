FROM alpine:3.8

RUN apk add --no-cache curl bash
COPY script.sh /script.sh
RUN chmod +x /script.sh
CMD /bin/bash /script.sh
