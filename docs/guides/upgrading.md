---
title: Upgrading and coming from other generators
section: upgrading
order: 10
description: Stay on version 1 and move from another generator without changing existing results.
---

## Within version 1

The specification fixes seeded results. Keep existing draw order when resuming an old position or named daily puzzle; an equivalent-looking rewrite can consume a different number of draws.

## Coming from another generator

The same seed does not imply the same sequence across algorithms. Preserve the old generator when reproducing old data, or explicitly start a new version of the seeded behavior. Pass Tane sources to native draw helpers and separate features with stable deriveSeed labels. A saved draw count belongs to its algorithm and recipe.

## Verify your integration

Use [specification vectors](../spec-vectors.json), round-trip a saved position, and check both numeric and text inputs. The [embed guide](../embeds.md) retains compatibility of reflected options and public event metadata. The [changelog](../../CHANGELOG.md) records version changes.
