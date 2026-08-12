# StudyMatch — Interest Selection Feature

Complete interest selection + study-group matching for **web (React)** and **mobile (React Native)**.

## What you get

| Layer | Files |
|-------|--------|
| SQL | `backend/db/migrations/001_interests.sql` |
| API | `backend/routes/interests.js` (+ local JSON fallback in `server.js`) |
| Web pages | `src/pages/InterestSelection.jsx`, `src/pages/StudyGroupMatches.jsx` |
| Web components | `src/components/InterestCard.jsx`, `src/components/UserCard.jsx` |
| Web hook / theme | `src/hooks/useInterests.js`, `src/styles/theme.js` |
| Mobile screens | `mobile/screens/InterestSelectionScreen.js`, `StudyGroupMatchesScreen.js` |
| Mobile components | `mobile/components/InterestButton.js`, `MatchCard.js` |

### API endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/interests/all` | No | Catalog with icons |
| GET | `/api/interests/my-interests` | Yes | Current user’s selections |
| POST | `/api/interests/add` | Yes | Body: `{ "interestId": 1 }` |
| DELETE | `/api/interests/remove/:interestId` | Yes | Remove selection |
| GET | `/api/interests/find-matches` | Yes | Peers sorted by shared count |

---

## Environment variables

```bash
# Backend
PORT=5000
JWT_SECRET=your-secret-key-change-in-production

# Optional — enables PostgreSQL interests router
DATABASE_URL=postgres://USER:PASSWORD@HOST:5432/DB_NAME
```

Without `DATABASE_URL`, the backend uses the local file database at `backend/db/data/studymatch.json` (great for demos).

---

## Database setup (PostgreSQL)

1. Ensure `users` exists (`backend/db/schema.sql`).
2. Run the migration:

```bash
psql "$DATABASE_URL" -f backend/db/migrations/001_interests.sql
```

Note: `interests.id` is `SERIAL`. `user_interests.user_id` is `UUID` to match this project’s `users.id`.

---

## Run the webpage

```bash
# Terminal 1 — API
cd backend
npm install
node server.js

# Terminal 2 — Vite React app
cd ..
npm install
npm run dev
```

Open http://localhost:3000

1. Sign in: `maya@example.com` / `password123`
2. Dashboard → **Choose study interests**
3. Select subjects → **Find Study Groups**
4. **View Profile** opens `/peers/:id` (no messaging)

Routes:
- `/interests` — selection
- `/study-matches` — matches

---

## Run / integrate the mobile app

These screens live under `mobile/` and are meant to be imported into your Expo or React Native app.

```bash
cd mobile
npm install
```

Install peer deps in your RN app if needed:
- `axios`
- `@react-native-async-storage/async-storage`
- React Navigation

Example stack screens:

```jsx
import InterestSelectionScreen from './screens/InterestSelectionScreen';
import StudyGroupMatchesScreen from './screens/StudyGroupMatchesScreen';

<Stack.Screen name="InterestSelection">
  {(props) => (
    <InterestSelectionScreen
      {...props}
      apiBaseUrl="http://YOUR_LAN_IP:5000"
      token={authToken}
      userName={user.name}
    />
  )}
</Stack.Screen>

<Stack.Screen name="StudyGroupMatches" component={StudyGroupMatchesScreen} />
```

Use your computer’s LAN IP on a physical phone (not `localhost`).

---

## Design

Student-built navy / yellow theme:

- Primary `#1a3a52`
- Accent `#ffc107`
- Background `#f5f5f5`
- Cards white, 12px radius, light shadows
- Poppins on web interest pages

---

## Design notes for contributors

- Matches only expose **View Profile** (no chat / request fields).
- Web uses Axios + CSS modules.
- Mobile caches the last interest catalog in AsyncStorage for snappier reloads.
