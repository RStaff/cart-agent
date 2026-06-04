# AI SLOP CREEP INCIDENT - 2026-06-03

## Summary

Broad AI implementation prompts modified multiple StaffordOS and public conversion surfaces without passing through the intended StaffordOS governance/gated workflow.

## Root Cause

StaffordOS governance was bypassed.

## Risk

- Public brand/copy drift
- Unverified navigation changes
- Mixed-scope worktree
- AI-generated wording not fully tied to authority
- Operator trust degradation

## Locked Rule

Do not bypass StaffordOS.

All future implementation must go through:

1. current-state inventory
2. authority verification
3. exact file/route list
4. scoped implementation
5. diff review
6. human approval before commit

## Current Containment

Do not commit broad unverified public website or Command Center changes.
