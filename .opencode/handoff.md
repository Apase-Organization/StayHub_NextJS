# Frontend auth and English UI handoff

## Project / selection / task lock
- Project: StayHub_NextJS; revision 602c4c9cec2071568ce2a33fb5547c0da9e4f30c.
- Selected provider/model: openai/gpt-6.1-sol. Scout agent type explore, ID ses_eb9de65e3ffeUAtwmcExvcU61y. Implementer type general, ID ses_eb9dce899ffeJruhoF8paBzZhA.
- OpenArms selection preserved: docs (technical-writing + archify loaded earlier). Task locked to frontend auth, task audit, English UI. No additional skills needed or authorized; do not read skill files or spawn tasks.
- User explicitly requests implement frontend work, especially TSK-019, enable registration, English-only UI labels (My Trips, not bilingual labels), place names unchanged semantically but unaccented for display, retain Vietnamese input/data support.

## Existing changes: preserve carefully
Dirty at start: .env.example, .github/workflows/ci.yml, README.md, package.json, src/app/(auth)/login/page.tsx, src/app/(guest)/payments/vnpay/return/page.tsx, src/app/(guest)/properties/[id]/book/page.tsx, src/lib/auth.ts; untracked src/app/api/payments/vnpay/verify/. Do not overwrite/revert these changes. Review current contents before scoped edits. No commits, DB mutations, or exposing secrets.

## Discovery / confirmed cause
- docs/planning/task-list.md:122-126 defines TSK-018 credentials+Google login RHF/Zod, TSK-019 RHF/Zod registration + six-digit OTP, TSK-020 session navbar; unchecked.
- register/page.tsx and verify-email/page.tsx under src/app/(auth) are placeholder pages. Existing endpoints POST /api/auth/register and /api/auth/verify-otp and schemas src/schemas/auth.schema.ts exist.
- Actual route-group URLs are /register and /verify-email, NOT /auth/verify-email as stale task prose suggests. Verify current routes and links.
- Login was modified since earlier discovery; use its current contents, not assumptions about Google-only implementation.
- Major UI copy hotspots: src/app/(public)/page.tsx, search/page.tsx; src/components/common/Navbar.tsx; src/components/property/PropertyCard.tsx and FilterToolbar.tsx; guest/host/admin/auth layouts/pages and shared components. Place values in src/lib/mock-data.ts contain Vietnamese diacritics.
- No AGENTS.md found by scout; follow any actual project instructions encountered without reading SKILL.md.

## Implementation scope / acceptance
1. Read task-list and audit frontend task status vs actual code; prioritize and complete TSK-019 and closely adjacent TSK-018/020 where feasible. Do not interpret request as permission to rewrite entire backend or claim all roadmap done. Report other FE gaps clearly.
2. Implement usable accessible register and OTP forms using existing schemas/API contracts, RHF + Zod per acceptance (add dependencies/lockfile if needed). Include English validation, errors, loading, duplicate-submit protection, correct links, email passed safely to verification route, six-digit OTP validation, success navigation to login. Never expose OTP or secrets. Understand API email delivery failure behavior and document limitations instead of broad backend rewrites.
3. Ensure credentials and Google login plus discoverable Register/Login links/session role menus work with current auth implementation. Preserve current callback redirect protections and VNPay work.
4. Normalize user-facing static UI copy across active frontend pages/components to idiomatic English, remove bilingual parenthetical UI labels (My Trips). Cover guest/host/admin and auth, empty/loading/error states where feasible. Do not translate planning docs or code comments just for consistency. Map backend errors to safe English frontend messages when practical; avoid displaying untranslated backend text blindly.
5. Display place names unaccented via reusable display normalization (including đ/Đ); do not remove accents globally from user names, descriptions, reviews, form input or stored data. Preserve Vietnamese Unicode support. Search/filter must not break accented city values: retain original query values or normalize comparison appropriately. English locale formatting where appropriate, VND currency remains.
6. Update task checklist only for genuinely satisfied acceptance; use notes for partial work and include explicit FE audit summary (in existing suitable docs or final report), do not indiscriminately check tasks. TSK-019 route discrepancy can be corrected.
7. Add focused regression coverage if project supports it; no test framework currently established per scout. Avoid fabricating successful runtime email/Google tests.

## Verification / mandatory checks
Run pnpm typecheck, pnpm lint, pnpm build, pnpm format:check (report pre-existing/global failures separately; format only touched files to avoid unrelated churn). Inspect scoped git diff, ensure no secret/generated artifact leakage. Add feasible static/function smoke checks for transliteration/OTP and validate API response shapes. Do not start long-lived services or create accounts to test without necessity/permission. Runtime SMTP/OAuth may be unavailable; state exact limits.

## Progress / unresolved
- Discovery complete; implementation pending. Existing dirty files require careful incremental changes.
- Entire frontend roadmap is much broader than this change; auth completion and English normalization are primary deliverables. Return completed/partial task IDs, changed files, commands/results, remaining blockers, and no raw long logs.
