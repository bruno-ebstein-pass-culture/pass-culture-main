#!/usr/bin/env bash

# GET APP NAME
if [[ $# -gt 1 ]] && [[ "$1" == "-a" ]]; then
  APP_NAME=$2
  shift 2
else
  echo "You must provide an application name."
  exit 1
fi

# GET FILE URL
if [[ $# -gt 1 ]] && [[ "$1" == "-f" ]]; then
  FILE_LINK=$2
  shift 2
else
  echo "You must provide a file URL."
  exit 1
fi

# GET FILE NAME (format Resume-full_29052019.zip)
if [[ $# -gt 1 ]] && [[ "$1" == "-n" ]]; then
  FILENAME=$2
  shift 2
else
  echo "You must provide a filename : format example Resume-full_29052019.zip."
  exit 1
fi

scalingo -a "$APP_NAME" run -d --size 2XL "wget -O $FILENAME $FILE_LINK
&& python scripts/pc.py import_titelive_full_descriptions -f $FILENAME"

