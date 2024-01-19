#!/bin/bash
set -euxo pipefail

export IMAGE_NAME="chromeshack"
export HOST_UID=$(id -u "$USER")
export HOST_GID=$(id -g "$USER")

cat Dockerfile | envsubst | docker build -t $IMAGE_NAME -

pushd ..
docker run --rm --tty --interactive --volume "$PWD:/code" --workdir /code --name $IMAGE_NAME $IMAGE_NAME
popd
