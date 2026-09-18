# Studyspace mobile

React Native CLI app with native `android/` and `ios/` projects (no Expo dependency).
It connects to the same FastAPI backend as the web workspace.

## Features

- Text and photo problem solving, hints before answers, and saved solution history.
- Generate flashcards from notes; browse decks, reveal/rate due cards, edit cards,
  and delete decks with confirmation.
- Progress by reporting period, practice accuracy, flashcard recall, and activity.
- Saved backend URL with an optional in-memory bearer token. No AI provider keys
  belong in this app. Tokens must be entered again after restarting the app.

## Run

Use Node 22.13+, 24.3+, or 26+. Install dependencies:

```sh
cd mobile
npm ci
npm start
```

In another terminal, `cd mobile` and run `npm run android` or `npm run ios`.
Android requires JDK 17, Android SDK platform/build tools 37, and an emulator/device.
iOS requires full Xcode, CocoaPods, and the tools described by React Native:
https://reactnative.dev/docs/set-up-your-environment
Run `bundle install` from mobile, then `bundle exec pod install` from mobile/ios.

Start the FastAPI backend as described in `../docs/workspace-setup.md`.
Android emulator default: `http://10.0.2.2:8000/api`; iOS simulator default:
`http://localhost:8000/api`. Use Connection to change it. A physical device needs a
reachable backend address. Release builds accept HTTPS URLs only. The existing
backend still defaults to shared-demo authentication; complete production auth
before deploying it publicly. Local API key configuration stays on the backend.

Generation and reviews need a network connection. Offline failures show a retryable
error; decks are not cached for offline review. This initial mobile app does not
include sign-up, camera capture, library uploads, or the web practice exercise UI.
The photo button opens the platform photo library.

## Checks

```sh
npm run typecheck
npm run lint
npm test -- --runInBand
cd android
./gradlew assembleDebug
```

Android debug compilation has passed locally. App/API interaction tests use mocked
responses; they do not establish live Gemini correctness. iOS compilation and
physical-device testing still need to be performed. The template's debug signing
configuration is for development only; configure your own release signing for stores.
