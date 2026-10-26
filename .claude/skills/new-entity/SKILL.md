---
name: new-entity
description: Stamp a new backend+frontend vertical slice (model, DAL, route, specs, server action, panel, table, form, component specs) by copying the foo reference slice with the entity name substituted.
disable-model-invocation: true
---

# New entity

Stamps the eleven files of a vertical slice plus the two registration lines (`schema.ts`, `router.ts`) from the `foo` reference slice, with the name substituted in every casing. The result compiles, its specs pass, and it still has foo's shape: five example columns (`name`, `description`, `category`, `priority`, `is_active`) and a create form that uses every form-kit field. Delete the columns and fields the entity does not need. Editing it into the real entity is the work; the recipe in `CONTEXT.md` ("How to add a feature") is the order.

## Steps

1. From the repo root, with the entity name in kebab-case singular:

   ```bash
   node .claude/skills/new-entity/scaffold.mjs <entity>
   ```

   `wallet-balance` gives table `wallet_balance`, identifiers `walletBalance` / `WalletBalance` / `WALLET_BALANCE`, route `/api/wallet-balance`, files `wallet-balance.ts`, `WalletBalancePanel.tsx` and `WalletBalanceForm.tsx`. The script refuses to overwrite an existing file, rejects `foo` as the name, and runs `npx prettier --write` on every file it touches.

2. Edit the model's columns to the real entity **before** generating the migration, so the slice produces one migration, not a foo-shaped one plus a fix-up.

3. Continue from step 3 of the `CONTEXT.md` recipe (`npm run db:generate`). The stamped specs are foo's; rewrite them to the entity's behaviour as the first red test, not after. That includes the stamped frontend specs (`<Entity>Form.test.tsx`, `<Entity>Table.test.tsx`).

Done when: both packages typecheck, the entity's specs pass, and no stamped file still says `name` where it should not.
