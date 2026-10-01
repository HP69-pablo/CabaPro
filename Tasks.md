=====================================================================
CABA PRO - MASTER TASK LIST FOR THE AI AGENT
=====================================================================
Read this entire file before writing any code. Every task is mandatory.
Mark each task [x] only when it works end to end and has tests.
If a task is ambiguous, propose a recommendation and wait for approval.
Do not skip, simplify, or fake anything.

---------------------------------------------------------------------
0. PRODUCT SUMMARY
---------------------------------------------------------------------
Caba Pro is a two-sided marketplace.
- BUYER: someone in Algeria who wants a product from abroad.
- BRINGER: a traveler already coming to Algeria with spare capacity.
- CABA PRO: matches them, lets them negotiate, protects the money,
  tracks delivery, builds trust.
- One account can be both Buyer and Bringer.
- MVP route: France -> Algeria, but NOTHING may be hard-coded to
  France, Algeria, EUR, DZD, or 20 kg. Long-term: Algeria <-> worldwide.

---------------------------------------------------------------------
1. GLOBAL RULES (apply to every task)
---------------------------------------------------------------------
[ ] 1.1  No fake UI. Every button works. No placeholder business logic.
[ ] 1.2  Countries, cities, currencies, categories, fees, limits,
         timers, weights, feature flags are DATABASE-DRIVEN and
         admin-configurable.
[ ] 1.3  All user-facing text comes from next-intl files (en, fr, ar).
         No hard-coded strings in components.
[ ] 1.4  Arabic uses proper RTL (use CSS logical properties).
[ ] 1.5  Money = integer minor units + ISO currency code. Never floats.
[ ] 1.6  No "balance" column as source of truth. Use an append-only
         double-entry ledger; balances are derived.
[ ] 1.7  Every payment/ledger/transfer operation is idempotent
         (idempotency keys).
[ ] 1.8  Transaction status changes ONLY through the central
         TransactionService state machine.
[ ] 1.9  Server-side authorization and ownership checks on every
         endpoint/action.
[ ] 1.10 Every phase ships with unit + integration + e2e tests.
         Do not start the next phase while the current one is broken.
[ ] 1.11 Validate all input with Zod (client and server).
[ ] 1.12 Validate environment variables at startup. No secrets in
         the frontend.
[ ] 1.13 Keep a CLAUDE.md / RULES file in the repo repeating these
         rules so they persist across sessions.
[ ] 1.14 Write a README with setup, env vars, seed, demo, test steps.

---------------------------------------------------------------------
2. TECH STACK
---------------------------------------------------------------------
[ ] 2.1  Next.js (App Router) + TypeScript
[ ] 2.2  Tailwind CSS + shadcn/ui + Lucide icons
[ ] 2.3  PostgreSQL (Neon or Supabase) + Prisma
[ ] 2.4  Auth: Supabase Auth or Auth.js (email/password, Google,
         email verification, phone verification)
[ ] 2.5  Realtime: Supabase Realtime or WebSockets/SSE
[ ] 2.6  Storage: S3-compatible or Supabase Storage (public bucket for
         listing images, PRIVATE bucket for IDs, payment proofs,
         bureau receipts, transfer proofs)
[ ] 2.7  Zod, next-intl, Vitest, Playwright
[ ] 2.8  Error monitoring (e.g., Sentry), structured logging
[ ] 2.9  Background job runner / scheduler (expiry timers, auto-release,
         reminders)

---------------------------------------------------------------------
3. FIRST DELIVERABLE (BEFORE ANY FEATURE CODE) - STOP AND WAIT FOR OK
---------------------------------------------------------------------
[ ] 3.1  Folder structure + module architecture:
         auth, catalog, listings, matching, chat, transactions,
         payments, bureau, ledger, disputes, trust, notifications,
         admin, i18n, storage, jobs.
[ ] 3.2  Full Prisma schema (see section 5).
[ ] 3.3  Transaction state-machine transition table (see section 9).
[ ] 3.4  Ledger account model + example journal entries (section 10).
[ ] 3.5  Recommendations for the open design decisions (section 4).
[ ] 3.6  11-phase plan + "demo-critical" cut (section 22).
[ ] 3.7  WAIT for approval before starting Phase 1.

---------------------------------------------------------------------
4. OPEN DESIGN DECISIONS (propose recommendation, wait for approval)
---------------------------------------------------------------------
[ ] 4.1  WHEN THE BRINGER BUYS THE PRODUCT, WHO FUNDS IT?
         Recommended default with the Bureau method: the bureau wires
         the PRODUCT-PRICE portion (plus optional shipping/tax portion)
         to the bringer BEFORE purchase. The BRINGER FEE and platform
         fees stay in escrow until delivery is confirmed.
         Make the "advance portion" configurable per transaction rule
         (0%-100% of product price) and gated by bringer trust level.
[ ] 4.2  Multi-currency: store an exchange-rate snapshot (rate, source,
         timestamp) on each transaction. Define who bears FX risk and
         bureau conversion margin. Make the rule configurable.
[ ] 4.3  Delivery-code expiry and regeneration (flight delays).
         Auto-release window if the buyer is silent after arrival.
[ ] 4.4  What happens if the bringer receives funds and never buys or
         never travels? (guarantee fund, bringer deposit/collateral,
         ID requirement, advance limits, legal recourse)
[ ] 4.5  What happens if the price in store changes before purchase?
         (top-up request, cancel, partial refund)
[ ] 4.6  Legal/regulatory flags to document for review by a lawyer
         BEFORE real launch: holding customer funds, foreign-currency
         rules in Algeria, customs rules on commercial import and on
         carrying goods for others, bureau licensing, AML/KYC
         obligations. (Document only; do not give legal advice.)

---------------------------------------------------------------------
5. DATABASE (Prisma) - DO NOT REMOVE LEDGER / AUDIT / TRANSACTION
---------------------------------------------------------------------
Design full fields, enums, indexes, relations, constraints for:
[ ] 5.1  User, Session, IdentityVerification, PayoutAccount (encrypted)
[ ] 5.2  Country, City, Currency, ExchangeRate, Category (with rule
         ALLOWED / RESTRICTED / BLOCKED), Setting, FeatureFlag
[ ] 5.3  BuyerRequest, Trip, Match
[ ] 5.4  Offer, Conversation, Message (+ attachments, read receipts)
[ ] 5.5  Transaction, Payment, LedgerAccount, LedgerEntry (append-only),
         Payout
[ ] 5.6  Delivery (hashed code, attempts, expiry), ProofItem,
         HandoverChecklist
[ ] 5.7  Dispute (+ DisputeDecision, DisputeEvidence)
[ ] 5.8  Review (+ sub-ratings), Report, Block, Mute
[ ] 5.9  Notification, AuditLog, ProhibitedKeyword
[ ] 5.10 NEW - BUREAU MODULE ENTITIES:
         - Bureau (name, country, city, address, opening hours, phone,
           status, license/registration info, supported pay-in methods,
           supported pay-out/wire methods, daily limits)
         - BureauStaff (links User to Bureau with role)
         - BureauPaymentReceipt (cash/in-person deposit: amount,
           currency, reference code, payer name, payer ID checked,
           receipt photo, staff who recorded, timestamp)
         - FundsTransfer (outbound money to the bringer: method,
           provider/bank, amount sent, currency, fees, exchange-rate
           snapshot, transfer reference, sender, recipient details
           snapshot, status, proof upload, timestamps)
         - BureauBringerMessage (bureau <-> bringer communication log
           tied to a transaction)
         - BureauSettlement / BureauCashbook (daily reconciliation of
           cash received, funds sent, fees, margin)
[ ] 5.11 Indexes for marketplace filters, matching queries, ledger
         queries, audit queries.
[ ] 5.12 Constraints: capacity >= 0, amounts > 0, unique idempotency
         keys, unique payment references, one active delivery code per
         transaction.
[ ] 5.13 Seed data scripts (section 20).

---------------------------------------------------------------------
6. PHASE 1 - AUTHENTICATION
---------------------------------------------------------------------
[ ] 6.1  Register/login with email + password (hashed, e.g. argon2)
[ ] 6.2  Google login
[ ] 6.3  Email verification flow
[ ] 6.4  Phone verification (OTP) with provider abstraction + demo OTP
[ ] 6.5  Password reset
[ ] 6.6  Secure HTTP-only cookies, CSRF protection, rate limiting,
         brute-force lockout
[ ] 6.7  Roles: USER, MODERATOR, FINANCE, ADMIN, BUREAU_STAFF
         (separate permissions, enforced server-side)
[ ] 6.8  Session management (list/revoke sessions)
[ ] 6.9  Tests for all of the above

---------------------------------------------------------------------
7. PHASE 2 - PROFILES / SETTINGS
---------------------------------------------------------------------
[ ] 7.1  Profile (name, avatar, bio, languages, country, city)
[ ] 7.2  Language switcher (en/fr/ar) + persisted preference
[ ] 7.3  Notification preferences
[ ] 7.4  Identity verification upload (private storage, EXIF removed)
[ ] 7.5  Payout/receiving account setup (encrypted at rest):
         bank account/IBAN, card, other international methods, BaridiMob,
         CCP; for bringers also "funds reception details" used by the
         bureau to wire money
[ ] 7.6  Account deletion/export basics

---------------------------------------------------------------------
8. PHASE 3 - CATALOG + ADMIN SETTINGS DATA
---------------------------------------------------------------------
[ ] 8.1  CRUD for countries, cities, currencies, exchange rates
[ ] 8.2  Categories with ALLOWED / RESTRICTED / BLOCKED rules
[ ] 8.3  Prohibited keyword blocklist management
         (blocked examples: weapons, drugs, controlled/prescription
         medication, cash/financial instruments, counterfeit goods,
         alcohol, hazardous materials)
[ ] 8.4  Settings store: fees, limits, timers, matching weights,
         feature flags, advance-payment rules, bureau rules
[ ] 8.5  Exchange-rate fetch/manual entry with history

---------------------------------------------------------------------
8B. PHASE 4 - BUYER REQUESTS + BRINGER TRIPS
---------------------------------------------------------------------
BUYER REQUEST
[ ] 8B.1 Fields: product name, description, URL, store name, images,
         source country/city, destination country/city, quantity,
         estimated weight, optional dimensions, estimated price,
         currency, max budget, preferred delivery fee, fee negotiable,
         required delivery date, condition, purchase method,
         delivery preference
[ ] 8B.2 Create, edit, cancel, duplicate, browse
[ ] 8B.3 Category + keyword check; suspicious -> MODERATION queue
         (not public until approved); BLOCKED -> rejected with reason
[ ] 8B.4 Image upload validation, EXIF removal, malware scan hook
TRIP
[ ] 8B.5 Fields: origin/destination country+city, departure and arrival
         date/time, transport method, total capacity, max items,
         accepted categories, delivery areas, door delivery flag,
         can-buy-in-store flag, notes
[ ] 8B.6 Create, edit, cancel, duplicate, browse
[ ] 8B.7 Capacity tracking: total - reserved = remaining
         (e.g., 20 kg with 3+5+2 reserved shows 10 kg remaining)
MARKETPLACE
[ ] 8B.8 Two feeds (Requests, Trips) with filters: country, city, date,
         weight, category, verified users, sort. Pagination.
[ ] 8B.9 Detail pages for requests and trips

---------------------------------------------------------------------
9. PHASE 5 - MATCHING + CAPACITY
---------------------------------------------------------------------
[ ] 9.1  Rule-based matching (NO AI). Hard requirements: destination
         compatible, arrival before deadline, enough remaining
         capacity, compatible origin, category allowed, both active,
         buyer != bringer.
[ ] 9.2  Score (weights configurable in admin; defaults): origin city 20,
         arrival date 20, capacity headroom 15, destination/delivery
         area 15, category preference 10, bringer trust 15,
         can buy in store 5.
[ ] 9.3  Match explanation UI, e.g.:
         92% Match: Paris -> Algiers / Arrives 8 days before deadline /
         12 kg remaining / Verified bringer / Can purchase in store
[ ] 9.4  Auto-match on listing create/update + background recompute
[ ] 9.5  Match notifications to both sides
[ ] 9.6  Concurrency-safe capacity reservation (row locks or
         serializable transaction). Test with parallel requests.
[ ] 9.7  Release capacity on cancel/expire/refund.

---------------------------------------------------------------------
10. PHASE 6 - CHAT + OFFERS (NEGOTIATION)
---------------------------------------------------------------------
[ ] 10.1 Real-time chat: text, images, read indicators, system messages
[ ] 10.2 Structured Offers: product price, bringer fee, currency,
         pickup/delivery details, expiration
[ ] 10.3 Accept / Reject / Counter; offer history; expiry job
[ ] 10.4 Accepting an offer creates the Transaction (via the service)
[ ] 10.5 Platform/guarantee fees shown transparently on the offer
[ ] 10.6 Report, block, mute
[ ] 10.7 Contact protection BEFORE payment: detect/mask phone numbers,
         emails, external social links, "WhatsApp me" patterns
[ ] 10.8 Controlled contact sharing AFTER payment (feature flag)
[ ] 10.9 Rate limiting and spam protection on messages

---------------------------------------------------------------------
11. PHASE 7 - TRANSACTIONS + ESCROW + PAYMENTS
---------------------------------------------------------------------
STATE MACHINE (one central TransactionService)
Main flow:
 AGREED > AWAITING_PAYMENT > PAYMENT_UNDER_REVIEW > PAID >
 PURCHASING > PURCHASED > HANDED_OVER > IN_TRANSIT > ARRIVED >
 DELIVERED > CONFIRMED > COMPLETED
Exceptions: CANCELLED, EXPIRED, DISPUTED, REFUNDED, PARTIALLY_REFUNDED
Bureau-flow additions (propose exact placement in the table):
 AWAITING_BUREAU_PAYMENT, BUREAU_PAYMENT_RECEIVED,
 FUNDS_TRANSFER_PENDING, FUNDS_SENT_TO_BRINGER,
 FUNDS_CONFIRMED_BY_BRINGER, PRODUCT_PROOF_REVIEW (buyer reviews
 photos/receipt before handover/transit)
[ ] 11.1 Transition table: from, to, allowed actor, guards, side effects
[ ] 11.2 Every transition: (1) validate, (2) check permission,
         (3) update state, (4) write AuditLog, (5) create system chat
         event, (6) send notifications
[ ] 11.3 Lint/test rule that fails if status is updated outside the
         service
[ ] 11.4 Expiry timers (e.g., unpaid -> EXPIRED) via scheduler
[ ] 11.5 PaymentProvider interface with implementations:
         - DemoProvider (instant simulated verification)
         - BaridiMob (manual: buyer uploads screenshot, transfer
           reference, sender name; Finance verifies/rejects)
         - CCP (same process)
         - BUREAU provider (section 12)
         - Stub for a future real gateway (no changes to the
           transaction system required)
[ ] 11.6 Duplicate reference / reused screenshot detection
[ ] 11.7 Price breakdown: product price, bringer fee, platform fee,
         guarantee fee, bureau fee, FX margin, total, currency
[ ] 11.8 Cancellation rules and refund paths before/after payment

LEDGER (append-only, double-entry)
[ ] 11.9  Accounts: External, Escrow, Bringer Available, Bringer
          Pending, Platform Revenue, Guarantee Fund, Bureau Cash,
          Bureau Float, Transfer Fees, FX Margin, Refunds, Payouts
[ ] 11.10 Journal entries for: payment received, advance funds sent to
          bringer, completion split (bringer / revenue / guarantee),
          refund, partial refund, dispute split, payout
[ ] 11.11 Derived balances only; reconciliation check job that proves
          sum of entries per transaction balances to zero
[ ] 11.12 No updates/deletes on ledger rows (DB-level protection)

---------------------------------------------------------------------
12. NEW - BUREAU PAYMENT METHOD (CABA PARTNER BUREAU IN ALGERIA)
---------------------------------------------------------------------
CONCEPT: a physical bureau/office in Algeria receives money from the
buyer, communicates with the bringer, and wires money to the bringer
through international methods (bank transfer, cards, etc.). Once the
bringer receives the funds, buys the product, and sends pictures to
the buyer, the normal flow continues.

END-TO-END BUREAU FLOW
 1. Buyer and bringer agree (offer accepted) -> transaction AGREED.
 2. Buyer selects "Pay at Bureau" and picks a bureau (city, address,
    hours shown).
 3. System generates a unique BUREAU PAYMENT CODE + QR and a payment
    slip (amount in local currency, deadline, instructions).
 4. Buyer visits the bureau and pays (cash or in-person method).
 5. Bureau staff opens the Bureau Panel, finds the transaction by code,
    checks buyer ID, records the amount, uploads a receipt photo.
 6. System verifies amount vs expected; mismatch -> flagged to Finance.
 7. Payment is recorded in the LEDGER: External -> Escrow
    (and Bureau Cash accounting entry). Transaction -> PAID.
 8. Bureau initiates the international transfer to the bringer
    (bank wire, card payment/top-up, or other configured method) for
    the ADVANCE portion (product price [+ taxes/shipping], per
    decision 4.1). Bringer fee + platform fees stay in escrow.
 9. Bureau records: method, amount, currency, fees, FX snapshot,
    transfer reference, proof (screenshot/receipt).
10. Bringer is notified, confirms funds received (or reports a problem).
    Transaction -> FUNDS_CONFIRMED_BY_BRINGER -> PURCHASING.
11. Bringer buys the product, uploads receipt + product photo +
    packaging photo (+ optional video).
12. Buyer reviews the photos in chat/transaction page and approves
    (or requests changes/cancels with defined rules).
13. Flow continues: handover checklist -> IN_TRANSIT -> ARRIVED ->
    delivery code -> DELIVERED -> escrow release -> payout.
[ ] 12.1  Bureau CRUD in admin (create bureau, staff, limits, methods,
          opening hours, active/suspended)
[ ] 12.2  BUREAU_STAFF role + Bureau Panel (restricted: only their
          bureau's transactions)
[ ] 12.3  Payment code + QR generation, expiry, regeneration, lookup
[ ] 12.4  Bureau receives-payment screen: ID check checkbox, amount
          entry, receipt upload, notes, confirm
[ ] 12.5  Amount mismatch handling (under/over payment, top-up,
          partial payment, refund-at-bureau)
[ ] 12.6  Outbound transfer module (FundsTransfer): configurable
          methods (international bank wire, card, other), per-method
          fee and FX rule, proof upload, status tracking
          (PENDING, SENT, CONFIRMED, FAILED, RETURNED)
[ ] 12.7  Bringer confirmation screen "I received the funds"
          with amount/currency; dispute path if wrong/missing
[ ] 12.8  Bureau <-> bringer communication channel tied to the
          transaction (in-app messages with log; also visible to
          Finance/Moderator; contact masking rules apply)
[ ] 12.9  Bureau <-> buyer communication (status updates, receipt)
[ ] 12.10 Product proof flow: bringer uploads receipt + photos after
          purchase; buyer gets notification and can APPROVE / ASK
          QUESTION / REPORT MISMATCH; define timeout behavior
[ ] 12.11 Bureau daily reconciliation report (cash in, transfers out,
          fees, FX margin, open items) + Finance approval of closing
[ ] 12.12 Dual-control: large transfers need Finance approval
          (configurable threshold)
[ ] 12.13 Anti-fraud: bringer verification level required to receive
          advances, max advance per trust level, advance blocked for
          UNVERIFIED users, velocity limits, blacklist checks
[ ] 12.14 If the bringer never buys/travels: recovery workflow,
          guarantee fund use, account suspension, evidence package
[ ] 12.15 If store price changes: top-up request or partial refund flow
[ ] 12.16 Full audit trail for every bureau action
[ ] 12.17 Demo Mode simulation of the entire bureau flow (simulated
          bureau staff, simulated wire, instant confirmations) and a
          real manual mode for the live pilot
[ ] 12.18 i18n for all bureau screens, receipts, and notifications
[ ] 12.19 Printable payment slip/receipt (PDF) in en/fr/ar

---------------------------------------------------------------------
13. PHASE 8 - DELIVERY + SAFETY + DISPUTES
---------------------------------------------------------------------
DELIVERY CODE
[ ] 13.1 6-digit code generated after payment/escrow, shown to buyer
[ ] 13.2 Stored HASHED (salt/pepper), single-use, expiring, attempt
         limits + lockout, never retrievable in plaintext
[ ] 13.3 Regeneration flow (flight delay), logged; QR option later
[ ] 13.4 Bringer enters code -> DELIVERED
SAFE HANDOVER (bringer must be able to inspect what they carry)
[ ] 13.5 Checklist: item matches listing, correct model/quantity,
         packaging checked, contents inspected by bringer, no
         prohibited/restricted item, photos taken, receipt/purchase
         proof uploaded, buyer confirmation, bringer confirmation
[ ] 13.6 Bringer-purchased items: receipt + product photo + packaging
         photo required
[ ] 13.7 UI warns against carrying unknown sealed packages
[ ] 13.8 Handover cannot complete until checklist is complete
         (enforced by the state machine guard)
[ ] 13.9 Proof items stored privately, EXIF stripped
DISPUTES
[ ] 13.10 Reasons: not delivered, damaged, wrong product, not as
          described, late, payment issue, safety concern, other
[ ] 13.11 Opening a dispute freezes payout and auto-release
[ ] 13.12 Moderator view: chat, transaction history, ledger, photos,
          receipts, bureau receipts + transfer proofs, handover
          checklist, delivery code events, audit history
[ ] 13.13 Decisions: full refund, partial refund, release to bringer,
          split. Each decision creates ledger entries + audit log.
[ ] 13.14 Safety report button on transaction page

---------------------------------------------------------------------
14. PHASE 9 - REVIEWS + TRUST + NOTIFICATIONS
---------------------------------------------------------------------
[ ] 14.1 Two-sided reviews after COMPLETED: 1-5 stars + optional
         sub-ratings (communication, punctuality, packaging/care,
         accuracy); blind-reveal rules (visible after both submit or
         after window)
[ ] 14.2 Trust profile: rating, completed transactions, cancellation
         rate, verification level, reviews, delivery history
[ ] 14.3 Verification levels UNVERIFIED > CONTACT_VERIFIED >
         ID_VERIFIED > TRUSTED with configurable limits
         (unverified cannot transact; higher levels = higher limits;
         trusted = priority visibility)
[ ] 14.4 Trust feeds the matching score
[ ] 14.5 Notifications: in-app + email (+ push/SMS hooks), templates in
         en/fr/ar, per-user preferences
[ ] 14.6 Notification triggers for every state transition, match, offer,
         bureau event, transfer event, dispute event

---------------------------------------------------------------------
15. PHASE 10 - ADMIN PANEL (/admin)
---------------------------------------------------------------------
[ ] 15.1 Separate permissions: Admin, Moderator, Finance, Bureau Staff
[ ] 15.2 Dashboard: active transactions, revenue, open disputes,
         pending payments, pending verifications, active trips,
         active requests, guarantee fund, bureau cash position,
         pending transfers
[ ] 15.3 Finance: review payment proofs, verify/reject, manage payouts,
         approve large bureau transfers, reconciliation, ledger viewer
[ ] 15.4 Moderation: review listings, reports, suspended users, banned
         users, keyword management
[ ] 15.5 Disputes: full timeline, evidence, chat, decision form
[ ] 15.6 Verification review queue (ID documents, private access,
         audited views)
[ ] 15.7 Settings: fees, limits, countries, cities, currencies,
         categories, matching weights, timers, bureau rules, advance
         rules, feature flags
[ ] 15.8 Every admin action is audited

---------------------------------------------------------------------
16. USER INTERFACE
---------------------------------------------------------------------
LANDING PAGE
[ ] 16.1 Hero: "Get what you need from anywhere in the world.
         Someone is already coming."
[ ] 16.2 Two CTAs: "I need something" / "I'm traveling with space"
[ ] 16.3 How it works: Post, Match, Agree, Deliver, Confirm
[ ] 16.4 Sections: Escrow, Verified users, Safe Handover, Caba
         Guarantee, Pay at a Caba Bureau
DASHBOARD
[ ] 16.5 Tabs: Dashboard, My Requests, My Trips, Transactions,
         Messages, Wallet, Profile
[ ] 16.6 Wallet: derived balances from ledger, history, payout request
[ ] 16.7 Transaction page: current status, progress stepper, next
         action, price breakdown, payment status, bureau info/code,
         evidence/proofs, product photos, delivery code, handover
         checklist, timeline, chat, dispute button, safety report
[ ] 16.8 Responsive/mobile-first, accessible, loading/error/empty
         states everywhere, en/fr/ar with RTL

---------------------------------------------------------------------
17. SECURITY
---------------------------------------------------------------------
[ ] 17.1 Password hashing, secure HTTP-only cookies, CSRF, rate limits
[ ] 17.2 Upload validation (type, size, magic bytes), malware scan hook
[ ] 17.3 EXIF/location data stripped from all uploaded images
[ ] 17.4 Private storage + signed URLs for IDs, receipts, transfer proofs
[ ] 17.5 Encryption at rest for payout/receiving account data
[ ] 17.6 Server-side authorization and ownership checks everywhere
[ ] 17.7 Idempotency for payment/ledger/transfer operations
[ ] 17.8 Audit log for sensitive actions; admin/bureau action logging
[ ] 17.9 Database backups + restore test; error monitoring
[ ] 17.10 Security tests: IDOR, privilege escalation, replay,
          double-submit, race conditions on capacity and payments
[ ] 17.11 Bureau-staff abuse controls: limited visibility, action
          logs, anomaly alerts

---------------------------------------------------------------------
18. INTERNATIONALIZATION
---------------------------------------------------------------------
[ ] 18.1 English, French, Arabic from day one (next-intl)
[ ] 18.2 Arabic RTL everywhere (layout, icons, forms, tables)
[ ] 18.3 Localized dates, numbers, currency formatting
[ ] 18.4 All emails/notifications/PDFs/receipts localized
[ ] 18.5 Lint/test that detects hard-coded UI strings

---------------------------------------------------------------------
19. TESTING
---------------------------------------------------------------------
[ ] 19.1 Vitest unit tests: state machine (every valid/invalid
         transition), ledger balancing, matching scores, capacity,
         delivery code hashing, contact masking, bureau amount checks
[ ] 19.2 Integration tests: auth, listings, offers -> transaction,
         payments, bureau flow, disputes
[ ] 19.3 Concurrency tests: parallel capacity reservations,
         duplicate payment submissions
[ ] 19.4 Playwright e2e: full demo loop (section 21) incl. bureau path
[ ] 19.5 RTL/Arabic visual checks, mobile viewport checks
[ ] 19.6 CI pipeline running lint, type-check, tests

---------------------------------------------------------------------
20. SEED DATA + DEMO MODE
---------------------------------------------------------------------
[ ] 20.1 Demo accounts: buyers, bringers, admin, finance, moderator,
         bureau staff
[ ] 20.2 Realistic listings: Paris->Algiers, Marseille->Oran,
         Lyon->Algiers, Istanbul->Algiers (requests + trips)
[ ] 20.3 Demo Mode: simulated instant payments (card/BaridiMob/CCP),
         simulated bureau + wire, time fast-forward controls for
         expiry/auto-release/arrival
[ ] 20.4 Demo reset button (restore seed state without DB edits)
[ ] 20.5 Everything runs with no manual database editing

---------------------------------------------------------------------
21. DEMO SCRIPT (MUST WORK END TO END)
---------------------------------------------------------------------
 1. Create Buyer account
 2. Post "I need this product from France"
 3. Create Bringer account
 4. Post "Paris -> Algiers, 15 kg available"
 5. Caba Pro auto-detects match (with explanation)
 6. Buyer and Bringer chat
 7. Bringer sends offer
 8. Buyer counters
 9. They agree
10. Transaction created
11. Buyer pays: (a) simulated BaridiMob/CCP OR (b) Bureau method:
    buyer gets code -> bureau staff records cash -> bureau wires
    funds to bringer -> bringer confirms receipt
12. Payment becomes escrowed
13. Bringer buys product, uploads receipt + product photos;
    buyer reviews and approves
14. Handover checklist completed
15. Trip/transaction becomes IN_TRANSIT
16. Bringer arrives in Algeria
17. Buyer provides delivery code
18. Delivery confirmed
19. Escrow releases (bringer / revenue / guarantee fund)
20. Bringer requests payout
21. Both users review each other

---------------------------------------------------------------------
22. BUILD ORDER (DO NOT SKIP OR REORDER)
---------------------------------------------------------------------
PHASE 1  Authentication
PHASE 2  Profiles / settings
PHASE 3  Countries, cities, currencies, categories, settings
PHASE 4  Buyer Requests + Bringer Trips
PHASE 5  Matching + capacity
PHASE 6  Chat + offers
PHASE 7  Transactions + escrow + payments (incl. Bureau module, sec. 12)
PHASE 8  Delivery + safety + disputes
PHASE 9  Reviews + trust + notifications
PHASE 10 Admin panel
PHASE 11 UI polish + performance + testing + demo mode
DEMO-CRITICAL CUT: a thin vertical slice of every step in section 21
first (Demo provider + simulated bureau), then deepen each phase.

---------------------------------------------------------------------
23. DEFINITION OF DONE (per phase)
---------------------------------------------------------------------
[ ] All tasks in the phase work in the real UI, no dead buttons
[ ] Tests written and passing (unit + integration + e2e where relevant)
[ ] en/fr/ar strings complete, RTL verified
[ ] Authorization/ownership checks verified
[ ] Audit logs and notifications fire as specified
[ ] No hard-coded countries/currencies/limits
[ ] Docs/README updated, migration + seed work from a clean database
[ ] Summary report to the owner: what was built, what is left,
    risks found, decisions needing approval

---------------------------------------------------------------------
24. FINAL REMINDERS
---------------------------------------------------------------------
- Do not fake UI. Do not use placeholder business logic.
- Do not skip the database architecture, ledger, or audit log.
- Do not edit transaction status outside the central service.
- Do not store money as floats or as a mutable balance.
- Do not hard-code France, Algeria, EUR, DZD, or 20 kg.
- Flag legal/regulatory risks (funds holding, foreign currency, customs,
  bureau licensing, KYC/AML) in the docs; do not ignore them.
- Build the foundation correctly so the demo can become a real product.
=====================================================================