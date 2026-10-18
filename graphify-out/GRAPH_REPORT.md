# Graph Report - docs (2026-09-28)

## Corpus Check

- Corpus is ~20,944 words - fits in a single context window. You may not need a graph.

## Summary

- 40 nodes · 34 edges · 10 communities (7 shown, 3 thin omitted)
- Extraction: 82% EXTRACTED · 18% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)

- Domain Data Model
- Roles and Setup
- Payment APIs
- API Rules
- Task Tracks
- Booking Business
- UI Design
- Architecture Modules
- Authentication
- Prisma Database

## God Nodes (most connected - your core abstractions)

1. `Booking` - 6 edges
2. `StayHub System Overview` - 5 edges
3. `Property` - 4 edges
4. `API Design` - 3 edges
5. `VNPay Verification Rules` - 3 edges
6. `Next.js API Standards` - 3 edges
7. `StayHub Task List` - 3 edges
8. `Fullstack Next.js Stack` - 2 edges
9. `Booking API Endpoints` - 2 edges
10. `VNPay IPN Endpoint` - 2 edges

## Surprising Connections (you probably didn't know these)

- `High-level Modules` --semantically_similar_to--> `Database Domain Model` [INFERRED] [semantically similar]
  architecture/1_SystemOverview.md → database/1_DomainOverview.md
- `ApiResponse<T>` --semantically_similar_to--> `Next.js API Standards` [INFERRED] [semantically similar]
  architecture/2_TechStack.md → contributors/Rules.md
- `VNPay Payment Gateway` --conceptually_related_to--> `VNPay Verification Rules` [INFERRED]
  architecture/1_SystemOverview.md → database/8_Payment.md
- `Contributor Setup Guide` --conceptually_related_to--> `Fullstack Next.js Stack` [INFERRED]
  contributors/FirstStep.md → architecture/2_TechStack.md
- `API Design` --cites--> `Next.js API Standards` [EXTRACTED]
  architecture/3_API_Design.md → contributors/Rules.md

## Hyperedges (group relationships)

- **Guest Booking Payment Review Flow** — docs_architecture_1_systemoverview_guest, docs_database_1_domainoverview_booking, docs_database_1_domainoverview_payment, docs_database_1_domainoverview_review [EXTRACTED 1.00]
- **Core Database Relationship Model** — docs_database_1_domainoverview_user, docs_database_1_domainoverview_property, docs_database_1_domainoverview_booking, docs_database_1_domainoverview_payment, docs_database_1_domainoverview_review [EXTRACTED 1.00]
- **Delivery Tracks** — docs_tasklist_tasklist_infra_track, docs_tasklist_tasklist_backend_track, docs_tasklist_tasklist_frontend_track [EXTRACTED 1.00]

## Communities (10 total, 3 thin omitted)

### Community 0 - "Domain Data Model"

Cohesion: 0.22
Nodes (10): Discount Validation Flow, Booking, DiscountCode, Property, Review, User, Property Amenities, Property Images (+2 more)

### Community 1 - "Roles and Setup"

Cohesion: 0.33
Nodes (6): Admin, Guest, Host, StayHub System Overview, Fullstack Next.js Stack, Contributor Setup Guide

### Community 2 - "Payment APIs"

Cohesion: 0.33
Nodes (6): VNPay Payment Gateway, API Design, Booking API Endpoints, VNPay IPN Endpoint, Payment, VNPay Verification Rules

### Community 3 - "API Rules"

Cohesion: 0.50
Nodes (4): ApiResponse<T>, Next.js API Standards, Project Rules and Conventions, Route Protection

### Community 4 - "Task Tracks"

Cohesion: 0.50
Nodes (4): Backend Track, Frontend Track, Infra Track, StayHub Task List

### Community 5 - "Booking Business"

Cohesion: 0.67
Nodes (3): Booking Lifecycle, StayHub Business Overview, Transaction-based Commission Model

### Community 6 - "UI Design"

Cohesion: 0.67
Nodes (3): Application Design References, UI/UX Design System, Responsive Grid System

## Knowledge Gaps

- **23 isolated node(s):** `Guest`, `Host`, `Admin`, `VNPay Payment Gateway`, `High-level Modules` (+18 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 23 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions

_Questions this graph is uniquely positioned to answer:_

- **Why does `API Design` connect `Payment APIs` to `Roles and Setup`, `API Rules`?**
  _High betweenness centrality (0.235) - this node is a cross-community bridge._
- **Why does `Booking` connect `Domain Data Model` to `Payment APIs`?**
  _High betweenness centrality (0.232) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `VNPay Verification Rules` (e.g. with `VNPay Payment Gateway` and `VNPay IPN Endpoint`) actually correct?**
  _`VNPay Verification Rules` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Guest`, `Host`, `Admin` to the rest of the system?**
  _23 weakly-connected nodes found - possible documentation gaps or missing edges._
