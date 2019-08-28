#!/bin/bash

# If first install, get new ID
if [[ ! -e /opt/initialized ]]; then
	echo "First install, getting Remote ID"
	echo '#!/bin/bash
### BEGIN INIT INFO
# Provides:          zbw_autosetup
# Required-Start:    $all
# Required-Stop:     $all
# Default-Start:     2 3 4 5
# Default-Stop:      0 1 6
# Short-Description: zbw_autosetup
# Description:       the script setup a zbw_connect script
### END INIT INFO


function delete_me()
{
    insserv -r zbw_autosetup
    rm -f /etc/init.d/zbw_autosetup
    rm -f $0
}

if [[ $0 == "/tmp/zbw_autosetup" ]]; then
    delete_me;
    exit
fi

case "$1" in
    start)
        # if we already have zbw_connect, delete ourself
	if [[ -x /etc/init.d/zbw_connect ]]; then
	    # a hack to eliminate an error on a remouting / ro
	    cp $0 /tmp/zbw_autosetup
	    exec /tmp/zbw_autosetup
	fi

        if wget -4 http://find.zwave.me/zbw_new_user -O /tmp/zbw_connect_setup.run; then
            sleep 10
	    if bash /tmp/zbw_connect_setup.run; then
	        # Update service file for Jessie
	        systemctl daemon-reload
	        /etc/init.d/zbw_connect start
	        # a hack to eliminate an error on a remouting / ro
	        cp $0 /tmp/zbw_autosetup
	        exec /tmp/zbw_autosetup
	    fi
	    mount -o remount,ro /
	fi
	;;
esac
' > /etc/init.d/zbw_autosetup
	chmod +x /etc/init.d/zbw_autosetup
	/etc/init.d/zbw_autosetup start
	touch /opt/initialized
else
	echo "Start zbw_connect"
	/etc/init.d/zbw_connect start
fi

echo "Start mongoose http server"
/etc/init.d/mongoose start

echo "Update vendor database"
(cd ZDDX && ./UpdateXMLs.sh)

echo "Start z-way-server"
./z-way-server
