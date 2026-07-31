# Backend Setup & Running

## Prerequisites
- Node.js v14+
- npm or yarn

## Installation

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install
```

## Running the Server

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication
- **POST** `/api/auth/register` - Register a new user
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "student"
  }
  ```

- **POST** `/api/auth/login` - Login user
  ```json
  {
    "email": "john@example.com",
    "password": "password123"
  }
  ```

### Dashboard
- **GET** `/api/dashboard/summary` - Get dashboard stats (requires auth)
- **GET** `/api/activity?limit=3` - Get recent activity (requires auth)

### Units
- **GET** `/api/units` - Get all available units (requires auth)
- **POST** `/api/units/enroll` - Enroll in a unit (requires auth)

### Matching
- **GET** `/api/match` - Get matched peers (requires auth)
- **POST** `/api/invite` - Invite peer to group (requires auth)

### Groups
- **GET** `/api/groups` - Get user's groups (requires auth)

### Admin (admin only)
- **GET** `/api/admin/users` - Get all users
- **GET** `/api/admin/groups` - Get all groups
- **GET** `/api/admin/stats` - Get platform statistics

## Authentication

All protected endpoints require:
```
Authorization: Bearer <JWT_TOKEN>
```

The JWT token is returned from `/api/auth/login` or `/api/auth/register`.

## Environment Variables

Create a `.env` file in the backend directory:

```
PORT=5000
JWT_SECRET=your-secret-key-change-in-production
```

## Notes

- Currently uses in-memory storage (data will be lost on server restart)
- For production, replace with a real database (PostgreSQL, MongoDB, etc.)
- Add proper input validation and error handling
- Implement rate limiting for security
- Add HTTPS in production
