---
title: Engine and compatibility
section: explanation
order: 7
description: See the small state of the generator, why the sequence is part of the contract, and what it is not for.
---

## One small state

`step` advances mulberry32 and returns both value and next state. A source closes over that 32-bit state. `stateAt` computes a later state directly, and a counted source makes its consumption visible.

## Numbers are part of the contract

The same seed and recipe must produce the same sequence on every supported host. The generator, text hashing, derived labels and draw counts are specified in [spec.md](../spec.md) and checked against the repository’s vectors. A change to those results is a breaking change, not a documentation adjustment.

## Statistical work, not secrets

The generator is deliberately small and predictable. It supports reproducible games, fixtures and daily puzzles; it is not a cryptographic source. The existing README’s [Not for secrets](../../README.md#not-for-secrets) section retains the full limitations.

## Pure engine and presentation

The main entry contains no DOM. Hooks and the picker are separate entries. Documentation search is built locally; its build tools add no runtime dependency.
