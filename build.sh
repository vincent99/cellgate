#!/bin/bash

docker buildx build --push --tag vincent99/gate:latest --platform=linux/arm64,linux/amd64 .
