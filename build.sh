#!/bin/bash

IMAGE_NAME="chromeshack"

selinux_status() {
  ENFORCING=false
  if command -v getenforce; then
    enforcing_status=$(getenforce)
    if [ "$enforcing_status" == "Enforcing" ]; then
      ENFORCING=true
    fi
  fi
}

selinux_status
RELABEL=""
if [[ "$ENFORCING" == true ]]; then
  RELABEL=":z"
fi

mkdir -p ./dist

docker build -t $IMAGE_NAME .
docker run --rm -i \
  -v "./dist:/code/dist${RELABEL}" \
  --name $IMAGE_NAME $IMAGE_NAME
