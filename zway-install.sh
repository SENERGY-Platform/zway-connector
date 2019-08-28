#!/bin/bash

if [ -z "$ZWAY_VERSION" ]; then
  echo "No version provided"
  exit 1
fi

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

INSTALL_DIR=/opt
TEMP_DIR=/tmp
BOXED=`[ -e /etc/z-way/box_type ] && echo yes`

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

# Download z-way-server
echo "Downloading z-way-server"
FILE="z-way-server-RaspberryPiXTools-v${ZWAY_VERSION}.tgz"
echo "Getting Z-Way for Raspberry Pi and installing"
wget -4 http://razberry.z-wave.me/z-way-server/${FILE} -P $TEMP_DIR/

# Extract z-way-server
echo "Extracting z-way-server"
tar -zxfo $TEMP_DIR/$FILE -C $TEMP_DIR

if [[ "$?" -eq "0" ]]; then
	mv $TEMP_DIR/z-way-server $INSTALL_DIR/
	echo "z-way-server installed"
else
	echo "Downloading and extracting z-way-server failed"
	echo "Exiting"
	exit 1
fi

mkdir -p /etc/z-way
echo "$ZWAY_VERSION" > /etc/z-way/VERSION
echo "razberry" > /etc/z-way/box_type

# Getting Webif and installing
echo "Getting Webif for Raspberry Pi and installing"
wget -4 http://razberry.z-wave.me/webif_raspberry.tar.gz -O - | tar -zxo -C /

# Getting webserver mongoose for webif
cd $TEMP_DIR
echo "Getting webserver mongoose for Webif"
wget -4 http://razberry.z-wave.me/mongoose.pkg.rPi.tgz -P $TEMP_DIR

# Installing webserver mongoose for webif
tar -zxfo $TEMP_DIR/mongoose.pkg.rPi.tgz -C /

exit 0
