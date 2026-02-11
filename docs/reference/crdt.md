# CRDT Reference

## Overview

Conflict-free Replicated Data Types (CRDTs) are designed to guarantee eventual
consistency for replicated mutable objects without foreground synchronization.
The CRDT approach is to define formal conditions on data types that are
sufficient to ensure replicas converge. The original technical report names
these types Convergent or Commutative Replicated Data Types (CRDTs). It also
formalizes asynchronous replication in either state-based or operation-based
forms and gives sufficient conditions for each. The report describes a range
of CRDTs, including containers with add/remove semantics, as well as graphs,
monotonic DAGs, and sequences.

## Core Concepts

- Eventual consistency: replicas of a shared object converge without
  foreground synchronization.
- Formal conditions: CRDTs are defined by conditions that are sufficient to
  guarantee convergence.
- Two replication models:
  - State-based replication (convergent model).
  - Operation-based replication (commutative model).

## References

- Marc Shapiro, Nuno Preguica, Carlos Baquero, Marek Zawirski.
  "A comprehensive study of convergent and commutative replicated data types."
  Technical Report RR-7506, Inria, January 2011.
  https://webarchive.di.uminho.pt/haslab.uminho.pt/cbm/publications/comprehensive-study-convergent-and-commutative-replicated-data-types.html
