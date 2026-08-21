<div align="center">

<!-- Animated typing header -->
<img src="https://readme-typing-svg.demolab.com?font=Outfit&size=32&duration=3000&pause=1000&color=138808&center=true&vCenter=true&width=600&lines=Sugam+Seva;सुगम+सेवा;ಸುಗಮ+ಸೇವಾ;Citizen+Services%2C+Simplified" alt="Sugam Seva animated title" />

### 🇮🇳 A mobile-first citizen services platform for government documents & scheme discovery

<!-- Status / stack badges -->
<p>
  <img src="https://img.shields.io/badge/status-prototype-orange?style=for-the-badge" alt="status" />
  <img src="https://img.shields.io/badge/license-MIT-blue?style=for-the-badge" alt="license" />
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen?style=for-the-badge" alt="PRs welcome" />
</p>

<p>
  <img src="https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express-5-000000?style=flat-square&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/PostgreSQL-14+-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Tesseract.js-5-4285F4?style=flat-square&logo=google&logoColor=white" alt="Tesseract.js" />
  <img src="https://img.shields.io/badge/Groq_API-Qwen_3.6--27B-F55036?style=flat-square&logo=lightning&logoColor=white" alt="Groq API" />
  <img src="https://img.shields.io/badge/HTML%2FCSS%2FJS-Vanilla-E34F26?style=flat-square&logo=html5&logoColor=white" alt="Vanilla JS" />
</p>

<p>
  <img src="https://img.shields.io/badge/🇬🇧_English-supported-emerald?style=flat-square" alt="English" />
  <img src="https://img.shields.io/badge/🇮🇳_हिन्दी-supported-emerald?style=flat-square" alt="Hindi" />
  <img src="https://img.shields.io/badge/🇮🇳_ಕನ್ನಡ-supported-emerald?style=flat-square" alt="Kannada" />
</p>

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#️-tech-stack)
- [Setup](#-setup)
- [Database Schema](#️-database-schema)
- [API Endpoints](#-api-endpoints)
- [Scheme Import](#-scheme-import)
- [Project Structure](#-project-structure)
- [How It Works](#-how-it-works)
- [Important Notes](#️-important-notes)

---

## 🌐 Overview

**Sugam Seva** (सुगम सेवा — "easy service") helps citizens manage personal government documents and discover verified government schemes they're actually eligible for. Users can upload identity documents (Aadhaar, PAN, Passport, etc.), get personalised scheme recommendations, and chat with an AI assistant trained to answer scheme-related questions only.

---

## ✨ Features

### 📄 Document Management
- Upload documents via gallery, camera capture, or DigiLocker connection
- OCR-powered document verification using Tesseract.js
- Automatic extraction of personal details (name, DOB, address, ID numbers) from uploaded documents
- Document protection with a 4-digit PIN
- Blur/thumbnail previews for privacy

### 🏛️ Government Scheme Discovery
- Personalised scheme recommendations based on user profile and uploaded documents
- Eligibility assessment engine that evaluates age, income, state, and document requirements
- Detailed scheme pages with benefits, eligibility, required documents, deadlines, and official links
- Multi-language support (English, Hindi, Kannada)
- Filterable scheme catalogue imported from verified government sources

### 🤖 AI Chat Assistant
- Floating chatbot accessible from any page via a bottom-right FAB button
- Powered by Groq API (Qwen 3.6-27B model with automatic fallback)
- Strictly answers only government scheme-related questions (eligibility, documents, benefits, deadlines, application steps)
- Polite refusal for off-topic questions
- Quick-reply suggestion chips for common questions
- Multi-language responses (English, Hindi, Kannada)

### 🎨 User Experience
- Indian tricolour accent bar and emerald green design theme
- Responsive mobile-first layout
- Biometric/passkey setup prompt (WebAuthn)
- Profile management with auto-populated fields from OCR
- National anthem player in the footer

---

## 🛠️ Tech Stack

<div align="center">

| Layer | Technology | |
|-------|-----------|---|
| **Frontend** | Vanilla HTML, CSS, JavaScript (no framework) | ![HTML5](https://img.shields.io/badge/-HTML5-E34F26?style=flat-square&logo=html5&logoColor=white) ![CSS3](https://img.shields.io/badge/-CSS3-1572B6?style=flat-square&logo=css3&logoColor=white) ![JavaScript](https://img.shields.io/badge/-JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black) |
| **Backend** | Node.js 20+, Express 5 | ![Node.js](https://img.shields.io/badge/-Node.js-339933?style=flat-square&logo=node.js&logoColor=white) ![Express](https://img.shields.io/badge/-Express-000000?style=flat-square&logo=express&logoColor=white) |
| **Database** | PostgreSQL 14+ | ![PostgreSQL](https://img.shields.io/badge/-PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white) |
| **OCR** | Tesseract.js 5 (client-side) | ![Tesseract](https://img.shields.io/badge/-Tesseract.js-4285F4?style=flat-square&logo=google&logoColor=white) |
| **AI Chat** | Groq API (Qwen 3.6-27B) | ![Groq](https://img.shields.io/badge/-Groq-F55036?style=flat-square&logo=lightning&logoColor=white) |
| **Fonts** | Google Fonts (Outfit + Inter) | ![Google Fonts](https://img.shields.io/badge/-Google_Fonts-4285F4?style=flat-square&logo=googlefonts&logoColor=white) |

</div>

---

## 🚀 Setup

### Prerequisites

![Node](https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-4169E1?style=flat-square&logo=postgresql&logoColor=white)

### Installation

**1. Install dependencies**
```bash
npm install
```

**2. Copy `.env.example` to `.env` and configure:**
```env
PORT=3000
DATABASE_URL=postgres://user:password@localhost:5432/sugam_seva
FRONTEND_ORIGIN=http://localhost:3000
NODE_ENV=development
GROQ_API_KEY=your_groq_api_key_here
```
> 💡 The `GROQ_API_KEY` is required for the chatbot. Get a free key at [console.groq.com](https://console.groq.com). The key stays on the server and is never sent to the browser.

**3. Create the database tables**
```bash
npm run db:migrate
```

**4. Import the approved scheme catalogue**
```bash
npm run import:schemes -- ./approved-schemes.json
```

**5. Start the server**
```bash
npm start
```
Open **`http://localhost:3000`**

For development with auto-reload:
```bash
npm run dev
```

---

## 🗄️ Database Schema

The application uses five tables:

| Table | Description |
|-------|-------------|
| `users` | Citizen profiles (name, mobile, email, state, district, DOB, income, education, occupation) |
| `documents` | Uploaded document metadata (type, verification status, expiry) |
| `schemes` | Government scheme catalogue (name, description, benefits, eligibility, application procedure, official URLs) |
| `scheme_documents` | Required/optional documents per scheme |
| `scheme_eligibility_rules` | JSON eligibility rules per scheme (age, income, state, document requirements) |

---

## 🔌 API Endpoints

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| `GET` | `/api/health` | ❌ | Database health check |
| `GET` | `/api/schemes` | ❌ | List all schemes (optional `?scope=central&state=Karnataka` filters) |
| `GET` | `/api/schemes/:id` | ❌ | Get a single scheme with documents and rules |
| `GET` | `/api/schemes/:id/documents` | ❌ | List required documents for a scheme |
| `GET` | `/api/recommendations` | ✅ | Personalised scheme recommendations for the user |
| `PUT` | `/api/profile` | ✅ | Create or update user profile |
| `POST` | `/api/documents` | ✅ | Register document metadata |
| `DELETE` | `/api/documents/:id` | ✅ | Remove a document |
| `POST` | `/api/chat` | ✅ | Chat with the scheme assistant |

> All authenticated endpoints require the `X-User-Id` header.

### Chat Request

```json
POST /api/chat
{
  "message": "What is PM-KISAN?",
  "language": "en",
  "history": []
}
```

**Response:**
```json
{
  "answer": "PM-KISAN is a central government scheme...",
  "language": "en"
}
```

The `history` field accepts an optional array of previous `{ role, content }` messages for conversation context (last 8 messages).

---

## 📥 Scheme Import

Import only verified myScheme exports or officially provided integration payloads:

```bash
npm run import:schemes -- ./path/to/approved-myscheme-export.json
```

The input must be either an array or an object with a `schemes` array. Each record must contain:

```json
{
  "id": "stable-official-id",
  "name": "Official scheme name",
  "shortDescription": "Short description",
  "description": "Full description",
  "benefits": "Official benefits",
  "scope": "central",
  "state": null,
  "eligibilityHighlight": "Basic eligibility",
  "eligibilityDetails": "Detailed eligibility",
  "whoCanApply": "Applicant description",
  "ageMin": null,
  "ageMax": null,
  "incomeMax": null,
  "educationRequirements": null,
  "locationRequirements": null,
  "applicationProcedure": "How to apply",
  "deadline": null,
  "officialApplicationUrl": "https://example.gov.in/apply",
  "officialSourceUrl": "https://example.gov.in/scheme",
  "lastUpdated": "2026-01-01",
  "documents": [{ "name": "Aadhaar Card", "required": true }],
  "rules": {
    "requiredDocuments": ["Aadhaar Card"],
    "states": []
  }
}
```

> ⚠️ The importer validates that official URLs use HTTPS and belong to `gov.in` domains. Records are upserted on `id` conflict.

---

## 📁 Project Structure

```
├── index.html                 # Single-page application shell
├── css/
│   └── styles.css             # Full design system (CSS custom properties, responsive)
├── js/
│   └── app.js                 # Client-side application logic (routing, auth, documents, chat)
├── server/
│   ├── index.js               # Express API server
│   ├── db.js                  # PostgreSQL connection pool
│   ├── schema.sql             # Database migration
│   ├── migrate.js             # Migration runner
│   └── import-schemes.js      # Scheme catalogue importer
├── approved-schemes.json      # Seed data (10 government schemes)
├── .env.example                # Environment template
└── package.json
```

---

## ⚙️ How It Works

```mermaid
flowchart LR
    A[👤 User Signs Up] --> B[📸 Upload Documents]
    B --> C[🔍 Client-side OCR<br/>Tesseract.js]
    C --> D[📝 Auto-fill Profile]
    D --> E[🎯 Eligibility Engine]
    E --> F[📋 Ranked Scheme<br/>Recommendations]
    D --> G[💬 AI Chat Assistant]
    G --> H[⚡ Groq API<br/>Qwen 3.6-27B]
    H --> F
```

1. **Authentication** — Users create an account with name, mobile, email, and password (stored as a simple hash for this prototype). Sessions are stored in localStorage.
2. **Document Upload** — Users upload identity documents via camera or file picker. Tesseract.js performs client-side OCR to extract personal details, which auto-populate the user profile.
3. **Profile & Recommendations** — The server compares the user's profile (age, income, state, documents) against scheme eligibility rules and returns ranked recommendations.
4. **Scheme Chat** — The floating chatbot sends user questions along with the full scheme catalogue to the Groq API. The system prompt restricts answers to scheme-related topics only.

---

## ⚠️ Important Notes

> - This is a **prototype**. Documents are stored in browser localStorage, not encrypted at rest.
> - Recommendations are guidance only — the official government authority makes the final eligibility decision.
> - The `X-User-Id` authentication bridge should be replaced with production token/session middleware before deployment.
> - The chatbot uses `qwen/qwen3.6-27b` on Groq with automatic fallback to `openai/gpt-oss-120b` and `groq/compound`.

---

<div align="center">

Made with 💚🤍🧡 for citizens of 🇮🇳

</div>