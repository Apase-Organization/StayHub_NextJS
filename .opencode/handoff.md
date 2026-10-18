# Demo property replacement

## Project and selection

- Project: StayHub_NextJS, revision 592bdf1b5d5e4de659fcf18ad6847ce6d89d578d; initial working tree clean.
- Provider/model: openai/gpt-6.1-sol. Scouts: explore / ses_eaf7b32fbffeBpF1g2EDl1M1bf and ses_eaf7581fcffeTKcsNVvM0xTJUK. Initial implementer: general / ses_eaf75e328ffegsKruurztj6UV8 (stopped with no changes); fresh replacement implementer session recorded after launch.
- OpenArms: docs:archify available, not loaded because this is data implementation, not architecture documentation. No skill package active. Task lock: replace demo properties only; do not access skill files or spawn tasks.

## Authorized scope

User explicitly confirms configured database is demo and authorizes permanent deletion of ALL old properties and their bookings, payments, reviews. Replace with exactly 20 new plausible demo properties at Vietnamese tourist destinations, each >=3 usable photos, all owned by existing host@stayhub.com. Grant HOST if absent. Preserve existing password; do not reset it or embed plaintext credentials anywhere. Preserve unrelated users, roles and data. If database target or destructive dependencies prove unclear, stop and report.
User has no images. Use attributable, permitted illustrative images relevant to destination; never imply verified photos of actual accommodation. Prefer reliably downloaded local assets if feasible; verify availability before DB deletion. Disclose illustrative nature in data/documentation. Do not claim location verification without evidence.

## Findings and implementation targets

- prisma/schema.prisma: properties, images, amenities, users, bookings, payments, reviews. Booking/review FKs restrict deletion; images/amenities cascade. Inspect full dependency graph before deletion.
- src/app/api/properties/[id]/route.ts and src/services/property.service.ts only archive on DELETE; task requires real database deletion, not archive.
- src/lib/auth.ts uses bcrypt credential checks and active users. Ensure host role through existing role model without dropping other roles.
- src/lib/cloudinary.ts and src/app/api/properties/[id]/images/route.ts handle local/Cloudinary assets. Avoid deleting assets shared with unrelated entities. Report orphan cleanup if not safely possible.
- src/schemas/property.schema.ts for valid property fields. Consult docs/data/properties.md, docs/data/relational-model.md, docs/contributing/getting-started.md, docs/contributing/conventions.md and any project AGENTS instructions. Never inspect skill files.
- .env exists; load credentials without printing them. No DB inspection or write performed yet. No seed/test scripts exist currently.

## Work required

1. Inspect named sources/instructions and configured DB safely. Read-only preflight counts and host status; avoid credential exposure. Determine image strategy and validate all 60+ images before destructive changes.
2. Implement maintainable explicit opt-in demo reset/import script and compact provenance/data documentation as needed. Default safe/dry-run, strong destructive confirmation, no secret defaults. Validate dataset uniqueness, meaningful prices/descriptions, geography/coordinates, 3+ images and single cover per listing. Never fabricate an actual hotel identity/photo match.
3. Execute authorized reset against configured demo DB, using transaction for dependency deletions and insertions. Preserve host password and unrelated records. Existing assets cleanup only when safe. Do not migrate/reset schema or delete unrelated users.
4. Verify actual resulting DB has exactly 20 properties, sole correct host, >=3 usable images each, valid cover and coordinates, host active/HOST and all intended dependent old data removed. Provide before/after counts without secrets. Check image URLs via requests or local file existence.
5. Run mandatory checks below; return precise changes, commands/results, DB verification and caveats. No commits.

## Mandatory verification

- Use package manager from lockfile; package scripts: lint, typecheck, build, format:check. Run lint and typecheck, Prisma validate, targeted prettier checks for changed text/code and build if environment supports. Clearly distinguish preexisting/environment failures.
- Dry-run before execution; post-reset database invariants and image accessibility checks are mandatory. Never print DB URLs or secrets.

## Progress

- Source/docs scout complete. User destructive authorization and destination/image clarification complete.
- Implementation and database execution completed by general / ses_eaf74f640ffek7D6VcUlF3fjW1, profile openai/gpt-6.1-sol.
- Verified committed DB: 8 old properties replaced with 20 ACTIVE properties owned by the existing ACTIVE/HOST account; 60 image references, 3 distinct photos and one cover each. Bookings/payments 2 each -> 0; users preserved at 4; password hash unchanged.
- Image disclosure: 15 licensed destination photos shared across listings in five destinations, with provenance and explicit fictional-accommodation descriptions. Old storage assets retained to avoid deleting potentially shared files.
- Implementer reports passing smoke (2 tests), dry-run, committed DB/image decoding verification, lint, typecheck, Prisma validate, targeted formatting, build and diff check. Controller reviewed status/package diff and demo data documentation. No commits/pushes.

## Controller clarifications after initial blocker

- Scout confirmed no applicable AGENTS.md in project, checked ancestor Projects, or nested docs/prisma/public/src. No scripts directory exists yet. Ordinary source discovery is allowed for implementation; do not discover or read skills and do not spawn agents.
- Property schema stores city/address, not coordinates. Do NOT add coordinate schema fields or migrations. Validate geographic consistency of city/address; optional coordinates in documentation/dataset are not required. All prior coordinate requirements mean city/address consistency where schema permits.
- User.role is a single enum GUEST/HOST/ADMIN. Preserve HOST if present, promote GUEST to HOST. If existing host is ADMIN, stop and report instead of downgrading.
- These clarifications resolve all initial implementer blockers; proceed with actual preflight, implementation and authorized DB operation.
