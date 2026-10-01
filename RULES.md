# CABA PRO - NON-NEGOTIABLE ARCHITECTURAL RULES

These rules govern every task, phase, module, component, and test in Caba Pro. Do not bypass or simplify any of these rules.

## 1. Zero Fake UI
- Every button, dropdown, modal, toggle, and link must be backed by real business logic and real handlers.
- No dead click handlers (`onClick={() => {}}`), placeholder toasts without backing mutations, or mockup pages.

## 2. Dynamic, Database-Driven Configuration
- Never hard-code countries, cities, currencies (e.g. EUR, DZD), weights (e.g. 20 kg), capacity limits, fees, exchange rates, timers, or matching weights in application code or UI components.
- All values must come from the database via Catalog and Setting services and be admin-configurable.

## 3. Strict Internationalization & RTL
- All user-facing text must be defined in next-intl translation dictionaries (`messages/en.json`, `messages/fr.json`, `messages/ar.json`).
- Zero hard-coded UI strings in JSX/TSX.
- Arabic layout must use standard CSS logical properties (`ms-`, `me-`, `ps-`, `pe-`, `start-0`, `end-0`) for full RTL compatibility.

## 4. Integer Minor-Unit Money & Double-Entry Ledger
- Money is represented strictly as integer minor units (e.g., 2500 for 25.00 EUR or 250000 for 2500.00 DZD) plus an ISO-4217 currency code. Never use floating-point numbers for currency.
- No mutable `balance` column as a source of truth. All account and wallet balances are derived from the append-only double-entry `LedgerEntry` table (`SUM(debits) - SUM(credits)`).
- Every financial and ledger operation must be idempotent, backed by a unique `idempotencyKey`.

## 5. Single State Machine via TransactionService
- Transaction status can ONLY change through `TransactionService.transition(transactionId, targetStatus, actor, payload)`.
- Every transition must execute all 6 mandatory steps in an ACID transaction:
  1. Validate transition against the finite transition matrix.
  2. Verify actor authorization & permissions.
  3. Evaluate domain guards (e.g. checklist complete, proofs present, delivery code matches).
  4. Mutate state with timestamp.
  5. Create immutable `AuditLog` entry.
  6. Dispatch system chat message and user notifications.
- No other code, endpoint, or service is permitted to update `Transaction.status`.

## 6. Payment Provider Abstraction
- Payment operations must implement the `PaymentProvider` interface.
- Implementations: `DemoProvider` (instant simulated verification), `BaridiMobProvider`, `CCPProvider` (manual screenshot + reference verification by Finance), and `BureauProvider`.
- A real payment gateway must be addable by implementing the interface without modifying the core transaction engine.

## 7. Concurrency-Safe Capacity Reservations
- Trip capacity (`remainingCapacity = totalCapacity - reservedCapacity`) must be guarded by row-level locking (`SELECT ... FOR UPDATE`) or serializable transactions.
- Two concurrent buyers can never oversubscribe a bringer's remaining weight or item limit.

## 8. Cryptographically Secure Delivery Codes
- The 6-digit delivery code is generated after payment confirmation and displayed exclusively to the Buyer.
- The code is stored in the database ONLY as a salted hash (Argon2id or HMAC-SHA256 with server pepper).
- Single-use, expiring, attempt-limited (max 5 attempts before lockout), and never retrievable in plaintext.

## 9. Security & Privacy
- Password hashing using Argon2id / bcrypt.
- Secure, HTTP-only, SameSite cookies for sessions.
- CSRF protection and rate limiting on all public and authenticated endpoints.
- All user inputs validated with Zod on both client and server.
- File uploads validated by file signature/magic bytes and size.
- EXIF metadata (especially GPS location) must be stripped from all uploaded images.
- Sensitive files (ID documents, payment slips, bank transfer proofs) stored in a private bucket accessible only via short-lived signed URLs.
- Payout details (IBAN, card, BaridiMob details) encrypted at rest (AES-256-GCM).
- Strict server-side ownership checks on every query and mutation.
- Environment variables validated at startup; zero secrets leaked to the client bundle.

## 10. Phased Delivery & Testing
- Work must proceed through the 11 defined phases without skipping.
- Every phase must include unit, integration, and e2e tests where applicable.
- Do not proceed to the next phase until the current phase's tests pass and definition of done is met.
