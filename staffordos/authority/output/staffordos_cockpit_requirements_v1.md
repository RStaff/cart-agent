# STAFFORDOS COCKPIT REQUIREMENTS V1

## Purpose

Define what StaffordOS must show so Ross can operate the business end-to-end without losing control.

## Cockpit Principle

StaffordOS should not feel like a black box.

Automation is allowed only when the operator can see:

- what happened
- why it happened
- what is waiting
- what requires approval
- what creates revenue
- what creates risk

---

## Required Views

### 1. Acquisition View

Shows:

- real store candidates
- qualified targets
- contact discovery status
- contact research status
- outreach status
- product routing recommendation

Primary Question:

Which merchants should I contact next?

---

### 2. Conversion View

Shows:

- audit status
- screenshot evidence
- proposed fix
- selected product
- checkout link
- payment status

Primary Question:

Which merchants are close to paying?

---

### 3. Fulfillment View

Shows:

- paid packets
- sprint scope
- approval status
- implementation status
- QA status
- proof status

Primary Question:

Which merchants need work completed?

---

### 4. Merchant Success View

Shows:

- completed proof packages
- merchant review status
- testimonial status
- referral opportunity
- next sprint opportunity

Primary Question:

Which completed merchants can create the next sale?

---

### 5. Executive Control View

Shows:

- revenue
- active pipeline
- capacity used
- blocked items
- system health
- next best action

Primary Question:

What should Ross do next to grow revenue without breaking quality?

---

## Required Object Card

Every merchant card must show:

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
- risk flag

---

## UI/UX Rule

The cockpit should show lifecycle state first, raw system details second.

Do not show implementation complexity unless the operator asks for it.

---

## Anti-Drift Rule

Do not build disconnected dashboards.

Every cockpit element must map to one lifecycle stage:

Acquisition
Conversion
Fulfillment
Merchant Success
Executive Control
