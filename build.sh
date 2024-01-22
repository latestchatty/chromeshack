#!/bin/bash
set -euxo pipefail

IMAGE_NAME="chromeshack"

mkdir -p artifacts

docker build -t $IMAGE_NAME .
docker run --rm -i \
	-v "./artifacts:/code/artifacts" \
	--name $IMAGE_NAME $IMAGE_NAME
