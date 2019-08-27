#!/bin/bash

# If first install, get new ID
if [[ ! -e /etc/init.d/zbw_connect ]]
	then
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
else
	# Update zbw_connect to new version
	cd /etc/init.d/
	./zbw_connect stop
	echo 'begin-base64 644 zbw_connect_with_out_key
IyEvYmluL2Jhc2gKIyMjIEJFR0lOIElOSVQgSU5GTwojIFByb3ZpZGVzOiAg
ICAgICAgICB6YndfY29ubmVjdAojIFJlcXVpcmVkLVN0YXJ0OiAgICAkYWxs
CiMgUmVxdWlyZWQtU3RvcDogICAgICRhbGwKIyBEZWZhdWx0LVN0YXJ0OiAg
ICAgMiAzIDQgNQojIERlZmF1bHQtU3RvcDogICAgICAwIDEgNgojIFNob3J0
LURlc2NyaXB0aW9uOiB6YndfY29ubmVjdAojIERlc2NyaXB0aW9uOiAgICAg
ICB0aGUgc2NyaXB0IHRvIGNvbm5lY3QgdG8gemJ3IHNlcnZlcgojIyMgRU5E
IElOSVQgSU5GTwoKUElERklMRT0vdmFyL3J1bi96YndfY29ubmVjdC5waWQK
CiMgdGVzdCBhIHdyaXRhYmxlIG9mIC90bXAKaWYgISB0b3VjaCAvdG1wLy56
YndfY29ubmVjdF9yd190ZXN0Owp0aGVuCiAgICBlY2hvICIvdG1wIGlzIG5v
dCB3cml0YWJsZSIgPiYyCiAgICBleGl0IDEKZmkKcm0gLWYgL3RtcC8uemJ3
X2Nvbm5lY3RfcndfdGVzdCAyPi9kZXYvbnVsbCB8fCB0cnVlCgojIGdldCBh
IHVzZXIgcGFzc3dvcmQKUEFTU1dPUkQ9YGNhdCAvZXRjL3pidy9wYXNzd2Rg
CmlmIFtbIC16ICRQQVNTV09SRCBdXTsKdGhlbgogICAgZWNobyAiRGlkbid0
IGZpbmQgcGFzc3dkIGZpbGUiID4mMgogICAgZXhpdCAxCmZpCgojIGdldCBh
IGxvY2FsIHBvcnQKTE9DQUxfUE9SVD1gY2F0IC9ldGMvemJ3L2xvY2FsX3Bv
cnRgCmlmIFtbIC16ICRMT0NBTF9QT1JUIF1dOwp0aGVuCiAgICBlY2hvICJE
aWRuJ3QgZmluZCBsb2NhbF9wb3J0IGZpbGUiID4mMgogICAgZXhpdCAxCmZp
CgojIGdldCBhIGJveCB0eXBlCkJPWFRZUEU9YGNhdCAvZXRjL3otd2F5L2Jv
eF90eXBlYAoKW1sgLXIgL2xpYi9sc2IvaW5pdC1mdW5jdGlvbnMgXV0gJiYg
LiAvbGliL2xzYi9pbml0LWZ1bmN0aW9ucwoKCiMgSWYgc2NyaXB0IGlzIGV4
ZWN1dGVkIGFzIGFuIGluaXQgc2NyaXB0CmNhc2UgIiQxIiBpbgogICAgc3Rh
cnQpCglsb2dfZGFlbW9uX21zZyAiU3RhcnRpbmcgemJ3X2Nvbm5lY3QiCglQ
SUQ9YGNhdCAkUElERklMRSAyPi9kZXYvbnVsbGAKCWlmIFtbICRQSUQgXV07
Cgl0aGVuCgkgICAgTkFNRT1gcHMgLUFvIHBpZCxjb21tIHwgYXdrIC12IFBJ
RD0kUElEICckMSA9PSBQSUQgJiYgJDIgfiAvemJ3X2Nvbm5lY3QvIHsgcHJp
bnQgJDIgfSdgCgkgICAgaWYgW1sgJE5BTUUgXV07CgkgICAgdGhlbgoJCWVj
aG8gImFscmVhZHkgcnVubmluZyIKCQlleGl0CgkgICAgZmkKCWZpCgkobm9o
dXAgc2V0c2lkICQwID4vZGV2L251bGwgMj4mMSAmKQoJbG9nX2FjdGlvbl9t
c2cgIm9rIgoJZXhpdAoJOzsKICAgIHN0b3ApCglsb2dfZGFlbW9uX21zZyAi
U3RvcGluZyB6YndfY29ubmVjdCIKCVBJRD1gY2F0ICRQSURGSUxFIDI+L2Rl
di9udWxsYAoJaWYgW1sgJFBJRCBdXTsKCXRoZW4KCSAgICBmb3IgcGlkIGlu
IGBwcyAtQW8gcGlkLGNvbW0gfCBhd2sgJyQyIH4gL3pid19jb25uZWN0LyB7
IHByaW50ICQxIH0nYDsKCSAgICBkbwoJCVtbICRwaWQgLWVxICRQSUQgXV0g
JiYga2lsbCAtVEVSTSAtJHBpZCAmJiBicmVhawoJICAgIGRvbmUKCWZpCgoJ
cm0gLWYgJFBJREZJTEUKCXJtIC1mIC90bXAvemJ3X2Nvbm5lY3QucHJpdgoJ
bG9nX2FjdGlvbl9tc2cgIm9rIgoJZXhpdCAwCgk7OwogICAgcmVzdGFydCkK
CSQwIHN0b3AKCSQwIHN0YXJ0CglleGl0Cgk7OwogICAgcmVzdGFydF93aXRo
X2RlbGF5KQogICAgICAgIChub2h1cCBzZXRzaWQgJDAgX3Jlc3RhcnRfZGVs
YXllZCAkMiA+L2Rldi9udWxsIDI+JjEgJikKICAgICAgICBleGl0CiAgICAg
ICAgOzsKICAgIF9yZXN0YXJ0X2RlbGF5ZWQpCiAgICAgICAgc2xlZXAgJDIK
ICAgICAgICAkMCBzdG9wCiAgICAgICAgJDAgc3RhcnQKICAgICAgICBleGl0
CiAgICAgICAgOzsKZXNhYwoKIyBDYW4gd2UgcnVuPwpbWyAtZiAvZXRjL3pi
dy9mbGFncy9ub19jb25uZWN0aW9uIF1dICYmIGV4aXQgMAoKZWNobyAkJCA+
ICRQSURGSUxFCgojIEV4dHJhY3QgYSBwcml2YXRlIGtleQpvZmZzZXQ9YHNl
ZCAtZSAnL15TVEFSVF9PRl9FTUJFRERFRF9EQVRBJC8gcScgJDAgfCB3YyAt
Y2AKdG91Y2ggL3RtcC96YndfY29ubmVjdC5wcml2CmNobW9kIDA2MDAgL3Rt
cC96YndfY29ubmVjdC5wcml2CmRkIGlmPSQwIG9mPS90bXAvemJ3X2Nvbm5l
Y3QucHJpdiBicz0kb2Zmc2V0IHNraXA9MSA+L2Rldi9udWxsIDI+JjEKCiMg
U29tZSBjb25zdGFudHMKU0VSVkVSPSJmaW5kLnotd2F2ZS5tZSIKU1NIX1VT
RVI9InJlbW90ZSIKCiMgTWFrZSBmb3J3YXJkIG9wdHMgc3RyaW5nCkZXRF9P
UFRTPSItUiAwLjAuMC4wOjEwMDAwOjEyNy4wLjAuMTokTE9DQUxfUE9SVCIK
aWYgW1sgLWYgL2V0Yy96YncvZmxhZ3MvZm9yd2FyZF9zc2ggXV07CnRoZW4K
ICAgIEZXRF9PUFRTPSIkRldEX09QVFMgLVIgMC4wLjAuMDoxMDAwMToxMjcu
MC4wLjE6MjIiCmZpCgpmdW5jdGlvbiBnZXRfbG9jYWxfaXBzKCkKewogICAg
IyBHZXQgbG9jYWwgaXBzCiAgICBpZiBbWyAteCBgd2hpY2ggaXBgIF1dOyB0
aGVuCglMT0NBTF9JUFM9YGlwIGEgfCBzZWQgLW5yZSAncy9eXHMraW5ldCAo
WzAtOS5dKykuKyQvXDEvOyBUIG47IHA7IDpuJ2AKICAgIGVsaWYgW1sgLXgg
YHdoaWNoIGlmY29uZmlnYCBdXTsgdGhlbgoJTE9DQUxfSVBTPWBpZmNvbmZp
ZyB8IHNlZCAtbnJlICdzL15ccytpbmV0IGFkZHI6KFswLTkuXSspLiskL1wx
LzsgVCBuOyBwOyA6bidgCiAgICBlbHNlCgllY2hvIENhblwndCBnZXQgbG9j
YWwgaXAgYWRkcmVzc2VzID4mMgoJbG9nZ2VyIC10IHpid19jb25uZWN0IENh
blwndCBnZXQgbG9jYWwgaXAgYWRkcmVzc2VzCglleGl0IDEKICAgIGZpCiAg
ICAjIGkgdGhpbmsgZmlsdGVyaW5nIG91dCBvbmx5IDEyNy4wLjAuMSBhZGRy
ZXNzIGlzIHN1ZmZpY2llbnQKICAgIFpCV19JTlRFUk5BTF9JUD0iIgogICAg
Zm9yIGkgaW4gJExPQ0FMX0lQUzsgZG8KCWlmIFtbICRpICE9ICIxMjcuMC4w
LjEiIF1dOyB0aGVuCgkgICAgaWYgW1sgJFpCV19JTlRFUk5BTF9JUCBdXTsg
dGhlbgoJCVpCV19JTlRFUk5BTF9JUD0iJFpCV19JTlRFUk5BTF9JUCwkaSI7
CgkgICAgZWxzZQoJCVpCV19JTlRFUk5BTF9JUD0iJGkiOwoJICAgIGZpCglm
aQogICAgZG9uZQp9CgpleHBvcnQgWkJXX1BBU1NXT1JEPSRQQVNTV09SRApl
eHBvcnQgWkJXX0lOVEVSTkFMX0lQCmV4cG9ydCBaQldfSU5URVJOQUxfUE9S
VD0kTE9DQUxfUE9SVApleHBvcnQgWkJXX0JPWFRZUEU9JEJPWFRZUEUKCndo
aWxlIHRydWUKZG8KICAgIGdldF9sb2NhbF9pcHMKCiAgICBzc2ggLWkgL3Rt
cC96YndfY29ubmVjdC5wcml2IC1UIC1vICdTdHJpY3RIb3N0S2V5Q2hlY2tp
bmcgbm8nIC1vICdVc2VyS25vd25Ib3N0c0ZpbGUgL2Rldi9udWxsJyAtbyAn
QmF0Y2hNb2RlIHllcycgLW8gJ1NlbmRFbnYgWkJXXyonIC1vICJFeGl0T25G
b3J3YXJkRmFpbHVyZSB5ZXMiIC1vICJTZXJ2ZXJBbGl2ZUludGVydmFsIDMw
IiAtbyAiU2VydmVyQWxpdmVDb3VudE1heCAzIiAkRldEX09QVFMgJFNTSF9V
U0VSQCRTRVJWRVIKICAgIHNsZWVwIDEKZG9uZQoKZXhpdCAwCg==
====' | uudecode  -o zbw_connect.new
	tail -n 29 zbw_connect >> zbw_connect.new
	mv zbw_connect.new zbw_connect
	chmod +x zbw_connect
	# Update service file for Jessie
	systemctl daemon-reload
	# Change default zbw port to 8083
	echo "8083" > /etc/zbw/local_port
	echo "zbw_connect patched"
	./zbw_connect start
fi

echo "Start mongoose http server"
/etc/init.d/mongoose start

echo "Starting z-way-server"
./z-way-server

