# Finish English frontend normalization

Project StayHub_NextJS revision 602c4c9cec2071568ce2a33fb5547c0da9e4f30c, current worktree includes existing user changes AND completed auth work; preserve everything. Provider/model openai/gpt-6.1-sol; scout explore ses_eb9d922d0ffeI1z9k02gLYx4Q2 (initial scout ses_eb9de65e3ffeUAtwmcExvcU61y), prior auth implementer general ses_eb9dce899ffeJruhoF8paBzZhA; current general implementer pending. OpenArms docs selection retained, frontend task lock retained; no skill reads or spawning tasks.

User requested inspect frontend tasks especially TSK-019 and implement, enable registration, standardize entire frontend to English-only UI (My Trips, never bilingual parenthetical), place names semantically retained but unaccented display, Vietnamese Unicode input/data remain supported. Auth stage implemented TSK-018/019 forms plus API integration, helper src/lib/auth-ui.ts displayPlace, English Navbar and PropertyCard. Typecheck/lint/build passed; format:check had 43 unrelated baseline files. SMTP/OAuth not runtime tested. Do not undo auth or existing payment fixes.

## Exact authorized source scope for remaining implementation
- src/app/layout.tsx metadata
- src/components/common/Footer.tsx
- src/app/(public)/page.tsx
- src/app/(public)/search/page.tsx
- src/components/property/HeroSearchBar.tsx
- src/components/property/FilterToolbar.tsx
- src/app/(public)/properties/[id]/page.tsx
- src/app/(host)/host/page.tsx
- src/app/(admin)/admin/page.tsx
- src/app/(guest)/properties/[id]/book/page.tsx
- src/app/(guest)/bookings/page.tsx
- src/app/(guest)/bookings/[id]/page.tsx
- src/app/(guest)/payments/vnpay/return/page.tsx
- src/components/common/Navbar.tsx, src/components/property/PropertyCard.tsx, src/lib/auth-ui.ts for consistency/display utility
- src/app/(auth)/login/page.tsx, register/page.tsx, verify-email/page.tsx final language review only
- src/lib/mock-data.ts READ for dynamic structure; do not transliterate/translate stored user content globally
- docs/planning/task-list.md for honest audit/status notes
- Other imported source files may be read to understand contracts; minimal additional frontend files may be edited if essential to user requirement, document them. Do not request an exact file list again; above is authoritative scope.

## Work
Translate static visible UI throughout scope to idiomatic English, headings/status labels/errors/dialogs/forms/loading/empty/accessibility, remove redundant English parenthetical titles. English date formatting as appropriate, retain VND. Preserve dynamic descriptions/reviews/names and original values (not a data migration). Use displayPlace on city/address/destination display only including footer, search headings, booking summaries, details, mock destination labels; preserve accented filter/query values so matching doesn't break. Do not turn Vietnamese input into ASCII as user types. Components may have Vietnamese property type labels/constants: replace visible labels but preserve identifiers.

Do not build missing backend/product features in this copy pass. Read task list and leave honest concise audit note identifying what FE tasks are done/partial/remaining; no false roadmap completion. TSK-020 can remain partial if no profile exists (do not invent profile functionality). Don't introduce a fake working locale selector: English default with Vietnamese text support is not full Vietnamese translation. No need to add alternate language pack.

Run pnpm typecheck, pnpm lint, pnpm build and scoped prettier check for touched files; format only changed files, not repository globally. git diff --check. Existing full format check failure can be reported as known baseline. Add/update focused smoke checks if necessary for displayPlace; do not modify DB or send SMTP/OAuth requests. Review remaining Vietnamese matches in authorized sources, distinguishing intentional proper names/dynamic data/comments from UI copy. Deliver actual implementation, source-backed audit summary, check outcomes and remaining limitations, not a plan.

## Agent records / final progress
- English implementer: general ses_eb9d84e6cffeTWQAbKV6gGkxQu.
- Reconciliation implementer: general ses_eb9d27d2effevGRnC1MzVnyauY.
- Both used selected openai/gpt-6.1-sol. Language reconciliation implemented; typecheck/lint/build passed at check time, lint/build with warnings. Concurrent new AvailabilityChecker.tsx, SearchFilterSidebar.tsx and search-page changes mean stable final-worktree certification is not possible. Do not overwrite independent work.

## Final reconciliation phase
English-pass implementer ID ses_eb9d84e6cffeTWQAbKV6gGkxQu completed most translations and smoke test src/lib/ui-english.smoke.cjs. Concurrent independent edits modified booking/payment and APIs during its run. Preserve ALL current logic, read latest contents. Controller now authorizes a narrow final reconciliation: translate ONLY remaining static UI strings/place displays in current src/app/(guest)/payments/vnpay/return/page.tsx, src/app/(guest)/properties/[id]/book/page.tsx, src/app/(guest)/bookings/[id]/page.tsx, and newly added src/components/booking/BookingForm.tsx. Remove two unused imports in BookingForm if still present. No backend changes. Update audit payment note to describe current UI accurately, not stale placeholder assertions. Review general scope for remaining bilingual labels; do not redo completed work. Run final checks against latest worktree. If an actual new concurrent edit occurs, do not overwrite it; report exact path and conflict rather than claiming verified.
