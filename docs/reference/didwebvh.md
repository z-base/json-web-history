# DID Web with Verifiable History (did:webvh) Reference

## Overview

The did:webvh method defines a verifiable, append-only history for a DID using
an ordered log of updates. The log is stored as JSON Lines in `did.jsonl`, with
each entry appended as a single JSON object per line. citeturn1view0turn2view0

## Log Model

- Each log entry is a JSON object that includes:
  - `versionId`
  - `versionTime`
  - `parameters`
  - `state`
  - `proof` citeturn2view0
- `versionTime` uses UTC date-time format and MUST be greater than the previous
  entry’s `versionTime`. citeturn1view3
- `versionId` is created by combining the prior entry’s `versionId` with the
  hash of the new entry, and includes the entry hash (the hash of the log entry
  excluding its own `proof`). citeturn2view0
- A new log entry is serialized as JSON, followed by a line feed, and appended
  to `did.jsonl`. citeturn2view0

## References

- did:webvh v1.0 — https://identity.foundation/didwebvh/v1.0/
