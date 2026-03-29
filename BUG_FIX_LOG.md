# Bug fix log — Coach Check-in Dashboard

Chronological record of significant fixes to member loading, coach assignment, and counts. Related code lives primarily in [`src/hooks/useMembers.ts`](src/hooks/useMembers.ts).

---

## 2026-03-29 — `journey_stage` filter excluded NULL rows (PostgREST)

**Symptom:** Coach member lists were far too short (e.g. a coach with many clients only saw a handful).

**Cause:** The Supabase query used `.neq('journey_stage', 'no_sale')`. In PostgreSQL, `column != 'value'` is not true when the column is `NULL`, so PostgREST omitted rows where `journey_stage` was null — including primary memberships that should appear.

**Fix:** Remove the DB-level `journey_stage` filter. After loading data, exclude members only when the **primary** membership has `journey_stage === 'no_sale'` (in JavaScript).

**Commit:** `cc23caf` — *Fix coach member count by moving journey_stage filter to JS on primary only*

---

## 2026-03-29 — Default 1000-row limit truncated unfiltered membership fetch

**Symptom:** Counts stayed wrong even after the `journey_stage` change; coach lists capped around a small number unrelated to real assignments.

**Cause:** `member_memberships` had more than 1000 rows. The app fetched the whole table with no coach filter; PostgREST returns at most 1000 rows by default, so later rows (and many members) never reached the client.

**Fix:** Stop loading the entire table. Step 1: query only **primary** rows (`primary_membership_id IS NULL`) where `coach_id` or `handoff_coach_id` is in the selected coach list (`.or(...)`). Step 2: apply effective-coach and `no_sale` rules in JS. Step 3: load secondaries and `member_database` names for qualified `member_id`s only.

**Commit:** `424744f` — *Fix 1000-row truncation by filtering coach server-side*

---

## 2026-03-29 — Active vs expired did not match Retool (`end_date` boundary)

**Symptom:** Slight mismatch vs the Retool “coach workbook” query (off by one on expiry day).

**Cause:** Retool uses `m.end_date > CURRENT_DATE` (strictly after today). The app treated “expired” as `end_date < today`, so a membership expiring **today** still counted as active.

**Fix:** Treat as expired when `primary.end_date <= today` (string compare on ISO dates), aligning with Retool’s “active” definition.

**Commit:** `012fb4c` — *Match Retool expiry logic: end_date on expiry day counts as expired*

---

## 2026-03-29 — Multiple “primary” rows per member (renewal history)

**Symptom:** After server-side filtering, active client count was still low (e.g. 24 vs 30 for a coach) while Retool showed the higher correct number.

**Cause:** Some members have **several** rows with `primary_membership_id IS NULL` (one per renewal cycle). The code stored one row per `member_id` in a `Map` and overwrote on each row; whichever row appeared last in the response could be an **old** expired primary instead of the current one.

**Fix:** When multiple qualifying primaries exist for the same `member_id`, keep the row with the **latest** `end_date` (lexicographic compare on ISO date strings is valid).

**Commit:** `85bc7a3` — *Fix duplicate primaries: keep latest end_date per member on renewal history*

---

## Reference — Retool source of truth

The internal Retool query filters with:

- `primary_membership_id IS NULL`
- `end_date > CURRENT_DATE`
- `journey_stage <> 'no_sale'` (SQL semantics: excludes NULL `journey_stage`; the app intentionally includes NULL as non–`no_sale` on the primary row)
- Effective coach: `(handoff_coach_id = staff.id) OR (coach_id = staff.id AND handoff_coach_id IS NULL)`

The dashboard mirrors **effective coach** as `handoff_coach_id ?? coach_id` and **primary** selection as above, with **latest `end_date`** when several primaries exist.

---

*Last updated: 2026-03-29*
