#!/bin/bash -e

### BEGIN INIT INFO
# Provides:          openiod nodejs service
# Required-Start:    $local_fs $remote_fs $network $syslog
# Required-Stop:     $local_fs $remote_fs $network $syslog
# Default-Start:     2 3 4 5
# Default-Stop:      0 1 6
# Short-Description: starts nodejs application as a service
### END INIT INFO

fatal() { echo "FATAL [$(basename $0)]: $@" 1>&2; exit 1; }
warning() { echo "WARNING [$(basename $0)]: $@"; }

PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"

SYSTEMCODE="SCAPE604"
NAME="$SYSTEMCODE-openiod"
SERVICE="$NAME-init.d"
DESC="$NAME service"

CHUID="root:root"
LOGFILE="/opt/$SYSTEMCODE/log/$NAME.log"
PIDFILE="/var/run/$NAME.pid"

CONFIG="/etc/default/$NAME"
. $CONFIG
[ -n "$NODEJS_EXEC" ] || fatal "NODE_JSEXEC not set"

set -e

. /lib/lsb/init-functions

#We need this function to ensure the whole process tree will be killed
killtree() {
    local _pid=$1
    local _sig=${2-TERM}
    for _child in $(ps -o pid --no-headers --ppid ${_pid}); do
        killtree ${_child} ${_sig}
    done
    kill -${_sig} ${_pid}
}

case "$1" in
    start)
        log_begin_msg "Starting $DESC..."
        start-stop-daemon --start --chuid "$CHUID" --background --make-pidfile --pidfile $PIDFILE --exec "$NODEJS_EXEC" -- $LOGFILE
        log_action_end_msg $?
        ;;
    stop)
        log_begin_msg "Stopping $DESC..."
        if [ -e $PIDFILE ]; then
            while test -d /proc/$(cat $PIDFILE); do
                killtree $(cat $PIDFILE) 15
                sleep 0.5
            done
            rm -f $PIDFILE
        fi
        log_action_end_msg $?
        ;;
    restart)
        $0 stop
        $0 start
        ;;
    status)
        status_of_proc -p $PIDFILE "" "$NAME" && exit 0 || exit $?
        ;;
  *)
	  echo "Usage: $NAME {start|stop|restart|status}" >&2
	  exit 1
	  ;;
esac

exit 0
