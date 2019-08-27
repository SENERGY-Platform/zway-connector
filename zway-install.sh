#!/bin/bash

# install old libs for z-way on raspbian stretch

IS_STRETCH=`cat /etc/*-release | grep stretch`
if [[ ! -z $IS_STRETCH ]]
then
	echo "Raspbian Stretch system detected"
	if [[ ! -e /usr/lib/arm-linux-gnueabihf/libssl.so.1.0.0 ]]
	then
		echo "Get libssl"
		wget -4 https://support.zwave.eu/raspberryPi_libssl.so.1.0.0 -O /usr/lib/arm-linux-gnueabihf/libssl.so.1.0.0
	fi
	if [[ ! -e /usr/lib/arm-linux-gnueabihf/libcrypto.so.1.0.0 ]]
	then
		echo "Get libcrypto"
		wget -4 https://support.zwave.eu/raspberryPi_libcrypto.so.1.0.0 -O /usr/lib/arm-linux-gnueabihf/libcrypto.so.1.0.0
	fi

	if [[ ! -e /usr/lib/arm-linux-gnueabihf/libssl.so ]]
		then
		echo "Making symlinks to libssl.so"
		cd /usr/lib/arm-linux-gnueabihf/
		ln -s libssl.so.1.0.0 libssl.so
	fi

	if [[ ! -e /usr/lib/arm-linux-gnueabihf/libcrypto.so ]]
		then
		echo "Making symlinks to libcrypto.so"
		cd /usr/lib/arm-linux-gnueabihf/
		ln -s libcrypto.so.1.0.0 libcrypto.so
	fi
else
	echo "No Raspbian Stretch system detected!"
fi


# installer zway to raspberry

INSTALL_DIR=/opt
ZWAY_DIR=$INSTALL_DIR/z-way-server
TEMP_DIR=/tmp
BOXED=`[ -e /etc/z-way/box_type ] && echo yes`

if [[ $ZWAY_UPIF ]]; then
    write_upi() {
	echo -e $1 > $ZWAY_UPIF
    }
else
    write_upi() {
	true;
    }
fi

##### The percentage of updates #####
write_upi "10%\nStarting upgrading"
#####################################

# Check for root priviledges
if [[ $(id -u) != 0 ]]
then
	echo "Superuser (root) priviledges are required to install Z-Way"
	echo "Please do 'sudo -s' first"
	exit 1
fi

# Accept EULA
if [[ "$BOXED" != "yes" ]]
then
	echo "Do you accept Z-Wave.Me licence agreement?"
	echo "Please read it on Z-Wave.Me web site: http://razberry.z-wave.me/docs/ZWAYEULA.pdf"
	while true
	do
		echo -n "yes/no: "
		read ANSWER < /dev/tty
		case $ANSWER in
			yes)
				break
				;;
			no)
				exit 1
				;;
		esac
		echo "Please answer yes or no"
	done
fi

echo "z-way-server new installation"

# Check symlinks
if [[ ! -e /usr/lib/arm-linux-gnueabihf/libssl.so ]]
	then
	echo "Making symlinks to libssl.so"
	cd /usr/lib/arm-linux-gnueabihf/
	ln -s libssl.so.1.0.0 libssl.so
fi

if [[ ! -e /usr/lib/arm-linux-gnueabihf/libcrypto.so ]]
	then
	echo "Making symlinks to libcrypto.so"
	cd /usr/lib/arm-linux-gnueabihf/
	ln -s libcrypto.so.1.0.0 libcrypto.so
fi

# Check libarchive.so.12 exist
if [[ ! -e /usr/lib/arm-linux-gnueabihf/libarchive.so.12 ]]
then
	echo "Making link to libarchive.so.12"
	ln -s /usr/lib/arm-linux-gnueabihf/libarchive.so /usr/lib/arm-linux-gnueabihf/libarchive.so.12
fi

##### The percentage of updates #####
write_upi "40%\nGetting Z-Way for Raspberry Pi"
#####################################

FILE=`basename z-way-server/z-way-server-RaspberryPiXTools-v2.3.7.tgz`
echo "Getting Z-Way for Raspberry Pi and installing"
wget -4 http://razberry.z-wave.me/z-way-server/z-way-server-RaspberryPiXTools-v2.3.7.tgz -P $TEMP_DIR/

##### The percentage of updates #####
write_upi "50%\nExtracting new z-way-server"
#####################################

# remove z-way-server if exist
rm -rf $TEMP_DIR/z-way-server
# Extracting z-way-server
echo "Extracting new z-way-server"
tar -zxf $TEMP_DIR/$FILE -C $TEMP_DIR


##### The percentage of updates #####
write_upi "60%\nMaking backup and installing Z-Way"
#####################################

# If downloading and extracting is ok, then make backup and move z-way-server from /tmp to /data
if [[ "$?" -eq "0" ]]; then
	mv $TEMP_DIR/z-way-server $INSTALL_DIR/
	echo "New version z-way-server installed"
else
	write_upi "30%\nDownloading and extracting z-way-server failed"

	echo "Downloading and extracting z-way-server failed"
	echo "Exiting"
	exit 1
fi

mkdir -p /etc/z-way
echo "v2.3.7" > /etc/z-way/VERSION
echo "razberry" > /etc/z-way/box_type


##### The percentage of updates #####
write_upi "70%\nGetting Webif for Raspberry Pi and installing"
#####################################

# Getting Webif and installing
echo "Getting Webif for Raspberry Pi and installing"
wget -4 http://razberry.z-wave.me/webif_raspberry.tar.gz -O - | tar -zx -C /

##### The percentage of updates #####
write_upi "80%\nGetting webserver mongoose for Webif"
#####################################

# Getting webserver mongoose for webif
cd $TEMP_DIR
echo "Getting webserver mongoose for Webif"
wget -4 http://razberry.z-wave.me/mongoose.pkg.rPi.tgz -P $TEMP_DIR

##### The percentage of updates #####
write_upi "90%\nRestarting Webif and Z-Way"
#####################################

# Installing webserver mongoose for webif
tar -zxf $TEMP_DIR/mongoose.pkg.rPi.tgz -C /


# Prepare AMA0
# sed 's/console=ttyAMA0,115200//; s/kgdboc=ttyAMA0,115200//; s/console=serial0,115200//' /boot/cmdline.txt > /tmp/zway_install_cmdline.txt


# Transform old DevicesData.xml to new format
#(cd $ZWAY_DIR && test -x ./z-cfg-update && ls -1 config/zddx/*.xml > /dev/null 2>&1 | LD_LIBRARY_PATH=./libs xargs -l ./z-cfg-update)


# Make sure to save changes
#sync

echo "Thank you for using RaZberry!"

exit 0

