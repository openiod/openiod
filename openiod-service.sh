#!/bin/sh

cd `dirname $0`
node openiod.js >>$1 2>>$1
exit -1
