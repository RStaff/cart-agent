const expected = "v24.22.1";

if (process.version !== expected) {
  throw new Error(`NODE_VERSION_MISMATCH expected=${expected} observed=${process.version}`);
}
