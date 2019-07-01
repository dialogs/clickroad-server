// @flow strict

const uuid = require('uuid/v4');

function getOrCreateContextId(cid?: string | null | void): string {
  if (typeof cid === 'string' && cid.length) {
    return cid;
  }

  return uuid();
}

module.exports = getOrCreateContextId;
