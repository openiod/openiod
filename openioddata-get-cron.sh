
##exit 0

SYSTEMCODE="SCAPE604"
SYSTEMPATH="/Users/awiel/projects"

LOGFILE=$SYSTEMPATH/$SYSTEMCODE/log/openiod-data.log
echo "Start procedure on: " `date` >>$LOGFILE

#mkdir -p $SYSTEMPATH/$SYSTEMCODE/aireas/aireas/tmp
mkdir -p $SYSTEMPATH/$SYSTEMCODE/log

rm trafficspeed.*>>$LOGFILE
wget http://opendata.ndw.nu/trafficspeed.xml.gz >>$LOGFILE
gunzip trafficspeed.xml.gz

cd  $SYSTEMPATH/$SYSTEMCODE/openiod
/usr/local/bin/node ndw-data.js >>$LOGFILE

echo "End   procedure on: " `date` >>$LOGFILE
