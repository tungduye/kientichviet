# Product catalog administration — TDD evidence

## Source and journeys

The journeys were derived from the approved Gate 1 plan in the Codex conversation on 2026-10-28.

- As an administrator, I can edit a product or variant image and display price.
- As an administrator, I can hide or show a product or variant without exposing editing controls to customers.
- As a customer, I cannot see hidden items or open their detail pages.
- As the owner, I can rely on database and Storage policies rather than browser-only authorization.

## RED evidence

Command: `pnpm exec vitest run src/features/catalog/catalog.test.ts`

Result: the suite failed because `./catalog` did not exist. This was the intended compile-time RED state for the approved catalog behavior.

Code and security review added two further RED checks: a missing catalog row incorrectly appeared to customers, and the server-side raster validator did not yet exist. Both targeted suites failed for those intended reasons before their implementations were added.

## GREEN evidence

Command: `pnpm exec vitest run src/features/catalog/catalog.test.ts`

Result: 1 test file passed and 6 tests passed.

| # | Guarantee | Test target | Type | Result |
|---|---|---|---|---|
| 1 | Disabled products are absent from the customer catalog | `catalog.test.ts` | Unit | PASS |
| 2 | Saved price and image override the static product defaults | `catalog.test.ts` | Unit | PASS |
| 3 | Hidden products remain available in the administrator editor | `catalog.test.ts` | Unit | PASS |
| 4 | Individual Tháp Rùa variants can be overridden or hidden | `catalog.test.ts` | Unit | PASS |
| 5 | SVG and images larger than 5 MB are rejected | `catalog.test.ts` | Unit | PASS |
| 6 | A bounded WebP image is accepted | `catalog.test.ts` | Unit | PASS |
| 7 | Missing catalog rows fail closed instead of becoming visible | `catalog.test.ts` | Unit | PASS |
| 8 | Server validation recognizes PNG, JPEG and WebP from their bytes | `imageValidation.test.ts` | Unit | PASS |
| 9 | Server validation rejects arbitrary bytes, malformed containers and oversized decoded dimensions | `imageValidation.test.ts` | Unit | PASS |

Full suite command: `pnpm test`

Result after implementation and review hardening: 5 test files passed and 31 tests passed.

Coverage command: `pnpm test:coverage`

Result: 86.52% statements, 87.41% branches, 96.87% functions and 90.97% lines.

Type check command: `pnpm exec tsc --noEmit`

Result: PASS.

Build command: `pnpm build`

Result: PASS with the existing large-chunk performance warning.

## Security controls

- Product update and image upload authorization is enforced by Supabase RLS.
- Public visitors can select only visible catalog rows.
- Admin membership is stored by immutable Auth user ID, not user-editable metadata.
- The public application has no signup link or admin navigation link.
- Direct browser writes to Storage are denied. The upload Edge Function verifies admin membership, file signature, declared dimensions and the 5 MB limit, then updates the catalog. A failed catalog update removes the newly uploaded object. Older versions are retained for a 24-hour customer-session grace period and cleaned on a later save.
- Admin sessions are memory-only and are not persisted across browser restarts or reloads.

## Known gaps

- The migration must be applied to the new Supabase project before `/quan-tri` can be used.
- One existing Auth user must be added to `public.admin_users` through the SQL Editor.
- Before production use, require Supabase MFA/AAL2 for administrators. The current password-only flow is intended for initial owner setup.
- The server validates container signatures and dimensions but does not fully decode and re-encode raster data. Production hardening should add a trusted decoder/re-encoder before accepting uploads from a compromised admin session.
- Automated browser QA remains unavailable because local browser control is disabled in the current Work settings.
- No TDD checkpoint commit was created because ECC Gate 2 requires user confirmation and Git author identity is not configured.
