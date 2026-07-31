# Smart Study Group Finder Platform

A modern web application that helps students find and create study groups based on shared courses, schedules, and learning goals.

## 🎯 Project Overview

StudyMatch is a collaborative platform that connects students who share the same courses and study interests. The app uses intelligent matching algorithms to pair peers, facilitate group coordination, and streamline schedule management for productive study sessions.

## ✨ Features

### Frontend (React + Vite)
- **Landing Page**: Hero section with CTA buttons and feature highlights
- **Authentication**: Secure login and registration with JWT token management
- **Dashboard**: Overview of groups, matched peers, enrolled units, and recent activity
- **Peer Matching**: Review classmates who share enrolled units and choose Match or Pass for each peer
- **Unit Enrollment**: Browse available courses and enroll in the classes you choose
- **Notes Library**: Upload, download, and delete your own course notes
- **Responsive Navbar**: Navigation bar with mobile hamburger menu
- **Modern UI**: Tailwind CSS styling with blue and white color scheme

### Backend (Node.js + Express)
- RESTful API endpoints for authentication, groups, matches, units, and notes
- JWT-based authentication
- User and group management
- Unit enrollment tracking
- Explicit peer Match/Pass decisions
- Authenticated local note uploads and downloads
- Activity logging

## 🛠️ Tech Stack

### Frontend
- **React 18.3.1** - UI library
- **Vite 5.4** - Build tool and dev server
- **React Router v6** - Client-side routing
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **Node.js** - Runtime environment

### Backend
- **Node.js** - Server runtime
- **Express** (planned) - Web framework
- **SQL** - Database (schema included)

## 📁 Project Structure

```
smart-study-group-finder-platform/
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LandingPage.js
│   │   │   ├── RegisterPage.js
│   │   │   ├── LoginPage.js
│   │   │   ├── Dashboard.js
│   │   │   └── MatchPage.js
│   │   ├── components/
│   │   │   ├── Navbar.js
│   │   │   └── UnitBadge.js
│   │   ├── context/
│   │   │   └── AuthContext.js
│   │   ├── index.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
├── backend/
│   └── db/
│       ├── schema.sql
│       └── sample_data.sql
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js v24.18.0+
- npm 11.16.0+

### Frontend Setup

1. **Navigate to project root:**
   ```bash
   cd smart-study-group-finder-platform
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   - Navigate to `http://localhost:3000`

### Build for Production
```bash
npm run build
npm run preview
```

## 📋 Routes

| Route | Component | Protected | Description |
|-------|-----------|-----------|-------------|
| `/` | LandingPage | No | Landing page with feature highlights |
| `/register` | RegisterPage | No | User registration form |
| `/login` | LoginPage | No | User login form |
| `/dashboard` | Dashboard | Yes | User dashboard with groups and stats |
| `/groups` | GroupsPage | Yes | User's study groups |
| `/groups/:id` | GroupDetailPage | Yes | Detailed group view |
| `/match` | MatchPage | Yes | Review and choose peer matches |
| `/notes` | NotesPage | Yes | Personal notes upload and library |
| `/schedule` | SchedulePage | Yes | Schedule management |
| `/admin` | AdminDashboard | Yes (Admin only) | Admin panel |

## 🔌 API Endpoints (Backend)

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user and get JWT token

### Dashboard
- `GET /api/dashboard/summary` - Get dashboard statistics
- `GET /api/activity?limit=3` - Get recent activity

### Units
- `GET /api/units` - Get all available units
- `POST /api/units/enroll` - Enroll in a unit

### Matching
- `GET /api/match` - Get undecided peers sharing enrolled units
- `GET /api/match/confirmed` - Get peers the current user chose to match with
- `POST /api/match/decide` - Save a Match or Pass decision
- `POST /api/invite` - Invite a confirmed peer to a joined group

### Groups
- `GET /api/groups` - Get user's groups
- `GET /api/groups/discoverable` - Browse available study groups
- `POST /api/groups/:id/join` - Join a study group

### Notes
- `GET /api/notes` - List the current user's uploaded notes
- `POST /api/notes` - Upload a PDF, Word, Markdown, or text note
- `GET /api/notes/:id/download` - Download an owned note
- `DELETE /api/notes/:id` - Delete an owned note

## 🔐 Authentication

The app uses JWT (JSON Web Tokens) for authentication:

1. **Registration**: User signs up with email and password
2. **Login**: User receives JWT token
3. **Storage**: Token is stored in localStorage
4. **Usage**: Token is sent in `Authorization: Bearer <token>` header for all protected requests
5. **Session Restoration**: Token is checked on app load to restore user session

## 👥 Team Work Division

### **Ismahan** - Frontend Development
- ✅ React setup with Vite and Tailwind CSS
- ✅ React Router configuration and protected routes
- ✅ Auth Context for JWT token management and session persistence
- ✅ Navbar component with responsive mobile menu
- ✅ Landing Page with hero section, features, and how-it-works sections
- ✅ Registration Page with form validation and API integration
- ✅ Login Page with error handling and redirect logic
- ✅ Dashboard Page with summary cards, unit enrollment, and recent activity
- ✅ Peer Matching Page with cards, loading skeletons, and invite modal
- ✅ Unit Badge component for styling course codes
- ✅ Project configuration (package.json, vite.config.js, tailwind.config.js)
- ✅ Git initialization and GitHub push

### **Zaynab** - Backend Architecture & Database Design
- ✅ Database schema design (schema.sql)
- ✅ Sample data setup (sample_data.sql)
- ✅ Backend API planning and endpoint specification
- ✅ Authentication flow design
- ✅ Database relationships and data modeling
- ✅ Backend development (Express.js setup - in progress)

## 🎨 UI/UX Design

- **Color Scheme**: Blue (#2563EB) and white with slate accents
- **Typography**: Clean, modern sans-serif (Tailwind default)
- **Spacing**: Consistent use of Tailwind spacing scale
- **Responsive Design**: Mobile-first approach with breakpoints at sm, md, lg, xl
- **Components**: Rounded corners (rounded-3xl), modern shadows, and smooth transitions

## 📝 Forms & Validation

### Registration
- Full Name (required)
- Email (required, valid email format)
- Password (required, minimum length)
- Confirm Password (required, must match)
- Role (Student/Admin dropdown)

### Login
- Email (required)
- Password (required)
- Error handling for invalid credentials

## 🧪 Testing

To test the demo login functionality:
1. Go to `http://localhost:3000/login`
2. The demo login button is available to test the app without a backend
3. You can navigate through all protected routes

## 📚 Dependencies

### Production
```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "react-router-dom": "^6.14.2"
}
```

### Development
```json
{
  "@vitejs/plugin-react": "^4.3.1",
  "autoprefixer": "^10.4.19",
  "postcss": "^8.4.38",
  "tailwindcss": "^3.4.5",
  "vite": "^5.4.1"
}
```

## 🔄 Development Workflow

1. **Start dev server**: `npm run dev`
2. **Make changes**: Files automatically reload with Vite HMR
3. **Test locally**: Open `http://localhost:3000`
4. **Build for production**: `npm run build`
5. **Preview production build**: `npm run preview`

## 📦 Deployment

### Frontend Deployment (Vercel, Netlify, GitHub Pages)

```bash
npm run build
# Deploy the 'dist' folder
```

### Backend Deployment (Heroku, Railway, AWS)
- Set up Node.js environment
- Install dependencies: `npm install`
- Start server: `npm start`

## 🐛 Known Issues & Future Improvements

### Planned Features
- [ ] Group creation and management
- [ ] Real-time chat for study groups
- [ ] Calendar integration for scheduling
- [ ] File sharing and note collaboration
- [ ] User profiles and preferences
- [ ] Advanced matching algorithm
- [ ] Email notifications
- [ ] Mobile app (React Native)

### Backend Integration
- [ ] Complete Express.js server setup
- [ ] Database connection (PostgreSQL/MySQL)
- [ ] User authentication middleware
- [ ] CORS configuration
- [ ] Error handling and logging
- [ ] Unit tests and integration tests

## 📄 License

This project is open source and available under the MIT License.

## 👨‍💻 Contributors

- **Ismahan** - Frontend Engineer
- **Zaynab** - Backend Architect & Database Designer

## 📧 Contact

For questions or feedback, please reach out to the team or create an issue on the GitHub repository.

---

**Last Updated**: July 16, 2026

**Repository**: https://github.com/ismanito/Smart-study-group-matching-platform
