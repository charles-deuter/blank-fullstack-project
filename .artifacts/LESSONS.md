# Lessons

A running log of corrections. One entry per lesson: what went wrong, and the rule
that would have caught it. Read before editing any CLAUDE.md — entries that recur
are candidates for promotion into one.

---

## 2026-09-03 — Answered a direct question with a questionnaire

**What went wrong:** Asked "are there any issues with my CLAUDE.md? How can I
improve it?" — a question with a findable answer — I wrote a plan file and then
put up four AskUserQuestion options before saying anything I had found. The
questions got dismissed. The findings were already in hand and should have led.

**Rule that would have caught it:** A question gets an answer first. Ask only about
decisions the answer itself surfaces, and ask them after the findings are on the
table, not instead of them.

---

## 2026-09-05 — Shipped a slice that stale-referenced and re-introduced known drift

**What went wrong:** Building the wallet slice I deleted `FooTable.tsx` and
`server-actions/foo.ts`, but left CONTEXT.md's layer map citing both as the
reference files — I broke the very document that exists to stop drift. In the same
pass I copied `BACKEND_URL ?? 'http://localhost:4000'` and `failureMessage` into
three new server actions, widening a duplication CONTEXT.md already listed under
Known drift. Both only got fixed because a later polish pass went looking.

**Rule that would have caught it:** Deleting or adding a file that CONTEXT.md names
is part of the same change, not follow-up work — grep CONTEXT.md for every path you
touch before finishing. And read its Known drift section before copying a pattern:
if the drift is already recorded, extend the fix, never the drift.
