# Voice assistant and Tháp Rùa variants — TDD evidence

## Source and user journeys

The journeys were derived from the approved implementation plan in the Codex conversation on 2026-10-28.

- As a visitor, I can ask the product assistant by voice and receive the answer as visible text and Vietnamese speech.
- As a returning visitor, I can reload the page and continue from locally saved chat history.
- As a visitor, the assistant stays within the two supported stories, assembly guidance, NFC and AR.
- As a shopper, I can choose Basic, Signature or Premium for Tháp Rùa and keep editions distinct in the cart.

## RED evidence

Command: `pnpm test`

Result before implementation: 2 failed suites. Vitest reported that `./chatSession` and `./productVariants` could not be found. This was the intended compile-time RED state because the planned behavior modules did not exist yet.

## GREEN evidence

| # | Guarantee | Test target | Type | Result |
|---|---|---|---|---|
| 1 | Saved chat restores only valid user/assistant messages and caps history at 30 | `src/features/chat/chatSession.test.ts` | Unit | PASS |
| 2 | Corrupted local history fails safely to an empty conversation | `src/features/chat/chatSession.test.ts` | Unit | PASS |
| 3 | Chat messages use stable fields and trimmed text | `src/features/chat/chatSession.test.ts` | Unit | PASS |
| 4 | Markdown is converted to natural plain text for voice output | `src/features/chat/chatSession.test.ts` | Unit | PASS |
| 5 | Tháp Rùa exposes Basic, Signature and Premium in the required order | `src/features/products/productVariants.test.ts` | Unit | PASS |
| 6 | Unknown Signature/Premium prices remain “Liên hệ” | `src/features/products/productVariants.test.ts` | Unit | PASS |
| 7 | Each edition creates a distinct cart product ID and name | `src/features/products/productVariants.test.ts` | Unit | PASS |
| 8 | Other products do not receive invented variants | `src/features/products/productVariants.test.ts` | Unit | PASS |
| 9 | CORS accepts only official, preview and local-development hosts | `supabase/functions/heritage-chat/requestGuards.test.ts` | Unit | PASS |
| 10 | Malformed or fabricated message roles are rejected | `supabase/functions/heritage-chat/requestGuards.test.ts` | Unit | PASS |
| 11 | Server accepts only one bounded user-role prompt and rejects forged assistant history | `supabase/functions/heritage-chat/requestGuards.test.ts` | Unit | PASS |
| 12 | Server rejects messages over 2,000 characters | `supabase/functions/heritage-chat/requestGuards.test.ts` | Unit | PASS |
| 13 | Client messages are capped before persistence | `src/features/chat/chatSession.test.ts` | Unit | PASS |
| 14 | Browser storage quota failures do not crash chat | `src/features/chat/chatSession.test.ts` | Unit | PASS |
| 15 | Recent conversation is serialized as bounded, explicitly untrusted context | `src/features/chat/chatSession.test.ts` | Unit | PASS |
| 16 | Disallowed browser origins are identified before model execution | `supabase/functions/heritage-chat/requestGuards.test.ts` | Unit | PASS |

Command: `pnpm test`

Result after the initial implementation: 2 test files passed, 8 tests passed.

Security and code review then added a second RED cycle. `pnpm test` reported one missing request-guard module plus two failures for overlong messages and rejected storage writes. After implementing strict origin/message validation, early origin rejection and bounded, failure-safe persistence, the same command passed 3 test files and 17 tests.

Command: `pnpm test:coverage`

Result: all configured feature targets exceed the 80% thresholds: 89.23% statements, 85.71% branches, 100% functions and 96.66% lines.

Command: `pnpm build`

Result: production Vite build passed. Vite retained the existing large-chunk performance warning.

## Known gaps

- Automated visual browser QA was not run because the local browser origin permission was declined. There is no committed visual baseline, so visual regression remains inconclusive.
- Repository-wide `tsc --noEmit` is blocked by two existing generic-index errors in `src/integrations/supabase/types.ts`; the production build succeeds and the changed files introduce no build error.
- Voice recognition support varies by browser. The UI provides a text-input fallback and reports when voice input is unavailable.
- The follow-up camera-based tracked AR work was intentionally left out of this change.

## Merge evidence

RED: missing feature modules produced the expected two-suite failure; the review-hardening cycle then produced one missing-module suite and two intended failing tests. GREEN: all 17 tests passed after implementation. Refactor/verification: targeted formatting checks, diff check, coverage and production build passed. No checkpoint commit was created because the ECC orchestration Gate 2 requires user confirmation before committing.
