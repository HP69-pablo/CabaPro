# Caba Pro (كابا برو)

> **Two-sided travel delivery marketplace** connecting **Buyers** (people in Algeria who want a product from abroad) with **Bringers** (travelers heading to Algeria with spare luggage/car capacity). Caba Pro matches them, enables transparent negotiation, holds payments in escrow, tracks safe delivery, and builds verifiable trust.

---

## 🚀 Tech Stack

- **Framework**: Next.js 15 (App Router) + TypeScript + React 19
- **Styling & UI**: Tailwind CSS + shadcn/ui token system + Lucide Icons
- **Database & ORM**: PostgreSQL (Neon / Supabase) + Prisma ORM
- **Authentication**: Custom session management with Argon2id / Bcrypt password hashing, secure HTTP-only cookies, and Phone OTP abstraction (`DemoPhoneOtpProvider`)
- **Accounting**: Double-entry append-only immutable ledger (`LedgerAccount` & `LedgerEntry`), derived balances only
- **Internationalization**: `next-intl` (English, French, Arabic with bidirectional RTL layout using logical CSS properties)
- **Testing**: Vitest (unit & integration) + Playwright (e2e)
- **Security**: AES-256-GCM encrypted payout details at rest, HMAC-SHA256 salted delivery codes with server pepper, EXIF location stripping from images

---

## 📋 Non-Negotiable Architectural Rules

1. **Zero Fake UI**: Every button, modal, toggle, and status change is backed by real business logic.
2. **Database-Driven Configuration**: Countries, cities, currencies (EUR/DZD), category rules, capacity limits, platform fees, matching weights, and timers are 100% database-driven and admin-configurable.
3. **Integer Minor-Unit Money**: All monetary values are strictly positive integers in minor units (e.g. cents/centimes) with ISO currency codes. Never floating point numbers.
4. **Append-Only Double-Entry Ledger**: No mutable `balance` column as a source of truth. All user wallets and platform revenues are derived on-the-fly (`SUM(debits) - SUM(credits)`). All entries use unique `idempotencyKey` constraints.
5. **Central State Machine**: Transaction status updates can ONLY occur through `TransactionService.transition(...)`, which enforces 6 mandatory steps in an ACID transaction:
   1. Transition matrix validation
   2. Actor permission verification
   3. Domain guards evaluation (delivery code salted hash, safe handover checklist)
   4. State mutation
   5. AuditLog record
   6. System chat message & multi-channel notifications
6. **Payment Provider Abstraction**: Pluggable interface supporting `DemoPaymentProvider` (simulated instant payments), `BaridiMobPaymentProvider` / `CcpPaymentProvider` (manual receipt audit by Finance), and `BureauPaymentProvider` (physical cash intake in Algeria).
7. **Concurrency-Safe Capacity**: Luggage capacity (`remainingCapacity = total - reserved`) is reserved atomically using database locks.
8. **Salted 6-Digit Delivery Code**: Generated upon escrow funding, shown only to the buyer, and stored strictly as a salted HMAC-SHA256 hash. Never retrievable in plaintext.

---

## 🛠️ Project Setup & Installation

### 1. Prerequisites
- **Node.js**: v20 or v22
- **npm**: v10+

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Key environment variables:
- `DATABASE_URL`: PostgreSQL connection string (Neon, Supabase, or local)
- `AUTH_SECRET`: Secret key for session tokens (min 32 characters)
- `ENCRYPTION_KEY`: 32-character AES-256-GCM key for encrypting payout data at rest
- `DELIVERY_CODE_PEPPER`: Secret cryptographic pepper for delivery code hashing (min 16 characters)
- `DEMO_MODE`: Set to `true` to enable instant payments, 1-click login accounts, and fast-forward controls.

### 4. Database Initialization & Seed
```bash
npx prisma generate
npx prisma db push
npm run prisma:seed
```

---

## 🧪 Testing

Run the Vitest test suites (State Machine, Ledger Invariants, Matching Engine, Crypto, Contact Masking, Authentication):
```bash
npm test
```

Build the Next.js production bundle:
```bash
npm run build
```

---

## 🎮 The 21-Step Demo Script Walkthrough

Caba Pro includes a built-in **Demo Mode Dock** (at the bottom-right corner) with 1-click account switching and time fast-forwarding controls:

1. **Step 1**: Register or 1-click login as Buyer (`buyer.amine@cabapro.com`).
2. **Step 2**: Post a Buyer Request: "Sony WH-1000XM5 Wireless Headphones" (Paris → Algiers, 0.85 kg, 280 EUR price, 40 EUR fee).
3. **Step 3**: Switch to Bringer (`bringer.yacine@cabapro.com`).
4. **Step 4**: Post an upcoming Trip: Paris → Algiers (Air France, 15 kg capacity).
5. **Step 5**: The rule-based Matching Engine auto-detects a **95% match** with human-readable explanation checklist.
6. **Step 6**: Buyer and Bringer chat in real-time (phone numbers/emails masked before payment).
7. **Step 7**: Bringer sends a structured offer (280 EUR product + 40 EUR fee + transparent platform fees).
8. **Step 8**: Buyer counters or accepts.
9. **Step 9**: Offer is agreed (`AGREED` state).
10. **Step 10**: Transaction created with locked exchange-rate snapshot (1 EUR = 240 DZD).
11. **Step 11**: Buyer pays:
    - *Option A*: Instant simulated Demo payment.
    - *Option B*: Caba Bureau method (Buyer obtains code `BPR-2026-ALG-089` → Bureau Staff records 78,624 DZD cash → Bureau wires 280 EUR advance to Bringer).
12. **Step 12**: Funds locked in **Escrow** (`PAID` state). 6-digit delivery code generated (`849201`).
13. **Step 13**: Bringer buys headphones at Fnac Paris, uploads receipt & product box photos. Buyer reviews and approves.
14. **Step 14**: Bringer and Buyer complete the **Safe Handover Checklist** (no prohibited items verified).
15. **Step 15**: Transaction shifts to `IN_TRANSIT`.
16. **Step 16**: Bringer lands in Algiers (`ARRIVED`). Buyer views their secret 6-digit code.
17. **Step 17**: Buyer physically meets Bringer, inspects the box, and gives the code `849201`.
18. **Step 18**: Bringer inputs code → verified against salted hash → state becomes `DELIVERED`.
19. **Step 19**: Escrow completion split executes in ledger: 40.00 EUR credited to Bringer Available balance + 2.00 EUR Platform fee + 5.60 EUR Guarantee fund.
20. **Step 20**: Bringer requests payout to their encrypted BaridiMob / IBAN account.
21. **Step 21**: Both users submit mutual 5-star reviews with sub-ratings.

---

## ⚖️ Legal & Regulatory Documentation

Before public live commercial launch in Algeria, the following legal areas must be formally reviewed by a qualified Algerian legal counsel:
1. **Holding Customer Funds**: Fiduciary regulations regarding escrow holding and consumer fund protection.
2. **Foreign Currency Regulations**: Algerian foreign-exchange laws governing payments in foreign currency vs. local Dinars.
3. **Customs & Import Limits**: Personal baggage exemptions vs. commercial import limits (carrying goods on behalf of third parties).
4. **Physical Bureau Licensing**: Commercial bureau/agency registration requirements for cash collection and international wire facilitation.
5. **AML & KYC Compliance**: Biometric ID verification thresholds, anti-money laundering reporting, and transaction velocity caps.
