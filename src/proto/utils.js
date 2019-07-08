// @flow strict

type Timestamp = {
  seconds: number,
  nanos: number,
};

function timestampFromMs(ms: number): Timestamp {
  return {
    seconds: parseInt(ms / 1000, 10),
    nanos: (ms % 1000) * 1e6,
  };
}

function msFromTimestamp({ seconds, nanos }: Timestamp): number {
  // seconds might be long
  const secondsMs = parseInt(seconds.toString(), 10) * 1000;
  const nanosMs = parseInt(nanos / 1e6, 10);

  return secondsMs + nanosMs;
}

const packValue = <T>(value: T | null): { value: T } | null =>
  value === null ? null : { value };

const unpackValue = <T>(value: { value: T | null } | null): T | null =>
  value && value.value;

module.exports = {
  packValue,
  unpackValue,
  timestampFromMs,
  msFromTimestamp,
};
