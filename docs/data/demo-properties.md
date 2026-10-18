# Demo property replacement

This opt-in utility permanently replaces **all properties, bookings, payments and
reviews** in the configured demo database. It is not an application DELETE route
and must never be used against production. No schema migration is involved.

```sh
# Node 24+, dependencies installed with pnpm; .env is never printed
node --env-file=.env scripts/reset-demo-properties.mjs
# Only after reviewing dry-run counts and confirming the database is demo:
node --env-file=.env scripts/reset-demo-properties.mjs --execute --confirm=DELETE_ALL_DEMO_PROPERTIES
```

The default is read-only. Both confirmation arguments are required for execution.
All dependency deletes, host promotion/activation and inserts use one serializable
transaction. Unexpected incoming foreign keys abort execution. Existing host
passwords are preserved; an ADMIN host causes an abort rather than downgrade.
Users, amenities, discount codes (including historical usage counters) and
verification tokens are preserved. Each invocation deliberately creates fresh
property IDs; execution is destructive, not a routine seed operation.

Twenty fictional listings span Ninh Bình, Đà Nẵng, Hội An, Đà Lạt and Hạ Long, with
four accommodation concepts per destination. Prices are illustrative VND/night.
Addresses identify plausible destination areas, not verified physical properties.
There are no schema coordinate fields and no coordinates or migrations are added.
Descriptions explicitly disclose that these are fictional demo accommodations and
that photographs illustrate destinations, not accommodation interiors or views.

## Images and attribution

Fifteen locally stored destination photographs provide three distinct photos for
each listing (60 image references; photos are shared by listings in the same city).
`public/demo-properties/provenance.json` records author, original Commons file
page, license/link, modifications, download URL and SHA-256 for every file. Each
listing description includes plain-text attribution in gallery order. Derivative
images retain the recorded CC BY, CC BY-SA or CC0 terms; no license to the images
is implied by the application's code license.

`node scripts/prepare-demo-images.mjs` downloads permitted Wikimedia Commons
images and records provenance. Search results must be reviewed before import;
title filtering is only a relevance guard, not location verification. Do not run
this preparation step casually after a reset: it overwrites shared local files.
The importer checks all 60 references, hashes, provenance, dimensions and actual
JPEG decoding **before any destructive database action**.

Old local/Cloudinary assets are deliberately not deleted: database ownership
alone does not prove they are unshared. Their database image rows are removed;
storage orphans require a separately authorized inventory/cleanup.

## Isolated smoke

```sh
node --test scripts/demo-properties.smoke.mjs
```

Node's native test runner receives exactly this file, without suite expansion.
Tests cover a valid dataset, duplicate rejection and destructive consent guards.
Database and image integration checks are performed by the dry-run/importer, not
mocked production behavior.
