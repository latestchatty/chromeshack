#!/bin/bash
set -euxo pipefail

IMAGE_NAME="chromeshack"

selinux_status () {
  ENFORCING=false
  if command -v getenforce; then
    local enforcing_status=$(getenforce)
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

mkdir -p artifacts

docker build -t $IMAGE_NAME .
docker run --rm -i \
  -v "./artifacts:/code/artifacts${RELABEL}" \
  --name $IMAGE_NAME $IMAGE_NAME
