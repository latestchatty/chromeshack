#!/bin/bash

# import env vars from the .env in this project root
while IFS= read -r line; do
  if [[ "$line" =~ ^\s*#.*$ || -z "$line" ]]; then
    continue
  fi
  key=$(echo "$line" | cut -d '=' -f 1)
  value=$(echo "$line" | cut -d '=' -f 2-)
  # skip comments
  value=$(echo "$value" | sed -e "s/^'//" -e "s/'$//" -e 's/^"//' -e 's/"$//' -e 's/^[ \t]*//;s/[ \t]*$//')
  export "$key=$value"
done <".env"

IMAGE_NAME="chromeshack-e2e"

if [ -z "${E2E_SHACKLI+x}" ]; then
  echo
  echo "ERROR: a cookie fixture in the env variable \"E2E_SHACKLI\" is required for the E2E suite!"
  echo "Install a valid \".env\" in the project root and generate one with: pnpm testlogin"
  echo "For more information, see CONTRIBUTING.md..."
  echo
  exit 1
fi

build() {
  docker build -f ./Dockerfile.e2etest -t "$IMAGE_NAME" --build-arg SCOOKIE="$E2E_SHACKLI"
}

run() {
  mkdir -p "results/" && rm -rf "results/*"
  docker run --rm --replace -it \
    --ipc=host --security-opt seccomp=seccomp_profile.json \
    -v "./results:/code/results" \
    --name "$IMAGE_NAME" "$IMAGE_NAME" \
    "${@}"
}

help() {
  echo
  echo "Usage: $0 [--build | -b] [--run | -r] [--shell | -s] [--test | -t] [--help | -h]"
  echo
  echo "  --build, -b      rebuild the image"
  echo "  --run, -r        run the test suite"
  echo "  --shell, -s      open a shell inside the image"
  echo "  --test, -t       rebuild the image and rerun the tests"
  echo "  --help, -h       this message"
  echo
  exit 1
}

VALID_ARGS=$(getopt -o bhrst --long build,help,run,shell,test -- "$@")
eval set -- "$VALID_ARGS"

BUILD=false
RUN=false
RUNSHELL=false
RUNTEST=false

while true; do
  case "$1" in
    -b | --build)
      BUILD=true
      shift
      ;;
    -h | --help)
      help
      ;;
    -r | --run)
      RUN=true
      shift
      ;;
    -s | --shell)
      RUNSHELL=true
      shift
      ;;
    -t | --test)
      RUNTEST=true
      shift
      ;;
    --)
      shift
      break
      ;;
    *)
      echo "Error: Invalid argument!"
      help
      ;;
  esac
done

if [ "$BUILD" == true ]; then
  build
fi
if [ "$RUN" == true ]; then
  run pnpm test
fi
if [ "$RUNSHELL" == true ]; then
  run /bin/bash
fi
if [ "$RUNTEST" == true ]; then
  build
  run pnpm test
fi

exit 0
