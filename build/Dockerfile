FROM ubuntu:20.04

RUN apt-get update -y && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y \
        nodejs \
        npm \
        git

# unprivileged user
RUN mkdir -p /code && \
    groupadd -g $HOST_GID $USER && \
    useradd -r -u $HOST_UID -g $HOST_GID $USER && \
    chown $HOST_UID:$HOST_GID /code && \
    mkdir -p /home/$USER && \
    chown $HOST_UID:$HOST_GID /home/$USER

USER $HOST_UID

# use https for git instead of ssh
RUN git config --global url."https://github.com/".insteadOf git@github.com: && \
    git config --global url."https://".insteadOf git:// && \
    git config --global url."https://".insteadOf ssh://

ENTRYPOINT "/bin/bash"
