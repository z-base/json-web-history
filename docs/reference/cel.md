# Cryptographic Event Log (CEL) Reference

## Overview

The Cryptographic Event Log (CEL) specification defines a log-based model for
recording and verifying changes to data over time. A CEL log is a JSON document
with a top-level `log` array of entries, where each entry includes an `event`
object and a `proof` array that secures the event data. citeturn0view0

## Log Model

- Each entry in the `log` array contains:
  - `event`: the event data.
  - `proof`: an array of Data Integrity proofs for the event. citeturn0view0
- Events link to their predecessors via `previousEvent`, enabling verification
  of a linear event history. citeturn0view0
- CEL supports optional log chunking by including a `previousLog` object that
  links to the prior chunk and provides its digest and proofs. citeturn0view0

## References

- Cryptographic Event Log v0.1 — https://w3c-ccg.github.io/cel-spec/
