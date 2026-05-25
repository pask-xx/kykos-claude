---
name: kykos-anonimity
description: Anonymity as core KYKOS value — never expose names between donor and recipient
metadata:
  type: reference
---

# Anonymity as Core KYKOS Value

Anonymity is not a feature to add later — it is a **core architectural principle** that must be respected in every line of code.

## Why Anonymity Matters

KYKOS connects donors with beneficiaries through trusted intermediary organizations. The platform's trust model depends on:

1. **Donors** can give without being asked for anything in return
2. **Recipients** can receive without feeling exposed or indebted
3. **Intermediaries** handle the human side — they know both parties and ensure dignity

## The Three Rules

| Rule | Description |
|------|-------------|
| Donor anonymity | Donors never see recipient identity |
| Recipient anonymity | Recipients never see donor identity |
| Intermediary transparency | Intermediaries see both (trusted party) |

## Implementation Checklist

For every API route that returns user data:

- [ ] Does PUBLIC need `donor.name`? **NO** → remove it
- [ ] Does DONOR need `recipient.name`? **NO** → remove it
- [ ] Does RECIPIENT need `donor.name`? **NO** → remove it
- [ ] Does INTERMEDIARY need both? **YES** → keep both
- [ ] Does ADMIN need names? **NO** → keep aggregate data only

## Gamification as Identity Proxy

Instead of names, use `donorProfile.level` (BRONZE/SILVER/GOLD/PLATINUM/DIAMOND) to give recipients a sense of donor engagement without exposing identity.
