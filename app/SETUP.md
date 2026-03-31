# App Setup

## 1. Firebase Project

1. Go to [console.firebase.google.com](https://console.firebase.google.com) and create a project
2. Add a **Web App** to the project
3. Copy the `firebaseConfig` values
4. Enable **Firestore Database** (start in production mode — you'll paste the rules below)
5. Enable **Authentication → Anonymous** sign-in

## 2. Firestore Security Rules

Paste these rules in Firestore → Rules. They match what you already have:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.time < timestamp.date(2026, 4, 30);
    }
  }
}
```

> These expire April 30, 2026. For a longer-lived app, write proper per-document rules.

## 3. Environment Variables

```bash
cp .env.example .env
```

Fill in your Firebase values in `.env`:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

## 4. Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173` on your phone (must be on the same WiFi network, use your machine's local IP).

## 5. Deploy (Optional)

For play on the cruise without needing a local server, deploy to Firebase Hosting:

```bash
npm install -g firebase-tools
firebase login
firebase init hosting   # set public dir to "dist"
npm run build
firebase deploy
```

## How to Play on the Cruise

1. Host opens the app on their phone and taps **Host a Game**
2. Each player opens the app on their own phone and taps **Join a Game**
3. Players enter the 4-letter code shown on the host's screen
4. Once everyone has joined, host taps **Set Sail**
5. Each player privately views their role on their own phone
6. Follow the in-app prompts each day and evening

The app handles:
- Role & character assignment (randomised)
- Suspicious behavior card assignment
- Evening dinner voting (live tallies)
- Traitor murder submission (private)
- Win condition detection
- Game over reveal

The app does NOT handle:
- Moderating dinner conversation (that's the host's job)
- Enforcing the Ghost Whisper / Locked Room rules (verbal, host arbitrates)
- Character ability activations (tell the host; they confirm in the app if needed)
