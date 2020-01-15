DOCKER_RUNNER ?= minimal-node12
DOCKER_BUILDER ?= minimal-node12

include makelib.inc

build:
	$(call run-in-docker,npm install --save-dev @babel/core @babel/cli; npm run build)
