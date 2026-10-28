# Full CMS and Web AR — TDD evidence

## Scope

- Schema-driven website content with draft, preview, publish and revision restore.
- Protected administrator editors for website content and per-product AR settings.
- Image-target tracking with MindAR and plane-placement fallback with model-viewer.
- Published CMS content added to the server-side AI context as untrusted data.

## Test-first evidence

The initial red tests covered content sanitization/snapshot behavior and AR readiness before the implementations existed. The green implementation is in `src/features/cms/siteContent.ts` and `src/features/ar/arConfig.ts`.

## Verification

- `pnpm test`: 39 tests pass in 7 files.
- `pnpm test:coverage`: 86.62% statements, 89.32% branches, 94.87% functions, 90.18% lines.
- `pnpm exec tsc --noEmit`: pass.
- `pnpm build`: pass.
- `git diff --check`: pass.
- `pnpm audit --prod`: 0 known vulnerabilities.

## Operational dependency

Image tracking cannot be validated against a real target until an administrator supplies a compiled `.mind` target. Camera validation must be performed on an HTTPS mobile deployment; localhost supports development permission checks.
