#!/usr/bin/env bash
docker run -it -p 8090:8083 -p 8183:8183 -v /usr/bin/qemu-arm-static:/usr/bin/qemu-arm-static --name zway --restart=always zway