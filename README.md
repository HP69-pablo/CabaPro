# 🌍 Caba Pro

**Get anything from abroad, delivered by real travelers.**

Caba Pro connects people in Algeria who want products from abroad with travelers who have spare luggage space. Simple, safe, and community-driven.

## Tech Stack

- **Next.js 15** (App Router) + TypeScript
- **Tailwind CSS** + Lucide icons
- **Firebase** (Auth, Firestore, Storage)
- **next-intl** — English, French, Arabic (RTL)

## Features

- 🔐 **Firebase Auth** — Email/password + Google sign-in
- 📦 **Post Requests** — Tell travelers what you need
- ✈️ **Post Trips** — Let people know you have space
- 💬 **Messages** — Chat with matched users
- 🌐 **3 Languages** — EN / FR / AR with full RTL support
- 📱 **Mobile-first** — Responsive design

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/
│   ├── [locale]/
│   │   ├── page.tsx              # Landing page
│   │   ├── (auth)/
│   │   │   ├── login/            # Sign in
│   │   │   └── register/         # Create account
│   │   ├── (marketplace)/
│   │   │   ├── requests/         # Browse & post requests
│   │   │   └── trips/            # Browse & post trips
│   │   └── (dashboard)/
│   │       ├── dashboard/        # My activity
│   │       ├── messages/         # Chat
│   │       └── profile/          # User profile
├── components/
│   └── layout/
│       ├── Navbar.tsx
│       └── LanguageSwitcher.tsx
├── contexts/
│   └── AuthContext.tsx           # Firebase auth state
├── lib/
│   ├── firebase.ts              # Firebase config
│   ├── auth.ts                  # Auth helpers
│   └── firestore.ts             # Firestore CRUD helpers
├── i18n/                        # Internationalization config
└── messages/
    ├── en.json                  # English
    ├── fr.json                  # French
    └── ar.json                  # Arabic
```

## Firebase

Connected to Firebase project: `ai-studio-applet-webapp-17af3`

- **Auth**: Email/password + Google provider
- **Firestore**: Collections: `users`, `requests`, `trips`, `conversations`, `messages`
- **Storage**: User uploads (coming soon)
