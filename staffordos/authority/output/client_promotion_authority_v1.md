# CLIENT PROMOTION AUTHORITY V1

## Purpose

Define when a lead becomes a client record inside StaffordOS.

## Rule

A merchant enters Client Registry when:

- qualification is complete
- product route is selected
- merchant is considered worth pursuing

Payment is NOT required.

## Reason

StaffordOS must monitor:

- acquisition
- conversion
- fulfillment
- merchant success

before payment occurs.

## Lifecycle

Lead
 ->
Qualified
 ->
Product Routed
 ->
Client Registry
 ->
Audit
 ->
Conversation
 ->
Payment
 ->
Packet
 ->
Fulfillment
 ->
Proof
 ->
Merchant Success

## Required Client Fields

- merchant name
- domain
- lifecycle stage
- selected product
- contact status
- audit status
- payment status
- packet status
- fulfillment status
- proof status
- next action

## Anti-Drift Rule

Do not maintain separate merchant tracking systems.

Client Registry is the canonical merchant lifecycle object.
