# Interests Feature — Integration Guide

Files added:

| File | Purpose |
|------|---------|
| `backend/db/migrations/001_interests.sql` | Creates `interests` + `user_interests`, seeds 12 subjects |
| `backend/routes/interests.js` | Express router for interest APIs |
| `mobile/screens/InterestSelectionScreen.js` | Select / remove interests UI |
| `mobile/screens/StudyGroupMatchesScreen.js` | Shared-interest matches list |

---

## 1. Database

```bash
psql "$DATABASE_URL" -f backend/db/migrations/001_interests.sql
```

Requires an existing `users` table (see `backend/db/schema.sql`).

---

## 2. Backend dependencies

```bash
cd backend
npm install pg
```

Ensure `.env` (or environment) has:

```
DATABASE_URL=postgres://USER:PASSWORD@HOST:5432/DB_NAME
JWT_SECRET=your-secret-key-change-in-production
```

---

## 3. Wire the router in `server.js`

```js
const { Pool } = require('pg');
const createInterestsRouter = require('./routes/interests');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// After your existing verifyToken middleware is defined:
app.use('/api/interests', createInterestsRouter(pool, verifyToken));
```

`verifyToken` must set `req.user.id` (your current JWT middleware already does this).

### Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/interests/all` | No | Catalog of interests |
| GET | `/api/interests/my-interests` | Yes | Current user's selections |
| POST | `/api/interests/add` | Yes | Body: `{ "interestId": "<uuid>" }` |
| DELETE | `/api/interests/remove/:interestId` | Yes | Remove selection |
| GET | `/api/interests/find-matches` | Yes | Peers sorted by shared count |

---

## 4. React Native navigation

```js
import InterestSelectionScreen from './screens/InterestSelectionScreen';
import StudyGroupMatchesScreen from './screens/StudyGroupMatchesScreen';

// Inside your stack navigator:
<Stack.Screen name="InterestSelection">
  {(props) => (
    <InterestSelectionScreen
      {...props}
      apiBaseUrl="http://YOUR_LAN_IP:5000"
      token={authToken}
    />
  )}
</Stack.Screen>

<Stack.Screen name="StudyGroupMatches" component={StudyGroupMatchesScreen} />

{/* Profile screen must accept route.params.userId — View Profile only, no message box */}
<Stack.Screen name="Profile" component={YourProfileScreen} />
```

On a physical device, use your computer’s LAN IP (not `localhost`).

Android emulator often needs `http://10.0.2.2:5000`.

---

## 5. Behaviour checklist

- [ ] Available interest disappears when tapped
- [ ] Appears under **Your Selected Interests** as a navy card with yellow **×**
- [ ] Removing restores it to Available
- [ ] **Find Study Groups** only shows when at least one interest is selected
- [ ] Matches screen shows avatar/initials, name, shared count, interest tags
- [ ] **View Profile** navigates to profile — no “write a message” / connection text input

---

## Note about this repo

The GitHub project on Desktop is currently a **React + Vite web** app with an **in-memory** Express backend. These new files target your stated stack (**React Native + PostgreSQL**).

- Keep the RN screens under `mobile/screens/` (or copy into your RN app).
- If you stay on the Vite web frontend instead, say so and we can port these screens to React web pages.
