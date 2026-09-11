# Lessons

A running log of corrections. One entry per lesson: what went wrong, and the rule
that would have caught it. Read before editing any CLAUDE.md — entries that recur
are candidates for promotion into one.

---

## 2026-09-05 — Verification grep written against unminified source

**What went wrong:** To confirm `@tailwindcss/forms` compiled in, I grepped the
production CSS for `appearance: none` and `[type='text']` — the spacing and quoting
of *source* CSS. Turbopack minifies: the bundle holds `appearance:none` and
`[type=text]`. The grep returned nothing and I briefly read a working config as broken.

**Rule that would have caught it:** When grepping build output, match on the token
the minifier cannot change (an identifier, a URL, a data URI), never on whitespace
or quote style carried over from source.

---

## 2026-09-05 — Reasoned about CSS cascade instead of measuring it

**What went wrong:** Overriding `@tailwindcss/forms`' white input background, I
assumed my `@layer base` rules would win because they sit later in `globals.css`.
Tailwind emits plugin base styles at the end of the layer, so at equal specificity
the plugin won and every input stayed white. I only caught it by reading
`getComputedStyle` in the browser. A second slip in the fix: prefixing `html` to a
comma-separated selector list raised specificity on the first selector only, leaving
`select` and `textarea` still losing.

**Rule that would have caught it:** Never call a style override done from reading
the source. Assert the resolved value — `getComputedStyle` on a real node — and
check every selector in a comma list, since each carries its own specificity.

---

## 2026-09-05 — Layered two utilities for the same property

**What went wrong:** Building the field components, I set the invalid state as
`cn(TEXT_CONTROL, error && CONTROL_INVALID)` — `border-edge` and `border-danger` on
one element. Equal specificity, same layer, so emission order picked the winner and
every invalid field rendered with the normal border. Order inside `className` has no
say. Same root cause as the entry above, one turn later.

**Rule that would have caught it:** Variant states are mutually exclusive branches,
never layers: `hasError ? INVALID : VALID`, with each property named in exactly one
branch. If two classes could set the same property on one element, the cascade —
not the code — decides, and it will not decide the way the code reads.
