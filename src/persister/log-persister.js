// @flow strict

type Config = {
  logger: typeof console,
};

function createLogPersister({ logger }: Config) {
  return {
    async persist(messages: Array<Object>) {
      messages.forEach((message) => logger.log(message));
    },
    async stop() {},
  };
}

module.exports = createLogPersister;
