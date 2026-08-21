# Sugam Seva

Sugam Seva is a mobile-first prototype for citizen documents and verified government scheme discovery.

## Backend setup

Prerequisites: Node.js 20+ and PostgreSQL 14+.

1. Install dependencies:

   ```powershell
   npm install
   ```

2. Create a PostgreSQL database and copy `.env.example` to `.env`. Set `DATABASE_URL` to the database connection string. Never put this file or database credentials in frontend code.

3. Create the tables:

   ```powershell
   npm run db:migrate
   ```

4. Start the application server:

   ```powershell
   npm start
   ```

   Open `http://localhost:3000`.

The browser uses the existing local sign-in session as the current prototype identity and sends only its user id in `X-User-Id`. Replace this bridge with the production authentication token/session middleware before deployment.

## Approved scheme import

The application does not invent a myScheme API endpoint or present synthetic records as government benefits. When the backend is unavailable, the browser shows three clearly labelled demo schemes so the discovery and application-draft flow can be tried locally. Import only an approved myScheme export or officially provided integration payload for real scheme data:

```powershell
npm run import:schemes -- .\path\to\approved-myscheme-export.json
```

The input must be either an array or an object with a `schemes` array. Each record must contain the fields below. The importer rejects missing provenance, non-HTTPS links, and non-`gov.in` official URLs.

```json
{
  "schemes": [
    {
      "id": "stable-official-id",
      "name": "Official scheme name",
      "shortDescription": "Short official description",
      "description": "Complete official description",
      "benefits": "Official benefits",
      "scope": "central",
      "state": null,
      "eligibilityHighlight": "Basic official eligibility highlight",
      "eligibilityDetails": "Detailed official eligibility",
      "whoCanApply": "Official applicant description",
      "ageMin": null,
      "ageMax": null,
      "incomeMax": null,
      "educationRequirements": null,
      "locationRequirements": null,
      "applicationProcedure": "Official procedure",
      "deadline": null,
      "officialApplicationUrl": "https://example.gov.in/apply",
      "officialSourceUrl": "https://example.gov.in/scheme",
      "lastUpdated": "2026-08-20",
      "documents": [{ "name": "Aadhaar Card", "required": true }],
      "rules": {
        "requiredDocuments": ["Aadhaar Card"],
        "states": []
      }
    }
  ]
}
```

## API

- `GET /api/schemes`
- `GET /api/schemes/:id`
- `GET /api/recommendations` with `X-User-Id`
- `GET /api/schemes/:id/documents`
- `PUT /api/profile` with `X-User-Id`
- `POST /api/documents` with `X-User-Id` (metadata only)
- `DELETE /api/documents/:id` with `X-User-Id`
- `GET /api/health`

Recommendations never claim official eligibility. The engine evaluates only explicit imported rules and returns `May Be Eligible`; the government scheme authority remains the final decision-maker.
