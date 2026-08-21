# Sugam Seva

Sugam Seva is a mobile-first citizen services platform for managing personal government documents and discovering verified government schemes. Users can upload and store identity documents (Aadhaar, PAN, Passport, etc.), receive personalised scheme recommendations based on their profile, and chat with an AI assistant that answers questions about available schemes.

## Features

### Document Management
- Upload documents via gallery, camera capture, or DigiLocker connection
- OCR-powered document verification using Tesseract.js
- Automatic extraction of personal details (name, DOB, address, ID numbers) from uploaded documents
- Document protection with a 4-digit PIN
- Blur/thumbnail previews for privacy

### Government Scheme Discovery
- Personalised scheme recommendations based on user profile and uploaded documents
- Eligibility assessment engine that evaluates age, income, state, and document requirements
- Detailed scheme pages with benefits, eligibility, required documents, deadlines, and official links
- Multi-language support (English, Hindi, Kannada)
- Filterable scheme catalogue imported from verified government sources

### AI Chat Assistant
- Floating chatbot accessible from any page via a bottom-right FAB button
- Powered by Groq API (Qwen 3.6-27B model with automatic fallback)
- Strictly answers only government scheme-related questions (eligibility, documents, benefits, deadlines, application steps)
- Polite refusal for off-topic questions
- Quick-reply suggestion chips for common questions
- Multi-language responses (English, Hindi, Kannada)

### User Experience
- Indian tricolour accent bar and emerald green design theme
- Responsive mobile-first layout
- Biometric/passkey setup prompt (WebAuthn)
- Profile management with auto-populated fields from OCR
- National anthem player in the footer

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla HTML, CSS, JavaScript (no framework) |
| Backend | Node.js 20+, Express 5 |
| Database | PostgreSQL 14+ |
| OCR | Tesseract.js 5 (client-side) |
| AI Chat | Groq API (Qwen 3.6-27B) |
| Fonts | Google Fonts (Outfit + Inter) |

## Setup

### Prerequisites
- Node.js 20+
- PostgreSQL 14+

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and configure:
   ```env
   PORT=3000
   DATABASE_URL=postgres://user:password@localhost:5432/sugam_seva
   FRONTEND_ORIGIN=http://localhost:3000
   NODE_ENV=development
   GROQ_API_KEY=your_groq_api_key_here
   ```
   The `GROQ_API_KEY` is required for the chatbot. Get a free key at [console.groq.com](https://console.groq.com). The key stays on the server and is never sent to the browser.

3. Create the database tables:
   ```bash
   npm run db:migrate
   ```

4. Import the approved scheme catalogue:
   ```bash
   npm run import:schemes -- ./approved-schemes.json
   ```

5. Start the server:
   ```bash
   npm start
   ```

   Open `http://localhost:3000`.

   For development with auto-reload:
   ```bash
   npm run dev
   ```

## Database Schema

The application uses five tables:

- **users** — Citizen profiles (name, mobile, email, state, district, DOB, income, education, occupation)
- **documents** — Uploaded document metadata (type, verification status, expiry)
- **schemes** — Government scheme catalogue (name, description, benefits, eligibility, application procedure, official URLs)
- **scheme_documents** — Required/optional documents per scheme
- **scheme_eligibility_rules** — JSON eligibility rules per scheme (age, income, state, document requirements)

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/health` | No | Database health check |
| `GET` | `/api/schemes` | No | List all schemes (optional `?scope=central&state=Karnataka` filters) |
| `GET` | `/api/schemes/:id` | No | Get a single scheme with documents and rules |
| `GET` | `/api/schemes/:id/documents` | No | List required documents for a scheme |
| `GET` | `/api/recommendations` | Yes | Personalised scheme recommendations for the user |
| `PUT` | `/api/profile` | Yes | Create or update user profile |
| `POST` | `/api/documents` | Yes | Register document metadata |
| `DELETE` | `/api/documents/:id` | Yes | Remove a document |
| `POST` | `/api/chat` | Yes | Chat with the scheme assistant |

All authenticated endpoints require the `X-User-Id` header.

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

## Scheme Import

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

The importer validates that official URLs use HTTPS and belong to `gov.in` domains. Records are upserted on `id` conflict.

## Project Structure

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
├── .env.example               # Environment template
└── package.json
```

## How It Works

1. **Authentication** — Users create an account with name, mobile, email, and password (stored as a simple hash for this prototype). Sessions are stored in localStorage.

2. **Document Upload** — Users upload identity documents via camera or file picker. Tesseract.js performs client-side OCR to extract personal details, which auto-populate the user profile.

3. **Profile & Recommendations** — The server compares the user's profile (age, income, state, documents) against scheme eligibility rules and returns ranked recommendations.

4. **Scheme Chat** — The floating chatbot sends user questions along with the full scheme catalogue to the Groq API. The system prompt restricts answers to scheme-related topics only.

## Important Notes

- This is a **prototype**. Documents are stored in browser localStorage, not encrypted at rest.
- Recommendations are guidance only — the official government authority makes the final eligibility decision.
- The `X-User-Id` authentication bridge should be replaced with production token/session middleware before deployment.
- The chatbot uses `qwen/qwen3.6-27b` on Groq with automatic fallback to `openai/gpt-oss-120b` and `groq/compound`.
