# Sugam Seva Citizen App

Sugam Seva is an Expo and React Native citizen-services prototype. It helps citizens discover government schemes, review eligibility, prepare applications, track application progress, manage documents, and access a voice-assistant style help flow.

## Features

- Home dashboard with recommended schemes and benefit summaries
- Scheme discovery by category and text search
- Scheme details with benefits, eligibility criteria, and required documents
- Guided application review flow with a progress stepper
- Application status and timeline tracking
- DigiLocker-style document list with verification status
- Profile and settings surface
- Voice assistant modal with suggested citizen queries
- English, Hindi, and Kannada translations
- Responsive Expo support for Android, iOS, and web

## Tech Stack

- Expo SDK 54
- React 19
- React Native 0.81
- TypeScript
- `@expo/vector-icons`

## Getting Started

### Prerequisites

- Node.js and npm
- Expo-compatible Android or iOS device/emulator, or a browser for web preview

### Install and run

```bash
npm install
npm start
```

From the Expo developer menu, choose Android, iOS, or web. The package scripts can also be used directly:

```bash
npm run android
npm run ios
npm run web
```

## Implementation Process

1. **Define the domain model**
   `src/types/index.ts` defines the shared types for users, schemes, documents, applications, categories, languages, and application statuses.

2. **Create the initial citizen data layer**
   `src/data/mockData.ts` provides representative user, document, scheme, and application records. This keeps the prototype usable without a backend while preserving a clear replacement point for API integration.

3. **Centralize app state and navigation**
   `src/navigation/NavigationContext.tsx` stores the active tab, screen stack, selected scheme parameters, search query, category filter, language, and voice-assistant visibility. `App.tsx` renders the active screen and shared header, bottom navigation, and assistant modal.

4. **Build reusable interface components**
   Shared pieces such as `AppHeader`, `BottomNavigation`, `CategoryCard`, `SchemeCard`, `DocumentCard`, `ProgressStepper`, `Timeline`, and `PrimaryButton` keep repeated visual and interaction patterns consistent.

5. **Implement the main citizen journeys**
   The screens cover the home dashboard, scheme discovery, scheme details, application review, tracking, profile, and document storage. Screen transitions use the navigation context instead of a separate navigation dependency, which keeps the prototype flow lightweight.

6. **Add localization and accessibility-friendly actions**
   `src/translations/translations.ts` contains localized labels and messages. Interactive controls use familiar icons and accessibility labels where appropriate, while the language selector updates the shared translation state.

7. **Connect the application flow**
   A citizen opens a scheme, reviews eligibility and documents, enters the application review screen, submits the prototype application, and is directed to the tracking screen. The timeline and stepper communicate the current status.

## Project Structure

```text
App.tsx                         App shell and screen orchestrator
src/components/                 Reusable UI components
src/constants/                  Shared design tokens
src/data/                       Prototype data
src/navigation/                 Navigation and app-level state
src/screens/                    Feature screens and assistant modal
src/translations/               Localized copy
src/types/                      TypeScript domain models
```

## Current Prototype Scope

The current version uses mock data and local state. Authentication, production API calls, real DigiLocker authorization, voice recognition, server-side eligibility checks, document uploads, notifications, and persistent application submission still need to be integrated for production use.

## License

This project includes the license distributed with the Expo starter project. Review `LICENSE` before redistributing the application.