# Registry where to push artifact image
DOCKER_TARGET_REGISTRY ?= harbor.transmit.im/oak/

# Registry for pulling builder and dependent images
DOCKER_SOURCE_REGISTRY ?= harbor.transmit.im/dockers/


# Get platform to build for
ifeq "$(DOCKER_RUNNER)" ""
DOCKER_RUNNER_WITHPREFIX :=
else
DOCKER_RUNNER_WITHPREFIX := -$(DOCKER_RUNNER)
endif

ifeq "$(DOCKER_BUILDER)" ""
DOCKER_BUILDER_WITHPREFIX :=
else
DOCKER_BUILDER_WITHPREFIX := -$(DOCKER_BUILDER)
endif
TARGET_PLATFORM ?= centos
ifeq "$(findstring rhel,$(TARGET_PLATFORM))" "rhel"
ifneq "$(DOCKER_RUNNER_WITHPREFIX)" ""
DOCKER_RUNNER_IMAGE_NAME ?= ubi$(DOCKER_RUNNER_WITHPREFIX)
endif
DOCKER_BUILD_IMAGE_NAME ?= ubi$(DOCKER_BUILDER_WITHPREFIX)
DOCKER_ROOT_IMAGE_NAME ?= ubi
else
ifeq "$(findstring debian,$(TARGET_PLATFORM))" "debian"
MINIMAL_IMAGE_POSTFIX := -slim
else
MINIMAL_IMAGE_POSTFIX :=
endif
ifneq "$(DOCKER_RUNNER_WITHPREFIX)" ""
DOCKER_RUNNER_IMAGE_NAME ?= $(TARGET_PLATFORM)$(subst -minimal,$(MINIMAL_IMAGE_POSTFIX),$(DOCKER_RUNNER_WITHPREFIX))
endif
DOCKER_BUILD_IMAGE_NAME ?= $(TARGET_PLATFORM)$(subst -minimal,$(MINIMAL_IMAGE_POSTFIX),$(DOCKER_BUILDER_WITHPREFIX))
DOCKER_ROOT_IMAGE_NAME ?= $(TARGET_PLATFORM)
endif

# Image used in build-in-docker function



# Full build-in-docker runner image path including registry
DOCKER_RUNNER_IMAGE ?= $(DOCKER_SOURCE_REGISTRY)$(DOCKER_RUNNER_IMAGE_NAME)

# Artifact name and version generator. Default values are used only for local builds and are re-set on CI.
# Guess first part of artifact name based on git project name
GIT_PROJECT ?= $(shell GIT_PROJECT=$$(git remote get-url origin); GIT_PROJECT=$${GIT_PROJECT//:/\/}; GIT_PROJECT=$${GIT_PROJECT/%\//}; GIT_PROJECT=$${GIT_PROJECT%/*};GIT_PROJECT=$${GIT_PROJECT\#\#*/};echo $$GIT_PROJECT)

# Guess second part of artifact name using git repo name
GIT_REPO_NAME ?= $(shell XX=$$(git remote get-url origin);XX=$${XX//:/\/}; XX=$${XX/%\//}; XX=$${XX\#\#*/};echo $${XX%%.git*})
# Default build number when running outside CI
BUILD_NUMBER ?= 1

# Get last commit ID for version generation
GIT_LAST_COMMIT_ID ?= $(shell git rev-parse --short HEAD)

# Get current branch for version generation
GIT_CURRENT_BRANCH ?= $(shell git rev-parse --abbrev-ref HEAD)

# Generate docker tag
DOCKER_TARGET_IMAGE_TAG  ?= $(BUILD_NUMBER)-$(subst /,-,$(GIT_CURRENT_BRANCH))-$(GIT_LAST_COMMIT_ID)

# Geenerate artifact/docker image name
DOCKER_TARGET_IMAGE_NAME ?= $(GIT_PROJECT)-$(GIT_REPO_NAME)

# Compile full docker image name including registry and tag
DOCKER_TARGET_IMAGE      ?= $(DOCKER_TARGET_REGISTRY)$(DOCKER_TARGET_IMAGE_NAME):$(DOCKER_TARGET_IMAGE_TAG)


# Docker network used for tests and connecting containers
DOCKER_NETWORK ?= $(DOCKER_TARGET_IMAGE_NAME)-$(DOCKER_TARGET_IMAGE_TAG)-network

# Workspace directory for docker-build target. Usually you only want to redefine DOCKER_BUILD_WORKSPACE_SUBDIR
DOCKER_BUILD_WORKSPACE_SUBDIR ?= .
DOCKER_BUILD_WORKSPACE_DIR ?= $(realpath $(DOCKER_BUILD_WORKSPACE_SUBDIR))
#DOCKER_BUILD_WORKSPACE_DIR ?= $(realpath "$(shell git rev-parse --show-toplevel)/$(DOCKER_BUILD_WORKSPACE_SUBDIR)")

# Default path to dockerfile used to build resulting docker image in docker-build
# Sber compat:
DOCKER_FILE ?= ${DOCKER_BUILD_DOCKERFILE}
ifneq (${DOCKER_FILE},)
	DOCKER_FILE_BUILD ?= ${DOCKER_FILE}
else ifneq ($(wildcard ${DOCKER_BUILD_WORKSPACE_SUBDIR}/Dockerfile.${TARGET_PLATFORM}*),)
	DOCKER_FILE_BUILD ?= $(firstword $(wildcard ${DOCKER_BUILD_WORKSPACE_SUBDIR}/Dockerfile.${TARGET_PLATFORM}*))
else ifneq ($(wildcard ./Dockerfile.${TARGET_PLATFORM}*),)
	DOCKER_FILE_BUILD ?= $(firstword $(wildcard ./Dockerfile.${TARGET_PLATFORM}*))
else ifneq ($(wildcard src/Dockerfile.${TARGET_PLATFORM}*),)
	DOCKER_FILE_BUILD ?= $(firstword $(wildcard src/Dockerfile.${TARGET_PLATFORM}*))
else ifneq ($(wildcard src/docker/Dockerfile.${TARGET_PLATFORM}*),)
	DOCKER_FILE_BUILD ?= $(firstword $(wildcard src/Dockerfile.${TARGET_PLATFORM}*))
else
	DOCKER_FILE_BUILD ?= src/Dockerfile.${TARGET_PLATFORM}
endif

# Default NEXUS source repository for dependency downloads
NEXUS_SOURCE_REPOSITORY_NAME ?= Sonatype Nexus Repository Manager
NEXUS_SOURCE_REPOSITORY_URL ?= https://nexus.transmit.im/repository/dialog
NEXUS_SOURCE_REPOSITORY_USERNAME ?= dialog
NEXUS_SOURCE_REPOSITORY_PASSWORD ?= dialog

# Default NEXUS target repository name for pushing artifacts
NEXUS_TARGET_REPOSITORY_NAME ?= Sonatype Nexus Repository Manager
NEXUS_TARGET_REPOSITORY_URL ?= https://nexus.transmit.im/repository/dialog
NEXUS_TARGET_REPOSITORY_USERNAME ?= dialog
NEXUS_TARGET_REPOSITORY_PASSWORD ?= dialog

# Default NPM Source registry
NPM_SOURCE_REGISTRY ?= registry.npmjs.org
NPM_SOURCE_REGISTRY_TOKEN ?= $(NPM_TOKEN)
NPM_REGISTRY ?= $(NPM_SOURCE_REGISTRY)

# Default NPM target registry
NPM_TARGET_REGISTRY ?= registry.npmjs.org
NPM_TARGET_REGISTRY_TOKEN ?= $(NPM_TOKEN)

# Default caches dir is user's home
GLOBAL_CACHES_DIR ?= ${HOME}

# Caches dirs
NPM_CACHE ?= $(GLOBAL_CACHES_DIR)/.npm
IVY2_CACHE ?= $(GLOBAL_CACHES_DIR)/.ivy2
SBT_CACHE ?= $(GLOBAL_CACHES_DIR)/.sbt
M2_CACHE ?= $(GLOBAL_CACHES_DIR)/.m2
COURSIER_CACHE ?= $(GLOBAL_CACHES_DIR)/.coursier/cache/v1
#COURSIER_CACHE ?= /Users/<user>/Library/Caches/Coursier/v1/https/ # for mac

# Default run-in-docker home. /tmp is used because it is writable by all users
DOCKER_RUNNER_HOME ?= /tmp

# Set runner user and group ids same as local user. Required to write in mounted volumes.
DOCKER_RUNNER_USER ?= $(shell id -u)
DOCKER_RUNNER_GROUP ?= $(shell id -g)

DB_HOST ?= $(DOCKER_TARGET_IMAGE_NAME)-$(DOCKER_TARGET_IMAGE_TAG)-postgres
DB_PORT ?= 5432
DB_NAME ?= dialog
DB_USER ?= dialog
DB_PASSWORD ?= dialog

SBT_OPTS += -J-Dsbt.global.base=$(DOCKER_RUNNER_HOME)/.sbt/ \
			-J-Dsbt.ivy.home=$(DOCKER_RUNNER_HOME)/.ivy2/ \
			-J-Divy.home=$(DOCKER_RUNNER_HOME)/.ivy2/ \
			-J-Duser.name=jenkins \
			-J-Duser.home=$(DOCKER_RUNNER_HOME)

JAVA_OPTS += -J-Duser.name=jenkins \
			-J-Duser.home=$(DOCKER_RUNNER_HOME)

TTY_FLAG := $(shell [ -t 0 ] && echo t)
test:
	@echo [$@] Tests are not implemented!
	@exit 1

.PHONY: build
build: $(DOCKER_RUNNER_IMAGE_NAME)

.PHONY: help
help:
	$(info $ Makelib default stages:)
	$(info $ 	make makelib-update 		- Update makelib)
	$(info $ 	make docker-build	- Build target docker image)
	$(info $ 	make docker-clean	- Remove target docker image)
	$(info $ 	make build	- Compile code)
	$(info $ 	)
	$(info $ NOTE: Use $$(call run-in-docker,<some shell commands>,<hostname>,<additional docker arguments>) function in your build and test targets to execute scripts)
	$(info $ NOTE: Use $$(call start-in-docker,<some shell commands>,<hostname>,<additional docker arguments>) function in your build and test targets to execute scripts)
	$(info $ Dependencies: GNU Make >3.8, Docker, git, curl, time, cat, cut, shell)

define run-in-docker
	-docker network create $(DOCKER_NETWORK) || true
	-docker pull "$(if $4,$4,$(DOCKER_RUNNER_IMAGE))"
	-@echo 69 > ./.exitcode
	-time docker run -i$(TTY_FLAG) --rm -u $(DOCKER_RUNNER_USER):$(DOCKER_RUNNER_GROUP) $(if $1,--entrypoint="/bin/bash",) \
	-v "${IVY2_CACHE}/":"$(DOCKER_RUNNER_HOME)/.ivy2":cached \
	-v "${shell pwd}/":"$(DOCKER_RUNNER_HOME)/${GIT_REPO_NAME}":cached \
	-v "${SBT_CACHE}/":"$(DOCKER_RUNNER_HOME)/.sbt":cached \
	-v "${COURSIER_CACHE}":"$(DOCKER_RUNNER_HOME)/.cache/coursier/v1":cached \
	-v "${NPM_CACHE}/":"/tmp/.npm":cached  \
	-v "${M2_CACHE}/":"/tmp/.m2":cached  \
	-e HOME="$(DOCKER_RUNNER_HOME)" \
	-e publishToNexus="1" \
	-e nexusRepositoryName="$(NEXUS_TARGET_REPOSITORY_NAME)" \
	-e nexusRepositoryUrl="$(NEXUS_TARGET_REPOSITORY_URL)" \
	-e DB_NAME="$(DB_NAME)" \
	-e DB_PASSWORD="$(DB_PASSWORD)" \
	-e DB_HOST="$(DB_HOST)" \
	-e DB_PORT="$(DB_PORT)" \
	-e DB_USER="$(DB_USER)" \
	-e BINTRAY_USER="$(BINTRAY_USER)" \
	-e BINTRAY_PASS="$(BINTRAY_PASS)" \
	-e NPM_TOKEN="$(NPM_SOURCE_REGISTRY_TOKEN)" \
	-e NPM_REGISTRY="$(NPM_SOURCE_REGISTRY)" \
	-e NEXUS_USERNAME="$(NEXUS_SOURCE_REPOSITORY_USERNAME)" \
	-e NEXUS_PASSWORD="$(NEXUS_SOURCE_REPOSITORY_PASSWORD)" \
	-e NEXUS_REPOSITORY_NAME="$(NEXUS_SOURCE_REPOSITORY_NAME)" \
	-e NEXUS_REPOSITORY_URL="$(NEXUS_SOURCE_REPOSITORY_URL)" \
	-e NEXUS_SOURCE_REPOSITORY_USERNAME="$(NEXUS_SOURCE_REPOSITORY_USERNAME)" \
	-e NEXUS_SOURCE_REPOSITORY_PASSWORD="$(NEXUS_SOURCE_REPOSITORY_PASSWORD)" \
	-e NEXUS_SOURCE_REPOSITORY_NAME="$(NEXUS_SOURCE_REPOSITORY_NAME)" \
	-e NEXUS_SOURCE_REPOSITORY_URL="$(NEXUS_SOURCE_REPOSITORY_URL)" \
	-e NEXUS_TARGET_REPOSITORY_URL="$(NEXUS_TARGET_REPOSITORY_URL)" \
	-e NEXUS_TARGET_REPOSITORY_USERNAME="$(NEXUS_TARGET_REPOSITORY_USERNAME)" \
	-e NEXUS_TARGET_REPOSITORY_PASSWORD="$(NEXUS_TARGET_REPOSITORY_PASSWORD)" \
	-e NEXUS_TARGET_REPOSITORY_NAME="$(NEXUS_TARGET_REPOSITORY_NAME)" \
	-e NEXUS_TARGET_REPOSITORY_URL="$(NEXUS_TARGET_REPOSITORY_URL)" \
	-e NPM_SOURCE_REGISTRY_TOKEN="$(NPM_SOURCE_REGISTRY_TOKEN)"  \
	-e NPM_SOURCE_REGISTRY="$(NPM_SOURCE_REGISTRY)"  \
	-e NPM_TARGET_REGISTRY_TOKEN="$(NPM_TARGET_REGISTRY_TOKEN)"  \
	-e NPM_TARGET_REGISTRY="$(NPM_TARGET_REGISTRY)"  \
	--network-alias "$2" --name "$2" -h "$2" --network="$(DOCKER_NETWORK)" \
	$3 \
	"$(if $4,$4,$(DOCKER_RUNNER_IMAGE))" $(if $1,-c "cd $(DOCKER_RUNNER_HOME)/${GIT_REPO_NAME} && $1",); \
	echo $$? > ./.exitcode
	@exitcode=$$(cat ./.exitcode); rm -f ./.exitcode; \
	if [ $$exitcode -eq 0 ]; then \
		echo [$@] Run completed successfully; \
		(docker network rm $(DOCKER_NETWORK) > /dev/null 2>&1 || true); \
	else \
		echo [$@] Run failed with code $$exitcode, cleaning up...; \
		(docker stop -t 0 $$(docker ps -a|grep $(DOCKER_TARGET_IMAGE_NAME)-$(DOCKER_TARGET_IMAGE_TAG)|cut -d' ' -f1) || true); \
		(docker network rm $(DOCKER_NETWORK) || true); \
		exit $$exitcode; \
	fi
endef

define run-tf-in-docker
	-docker pull "$(if $4,$4,$(DOCKER_RUNNER_IMAGE))"
	-time docker run -i$(TTY_FLAG) --rm -u $(DOCKER_RUNNER_USER):$(DOCKER_RUNNER_GROUP) $(if $1,--entrypoint="/bin/bash",) \
	-v "${shell pwd}/":"$(DOCKER_RUNNER_HOME)/${GIT_REPO_NAME}":cached \
	-e HOME="$(DOCKER_RUNNER_HOME)" \
	--network="host" \
	$3 \
	"$(if $4,$4,$(DOCKER_RUNNER_IMAGE))" $(if $1,-c "cd $(DOCKER_RUNNER_HOME)/${GIT_REPO_NAME} && $1",)
endef



define start-postgres-in-docker
	-docker network create $(DOCKER_NETWORK) || true
	-@docker -q stop -t 0 $(DB_HOST) > /dev/null 2>&1 || true
	docker run --rm -d -p $(DB_PORT) -e POSTGRESQL_DATABASE=$(DB_NAME) -e POSTGRESQL_USER=$(DB_USER) -e POSTGRESQL_PASSWORD=$(DB_PASSWORD) \
	--network-alias "$(DB_HOST)" --name "$(DB_HOST)" \
	-h "$(DB_HOST)" --network="$(DOCKER_NETWORK)" "$(DOCKER_SOURCE_REGISTRY)postgresql" || \
	((docker stop -t 0 $$(docker ps -a|grep $(DOCKER_TARGET_IMAGE_NAME)-$(DOCKER_TARGET_IMAGE_TAG)|cut -d' ' -f1) || true); \
	(docker network rm $(DOCKER_NETWORK) || true); exit 1)
endef

define start-in-docker
	-docker network create $(DOCKER_NETWORK) > /dev/null 2>&1  || true
	-@docker stop -t 0 "$(DOCKER_TARGET_IMAGE_NAME)-$(DOCKER_TARGET_IMAGE_TAG)-$2" > /dev/null 2>&1
	docker run --rm -d --network-alias "$(DOCKER_TARGET_IMAGE_NAME)-$(DOCKER_TARGET_IMAGE_TAG)-$2" --name "$(DOCKER_TARGET_IMAGE_NAME)-$(DOCKER_TARGET_IMAGE_TAG)-$2" \
	-h "$(DOCKER_TARGET_IMAGE_NAME)-$(DOCKER_TARGET_IMAGE_TAG)-$2" --network="$(DOCKER_NETWORK)" $(if $1,--entrypoint="/bin/bash",) \
	$3 \
	"$(if $4,$4,$(DOCKER_RUNNER_IMAGE))" $(if $1,-c "$1",) || \
	((docker stop -t 0 $$(docker ps -a|grep $(DOCKER_TARGET_IMAGE_NAME)-$(DOCKER_TARGET_IMAGE_TAG)|cut -d' ' -f1) || true); \
	(docker network rm $(DOCKER_NETWORK) || true); exit 1)
endef

define stop-postgres-in-docker
	-docker stop -t 0 $(DB_HOST)
	-docker network rm $(DOCKER_NETWORK) > /dev/null 2>&1  || true
endef

define stop-in-docker
	-docker stop -t 0 "$(DOCKER_TARGET_IMAGE_NAME)-$(DOCKER_TARGET_IMAGE_TAG)-$1"
	-docker network rm $(DOCKER_NETWORK) > /dev/null 2>&1  || true
endef

.PHONY: docker-rebuild
docker-rebuild: docker-clean
	@make docker-build

.PHONY: docker-build
docker-build: $(DOCKER_RUNNER_IMAGE_NAME) $(DOCKER_BUILD_IMAGE_NAME)
ifeq "$(shell docker images -q $(DOCKER_TARGET_IMAGE))" ""
	@echo [$@] Building docker image
	time docker build -f $(DOCKER_FILE_BUILD) \
	-t "$(DOCKER_TARGET_IMAGE)" \
	--build-arg DOCKER_SOURCE_REGISTRY="$(DOCKER_SOURCE_REGISTRY)" \
	--build-arg DOCKER_BUILD_IMAGE_NAME="$(DOCKER_BUILD_IMAGE_NAME)" \
	--build-arg DOCKER_BUILD_IMAGE="$(DOCKER_SOURCE_REGISTRY)$(DOCKER_BUILD_IMAGE_NAME)" \
	--build-arg DOCKER_RUNNER_IMAGE="$(DOCKER_RUNNER_IMAGE)" \
	--build-arg DOCKER_RUNNER_IMAGE_NAME="$(DOCKER_RUNNER_IMAGE_NAME)" \
	--build-arg NPM_TOKEN="$(NPM_TOKEN)" \
	--build-arg NPM_REGISTRY="$(NPM_REGISTRY)" \
	--build-arg BB_TOKEN="$(BB_TOKEN)" \
	--build-arg COMMIT="$(GIT_LAST_COMMIT_ID)" \
	--build-arg RELEASE="$(DOCKER_TARGET_IMAGE_TAG)" \
	"$(DOCKER_BUILD_WORKSPACE_DIR)"
	@echo [$@] Docker image $(DOCKER_TARGET_IMAGE) built successfully
else
	@echo [$@] Docker image $(DOCKER_TARGET_IMAGE) is already built. Run "make docker-clean" to wipe it
endif

.PHONY: docker-clean
docker-clean:
	@echo [$@] Removing target docker image and network
	-docker stop -t 0 $$(docker ps -a|grep $(DOCKER_TARGET_IMAGE_NAME)-$(DOCKER_TARGET_IMAGE_TAG)|cut -d' ' -f1) || true
	-docker rm -f $(docker ps -a -q --filter=ancestor=${DOCKER_TARGET_IMAGE})
	-docker rmi -f ${DOCKER_TARGET_IMAGE}
	-docker rmi -f $(docker images -q ${DOCKER_TARGET_IMAGE})
	-docker rmi $(docker images -f "dangling=true" -q)
	-docker network rm $(DOCKER_NETWORK)

.PHONY: docker-push
docker-push:
	docker push $(DOCKER_TARGET_IMAGE)


.PHONY: run
run:
	docker run -it --rm $(DOCKER_TARGET_IMAGE)

.PHONY: run-bash
run-bash:
	docker run --entrypoint bash -it --rm $(DOCKER_TARGET_IMAGE)

.PHONY: run-bash-%
run-bash-%:
	docker run --entrypoint bash -it --rm $(DOCKER_SOURCE_REGISTRY)$(subst run-bash-,,$@)

.PHONY: submodule-set-branch
submodule-set-branch:
	git submodule set-branch --branch $(BRANCH) submodules/$(NAME)
	@echo "$(NAME)\n$(REPO)\n$(BRANCH)" > branch.txt

.PHONY: submodule-add
submodule-add:
	git submodule add $(REPO) submodules/$(NAME)

.PHONY: submodule-update
submodule-update:
	git submodule update --init --recursive submodules/$(NAME)

#.PHONY: makelib-update
#makelib-update:
#	@curl https://<MAKELIB REPO HERE> -Lo makelib.inc



.PHONY: $(DOCKER_ROOT_IMAGE_NAME)%
$(DOCKER_ROOT_IMAGE_NAME)%:
	@[ '$($@)' != '' ] || (echo [$@] No dockerfile defined for $@ in makelib.inc!; false)
ifeq "$(shell docker images -q $(DOCKER_SOURCE_REGISTRY)$(lastword $(subst ., ,$@)))" ""
	docker pull $(DOCKER_SOURCE_REGISTRY)$(lastword $(subst ., ,$@)) || \
	(printf '$($@)' | docker build -t $(DOCKER_SOURCE_REGISTRY)$(lastword $(subst ., ,$@)) - && \
	docker push $(DOCKER_SOURCE_REGISTRY)$(lastword $(subst ., ,$@)) || true)
endif

$(DOCKER_ROOT_IMAGE_NAME):
	@[ '$($@)' != '' ] || (echo [$@] No dockerfile defined for $@ in makelib.inc!; false)
ifeq "$(shell docker images -q $(DOCKER_SOURCE_REGISTRY)$(lastword $(subst ., ,$@)))" ""
	docker pull $(DOCKER_SOURCE_REGISTRY)$(lastword $(subst ., ,$@)) || \
	(printf '$($@)' | docker build -t $(DOCKER_SOURCE_REGISTRY)$(lastword $(subst ., ,$@)) - && \
	docker push $(DOCKER_SOURCE_REGISTRY)$(lastword $(subst ., ,$@)) || true)
endif

.PHONY: .rebuild.all
rebuild.all: rebuild.ubi-jdk8 rebuild.ubi-jdk8-sbt rebuild.ubi-minimal-jdk8 rebuild.ubi-minimal-jdk8-sbt rebuild.ubi-node10 \
			 rebuild.ubi-node12 rebuild.ubi-minimal-node12 rebuild.ubi-minimal-node10 rebuild.ubi-golang rebuild.ubi-minimal-golang \
			 rebuild.ubi-golang113 rebuild.ubi-minimal-golang113

.PHONY: .rebuild.$(DOCKER_ROOT_IMAGE_NAME)%
rebuild.$(DOCKER_ROOT_IMAGE_NAME)%:
	@[ '$($(lastword $(subst ., ,$@)))' != '' ] || (echo [$@] No dockerfile defined for $@ in makelib.inc!; false)
	printf '$($(lastword $(subst ., ,$@)))' | docker build -t $(DOCKER_SOURCE_REGISTRY)$(lastword $(subst ., ,$@)) - && \
	docker push $(DOCKER_SOURCE_REGISTRY)$(lastword $(subst ., ,$@)) || true

rebuild.$(DOCKER_ROOT_IMAGE_NAME):
	@[ '$($(lastword $(subst ., ,$@)))' != '' ] || (echo [$@] No dockerfile defined for $@ in makelib.inc!; false)
	printf '$($(lastword $(subst ., ,$@)))' | docker build -t $(DOCKER_SOURCE_REGISTRY)$(lastword $(subst ., ,$@)) - && \
	docker push $(DOCKER_SOURCE_REGISTRY)$(lastword $(subst ., ,$@)) || true

define debian
FROM debian:stretch\n
endef

define debian-slim
FROM debian:stretch-slim\n
endef

define ubuntu
FROM ubuntu\n
endef

define alpine
FROM alpine\n
endef

define centos
FROM centos\n
endef

define ubi-minimal
FROM registry.access.redhat.com/ubi7/ubi-minimal\n
endef

define ubi
FROM registry.access.redhat.com/ubi7/ubi\n
endef

define ubi-adoptjdk-repo
RUN echo -e "[AdoptOpenJDK]\\nname=AdoptOpenJDK\\nbaseurl=http://adoptopenjdk.jfrog.io/adoptopenjdk/rpm/rhel/7/x86_64\\nenabled=1\\ngpgcheck=0\\ngpgkey=https://adoptopenjdk.jfrog.io/adoptopenjdk/api/gpg/key/public\\n" > /etc/yum.repos.d/adoptopenjdk.repo\n
endef

define centos-adoptjdk-repo
RUN echo -e "[AdoptOpenJDK]\\nname=AdoptOpenJDK\\nbaseurl=http://adoptopenjdk.jfrog.io/adoptopenjdk/rpm/centos/7/x86_64\\nenabled=1\\ngpgcheck=1\\ngpgkey=https://adoptopenjdk.jfrog.io/adoptopenjdk/api/gpg/key/public\\n" > /etc/yum.repos.d/adoptopenjdk.repo\n
endef

define centos-fluentbit-repo
RUN echo -e "[td-agent-bit]\\nname=TD Agent Bit\\nbaseurl=http://packages.fluentbit.io/centos/7\\ngpgcheck=0\\ngpgkey=https://packages.fluentbit.io/fluentbit.key\\nenabled=1\\n" > /etc/yum.repos.d/fluentbit.repo\n
endef

define centos-adoptjdk8
FROM ${DOCKER_SOURCE_REGISTRY}ubi\n\
$(ubi-adoptjdk-repo)\n\
RUN yum install -y adoptopenjdk-8-hotspot && yum clean all && rm -rf /var/cache/yum\n
endef

define centos-adoptjdk8-sbt
FROM ${DOCKER_SOURCE_REGISTRY}centos\n\
$(centos-adoptjdk-repo)\n\
RUN curl https://bintray.com/sbt/rpm/rpm | tee /etc/yum.repos.d/bintray-sbt-rpm.repo\n\
RUN yum install -y git tar adoptopenjdk-8-hotspot sbt && yum clean all && rm -rf /var/cache/yum\n
endef

define centos-adoptjdk8-libsodium18
FROM ${DOCKER_SOURCE_REGISTRY}centos as builder\n\
RUN yum install -y unzip make gcc gcc-c++\n\
WORKDIR /tmp/libsodium\n\
RUN curl https://github.com/jedisct1/libsodium/archive/1.0.18-RELEASE.zip -OL\n\
RUN unzip 1.0.18-RELEASE.zip; cd libsodium-1.0.18-RELEASE; ./configure --prefix=/usr --libdir=/usr/lib64 &&\ \n\
	make && make install\n\
FROM ${DOCKER_SOURCE_REGISTRY}centos\n\
COPY --from=builder /usr/lib64/libsodium*.* /usr/lib64/\n\
COPY --from=builder /usr/lib64/pkgconfig/* /usr/lib64/pkgconfig/\n\
$(ubi-adoptjdk-repo)\n\
RUN yum install -y adoptopenjdk-8-hotspot && yum clean all && rm -rf /var/cache/yum\n
endef


define ubi-adoptjdk8
FROM ${DOCKER_SOURCE_REGISTRY}ubi\n\
$(ubi-adoptjdk-repo)\n\
RUN yum install -y adoptopenjdk-8-hotspot && yum clean all && rm -rf /var/cache/yum\n
endef

define ubi-adoptjdk8-sbt
FROM ${DOCKER_SOURCE_REGISTRY}ubi\n\
$(ubi-adoptjdk-repo)\n\
RUN curl https://bintray.com/sbt/rpm/rpm | tee /etc/yum.repos.d/bintray-sbt-rpm.repo\n\
RUN yum install -y git tar gunzip adoptopenjdk-8-hotspot sbt && yum clean all && rm -rf /var/cache/yum\n
endef

define ubi-adoptjdk8j9-sbt
FROM ${DOCKER_SOURCE_REGISTRY}ubi\n\
$(ubi-adoptjdk-repo)\n\
RUN curl https://bintray.com/sbt/rpm/rpm | tee /etc/yum.repos.d/bintray-sbt-rpm.repo\n\
RUN yum install -y git tar gunzip adoptopenjdk-8-openj9 sbt && yum clean all && rm -rf /var/cache/yum\n
endef

define ubi-minimal-adoptjdk8
FROM ${DOCKER_SOURCE_REGISTRY}ubi-minimal\n\
$(ubi-adoptjdk-repo)\n\
RUN microdnf install adoptopenjdk-8-hotspot && microdnf clean all && rm -rf /var/cache/yum\n
endef

define ubi-jdk8
FROM ${DOCKER_SOURCE_REGISTRY}ubi\n\
RUN yum install -y java-1.8.0-openjdk-headless && yum clean all && rm -rf /var/cache/yum\n
endef

define ubi-jdk8-sbt
FROM ${DOCKER_SOURCE_REGISTRY}ubi\n\
RUN curl https://bintray.com/sbt/rpm/rpm | tee /etc/yum.repos.d/bintray-sbt-rpm.repo\n\
RUN yum install -y java-1.8.0-openjdk-devel sbt && yum clean all && rm -rf /var/cache/yum\n
endef

define ubi-minimal-jdk8
FROM ${DOCKER_SOURCE_REGISTRY}ubi-minimal\n\
RUN microdnf install java-1.8.0-openjdk-headless && microdnf clean all && rm -rf /var/cache/yum\n
endef

define ubi-minimal-jdk8-sbt
FROM ${DOCKER_SOURCE_REGISTRY}ubi-minimal\n\
RUN curl https://bintray.com/sbt/rpm/rpm | tee /etc/yum.repos.d/bintray-sbt-rpm.repo\n\
RUN microdnf install java-1.8.0-openjdk-devel sbt && microdnf clean all && rm -rf /var/cache/yum\n
endef

define ubi-node10
FROM ${DOCKER_SOURCE_REGISTRY}ubi\n\
RUN yum install -y rh-nodejs10 && yum clean all && rm -rf /var/cache/yum\n\
ENV MANPATH=/opt/rh/rh-nodejs10/root/usr/share/man:$$MANPATH\n\
LD_LIBRARY_PATH=/opt/rh/rh-nodejs10/root/usr/lib64:$$LD_LIBRARY_PATH\n\
ENV PATH=/opt/rh/rh-nodejs10/root/usr/bin:$$PATH\n\
ENV PYTHONPATH=/opt/rh/rh-nodejs10/root/usr/lib/python2.7/site-packages:$$PYTHONPATH\n
endef

define ubi-node12
FROM ${DOCKER_SOURCE_REGISTRY}ubi\n\
RUN yum install -y rh-nodejs12 && yum clean all && rm -rf /var/cache/yum\n\
ENV MANPATH=/opt/rh/rh-nodejs12/root/usr/share/man:$$MANPATH\n\
LD_LIBRARY_PATH=/opt/rh/rh-nodejs12/root/usr/lib64:$$LD_LIBRARY_PATH\n\
ENV PATH=/opt/rh/rh-nodejs12/root/usr/bin:$$PATH\n\
ENV PYTHONPATH=/opt/rh/rh-nodejs12/root/usr/lib/python2.7/site-packages:$$PYTHONPATH\n
endef

define centos-node10
FROM ${DOCKER_SOURCE_REGISTRY}centos\n\
RUN yum install nodejs && yum clean all && rm -rf /var/cache/yum\n
endef

define centos-node12
FROM ${DOCKER_SOURCE_REGISTRY}centos\n\
RUN curl -sL https://rpm.nodesource.com/setup_12.x | bash -\n\
RUN yum install -y python2 && yum --disablerepo=AppStream install -y nodejs && yum clean all && rm -rf /var/cache/yum\n
endef

define ubi-minimal-node10
FROM ${DOCKER_SOURCE_REGISTRY}ubi-minimal\n\
RUN microdnf install rh-nodejs10 && microdnf clean all && rm -rf /var/cache/yum\n\
ENV MANPATH=/opt/rh/rh-nodejs10/root/usr/share/man:$$MANPATH\n\
ENV LD_LIBRARY_PATH=/opt/rh/rh-nodejs10/root/usr/lib64:$$LD_LIBRARY_PATH\n\
ENV PATH=/opt/rh/rh-nodejs10/root/usr/bin:$$PATH\n\
ENV PYTHONPATH=/opt/rh/rh-nodejs10/root/usr/lib/python2.7/site-packages:$$PYTHONPATH\n
endef

define ubi-minimal-node12
FROM ${DOCKER_SOURCE_REGISTRY}ubi-minimal\n\
RUN microdnf install rh-nodejs12 && microdnf clean all && rm -rf /var/cache/yum\n\
ENV MANPATH=/opt/rh/rh-nodejs12/root/usr/share/man:$$MANPATH\n\
ENV LD_LIBRARY_PATH=/opt/rh/rh-nodejs12/root/usr/lib64:$$LD_LIBRARY_PATH\n\
ENV PATH=/opt/rh/rh-nodejs12/root/usr/bin:$$PATH\n\
ENV PYTHONPATH=/opt/rh/rh-nodejs12/root/usr/lib/python2.7/site-packages:$$PYTHONPATH\n
endef

define ubi-golang
FROM ${DOCKER_SOURCE_REGISTRY}ubi\n\
RUN curl https://dl.google.com/go/$(shell curl -q https://golang.org/VERSION?m=text).linux-amd64.tar.gz -L |tar zxf - -C /opt/\n\
ENV PATH=/opt/go/bin:$$PATH\n\
ENV GOROOT=/opt/go\n
endef

define ubi-minimal-fluentd
FROM ${DOCKER_SOURCE_REGISTRY}ubi-minimal\n\
RUN curl -L https://toolbelt.treasuredata.com/sh/install-redhat-td-agent3.sh|sed "s/yum /microdnf /g"|sed "s/sudo //g"|sed "s/-k//g"|sed "s/gpgcheck=1/gpgcheck=0/g"|sh\n\
RUN microdnf clean all && rm -rf /var/cache/yum\n
endef

define ubi-golang113
FROM ${DOCKER_SOURCE_REGISTRY}ubi\n\
RUN yum install -y ca-certificates git make gcc\n\
RUN curl https://dl.google.com/go/go1.13.5.linux-amd64.tar.gz -L |tar zxf - -C /opt/\n\
ENV PATH=/opt/go/bin:$$PATH\n\
ENV GOROOT=/opt/go\n
endef

define ubi-minimal-librdkafka130
FROM ${DOCKER_SOURCE_REGISTRY}ubi-minimal as kafka-builder\n\
RUN microdnf install ca-certificates git make gcc gcc-c++ zlib-devel openssl-devel cyrus-sasl-devel\n\
WORKDIR /librdkafka\n\
RUN git clone -b v1.3.0 https://github.com/edenhill/librdkafka .\n\
RUN ./configure --prefix=/usr --libdir=/usr/lib64 && make && make install\n\
FROM ${DOCKER_SOURCE_REGISTRY}ubi-minimal\n\
COPY --from=kafka-builder /usr/lib64/librdkafka*.* /usr/lib64/\n\
COPY --from=kafka-builder /usr/lib64/pkgconfig /usr/lib64/pkgconfig\n
endef

define centos-golang113-librdkafka130
FROM ${DOCKER_SOURCE_REGISTRY}centos\n\
RUN yum install -y ca-certificates git make gcc gcc-c++ zlib-devel openssl-devel cyrus-sasl-devel\n\
WORKDIR /librdkafka\n\
RUN git clone -b v1.3.0 https://github.com/edenhill/librdkafka .\n\
RUN ./configure --prefix=/usr --libdir=/usr/lib64 && make && make install && rm -rf /librdkafka/*\n\
RUN curl https://dl.google.com/go/go1.13.5.linux-amd64.tar.gz -L |tar zxf - -C /opt/\n\
ENV PATH=/opt/go/bin:$$PATH\n\
ENV GOROOT=/opt/go\n
endef

define centos-librdkafka130
FROM ${DOCKER_SOURCE_REGISTRY}centos\n\
RUN yum install -y ca-certificates git make gcc gcc-c++ zlib-devel openssl-devel cyrus-sasl-devel\n\
WORKDIR /librdkafka\n\
RUN git clone -b v1.3.0 https://github.com/edenhill/librdkafka .\n\
RUN ./configure --prefix=/usr --libdir=/usr/lib64 && make && make install && rm -rf /librdkafka/*\n
endef

define ubi-golang113-librdkafka130
FROM ${DOCKER_SOURCE_REGISTRY}ubi as kafka-builder\n\
RUN yum install -y ca-certificates git make gcc gcc-c++ zlib-devel openssl-devel cyrus-sasl-devel\n\
WORKDIR /librdkafka\n\
RUN git clone -b v1.3.0 https://github.com/edenhill/librdkafka .\n\
RUN ./configure --prefix=/usr --libdir=/usr/lib64 && make && make install\n\
RUN curl https://dl.google.com/go/go1.13.5.linux-amd64.tar.gz -L |tar zxf - -C /opt/\n\
ENV PATH=/opt/go/bin:$$PATH\n\
ENV GOROOT=/opt/go\n
endef

define centos-golang113
FROM ${DOCKER_SOURCE_REGISTRY}centos\n\
RUN curl https://dl.google.com/go/go1.13.5.linux-amd64.tar.gz -L |tar zxf - -C /opt/\n\
ENV PATH=/opt/go/bin:$$PATH\n\
ENV GOROOT=/opt/go\n
endef

define debian-golang113
FROM ${DOCKER_SOURCE_REGISTRY}debian\n\
RUN apt-get update && apt-get install -y curl && apt-get clean && rm -rf /var/lib/apt/lists/*\n\
RUN curl https://dl.google.com/go/go1.13.5.linux-amd64.tar.gz -L |tar zxf - -C /opt/\n\
ENV PATH=/opt/go/bin:$$PATH\n\
ENV GOROOT=/opt/go\n
endef

define debian-slim-golang113
FROM ${DOCKER_SOURCE_REGISTRY}debian-slim\n\
RUN apt-get update && apt-get install -y curl && apt-get clean && rm -rf /var/lib/apt/lists/*\n\
RUN curl https://dl.google.com/go/go1.13.5.linux-amd64.tar.gz -L |tar zxf - -C /opt/\n\
ENV PATH=/opt/go/bin:$$PATH\n\
ENV GOROOT=/opt/go\n
endef

define debian-adoptjdk8-sbt
FROM ${DOCKER_SOURCE_REGISTRY}debian\n\
$(centos-adoptjdk-repo)\n\
RUN curl https://bintray.com/sbt/rpm/rpm | tee /etc/yum.repos.d/bintray-sbt-rpm.repo\n\
RUN yum install -y git tar adoptopenjdk-8-hotspot sbt && yum clean all && rm -rf /var/cache/yum\n
endef

define debian-adoptjdk8
FROM ${DOCKER_SOURCE_REGISTRY}centos\n\
$(centos-adoptjdk-repo)\n\
RUN curl https://bintray.com/sbt/rpm/rpm | tee /etc/yum.repos.d/bintray-sbt-rpm.repo\n\
RUN yum install -y git tar adoptopenjdk-8-hotspot sbt && yum clean all && rm -rf /var/cache/yum\n
endef

define debian-slim-adoptjdk8
FROM ${DOCKER_SOURCE_REGISTRY}debian-slim\n\
$(centos-adoptjdk-repo)\n\
RUN curl https://bintray.com/sbt/rpm/rpm | tee /etc/yum.repos.d/bintray-sbt-rpm.repo\n\
RUN yum install -y git tar adoptopenjdk-8-hotspot sbt && yum clean all && rm -rf /var/cache/yum\n
endef

define ubi-minimal-golang
FROM ${DOCKER_SOURCE_REGISTRY}ubi-minimal\n\
RUN curl https://dl.google.com/go/$(shell curl -q https://golang.org/VERSION?m=text).linux-amd64.tar.gz -L |tar zxf - -C /opt/\n\
ENV PATH=/opt/go/bin:$$PATH\n\
ENV GOROOT=/opt/go\n
endef

define ubi-minimal-golang113
FROM ${DOCKER_SOURCE_REGISTRY}ubi-minimal\n\
RUN curl https://dl.google.com/go/go1.13.5.linux-amd64.tar.gz -L |tar zxf - -C /opt/\n\
ENV PATH=/opt/go/bin:$$PATH\n\
ENV GOROOT=/opt/go\n
endef


define ubi-minimal-jdk8-libsodium18
FROM ${DOCKER_SOURCE_REGISTRY}ubi-minimal as builder\n\
RUN microdnf install unzip make gcc gcc-c++\n\
WORKDIR /tmp/libsodium\n\
RUN curl https://github.com/jedisct1/libsodium/archive/1.0.18-RELEASE.zip -OL\n\
RUN unzip 1.0.18-RELEASE.zip; cd libsodium-1.0.18-RELEASE; ./configure --prefix=/usr --libdir=/usr/lib64 &&\ \n\
	make && make install\n\
FROM ${DOCKER_SOURCE_REGISTRY}ubi-minimal\n\
COPY --from=builder /usr/lib64/libsodium*.* /usr/lib64/\n\
COPY --from=builder /usr/lib64/pkgconfig/* /usr/lib64/pkgconfig/\n\
RUN microdnf install java-1.8.0-openjdk-headless && microdnf clean all && rm -rf /var/cache/yum\n
endef

define ubi-minimal-adoptjdk8-libsodium18
FROM ${DOCKER_SOURCE_REGISTRY}ubi-minimal as builder\n\
RUN microdnf install unzip make gcc gcc-c++\n\
WORKDIR /tmp/libsodium\n\
RUN curl https://github.com/jedisct1/libsodium/archive/1.0.18-RELEASE.zip -OL\n\
RUN unzip 1.0.18-RELEASE.zip; cd libsodium-1.0.18-RELEASE; ./configure --prefix=/usr --libdir=/usr/lib64 &&\ \n\
	make && make install\n\
FROM ${DOCKER_SOURCE_REGISTRY}ubi-minimal\n\
COPY --from=builder /usr/lib64/libsodium*.* /usr/lib64/\n\
COPY --from=builder /usr/lib64/pkgconfig/* /usr/lib64/pkgconfig/\n\
$(ubi-adoptjdk-repo)\n\
RUN microdnf install adoptopenjdk-8-hotspot && microdnf clean all && rm -rf /var/cache/yum\n
endef

define ubi-minimal-adoptjdk8j9-libsodium18
FROM ${DOCKER_SOURCE_REGISTRY}ubi-minimal as builder\n\
RUN microdnf install unzip make gcc gcc-c++\n\
WORKDIR /tmp/libsodium\n\
RUN curl https://github.com/jedisct1/libsodium/archive/1.0.18-RELEASE.zip -OL\n\
RUN unzip 1.0.18-RELEASE.zip; cd libsodium-1.0.18-RELEASE; ./configure --prefix=/usr --libdir=/usr/lib64 &&\ \n\
	make && make install\n\
FROM ${DOCKER_SOURCE_REGISTRY}ubi-minimal\n\
COPY --from=builder /usr/lib64/libsodium*.* /usr/lib64/\n\
COPY --from=builder /usr/lib64/pkgconfig/* /usr/lib64/pkgconfig/\n\
$(ubi-adoptjdk-repo)\n\
RUN microdnf install adoptopenjdk-8-openj9 && microdnf clean all && rm -rf /var/cache/yum\n
endef