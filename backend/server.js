const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const store = require('./db/sqlite');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const MAX_NOTE_SIZE = 10 * 1024 * 1024;
const uploadDirectory = path.join(__dirname, 'uploads');
const allowedNoteTypes = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
]);
const allowedNoteExtensions = new Set(['.pdf', '.doc', '.docx', '.txt', '.md']);

fs.mkdirSync(uploadDirectory, { recursive: true });

const noteStorage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, uploadDirectory),
  filename: (_req, file, callback) => callback(null, `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`),
});

const noteUpload = multer({
  storage: noteStorage,
  limits: { fileSize: MAX_NOTE_SIZE },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (!allowedNoteTypes.has(file.mimetype) || !allowedNoteExtensions.has(extension)) {
      return callback(new Error('Only PDF, Word, Markdown, and text files are supported.'));
    }
    callback(null, true);
  },
});

app.use(express.json());
app.use(cors());

// In-memory database (replace with real database in production)
const users = [];
const peerDecisions = [];
const notes = [];
const activityLog = [];
const loginEvents = [];
const errorReports = [];
const passwordResetRequests = [];
const notifications = [];
const userInterests = []; // kept for runtime sync; source of truth is SQLite
const interestCatalog = store.allInterests();
const groups = [
  {
    id: 'group-cis301-evening',
    name: 'CIS301 Evening Crew',
    description: 'Work through data structures problem sets with a focused evening study rhythm.',
    members: [],
    nextSession: 'Tuesdays · 6:00 PM',
    unitCodes: ['CIS301'],
    meetingMode: 'hybrid',
    meetingLink: 'https://meet.example.com/cis301-evening',
    campusLocation: 'Library study room B2',
    preferredMethods: ['Pomodoro', 'Whiteboard problem-solving', 'Past papers'],
  },
  {
    id: 'group-cis201-algorithms',
    name: 'Algorithms Practice Lab',
    description: 'Share walkthroughs and solve weekly algorithm challenges together.',
    members: [],
    nextSession: 'Wednesdays · 5:30 PM',
    unitCodes: ['CIS201'],
    meetingMode: 'online',
    meetingLink: 'https://meet.example.com/algorithms-lab',
    campusLocation: '',
    preferredMethods: ['Teaching each other', 'Group discussion', 'Online calls'],
  },
  {
    id: 'group-math201-foundations',
    name: 'Linear Algebra Foundations',
    description: 'Build confidence with matrix operations, proofs, and exam preparation.',
    members: [],
    nextSession: 'Thursdays · 4:00 PM',
    unitCodes: ['MATH201'],
    meetingMode: 'campus',
    meetingLink: '',
    campusLocation: 'Math building · Room 204',
    preferredMethods: ['Flashcards', 'Silent co-working', 'In-person campus'],
  },
];
const groupMessages = [];
const groupMeetings = [
  {
    id: 'meeting-cis301-1',
    groupId: 'group-cis301-evening',
    title: 'Linked lists & stacks practice',
    scheduledAt: '2026-08-05T18:00:00.000Z',
    durationMinutes: 90,
    mode: 'hybrid',
    location: 'Library study room B2',
    meetingLink: 'https://meet.example.com/cis301-evening',
    notes: 'Bring week 4 problem set.',
    createdBy: null,
    rsvps: {},
    history: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'meeting-cis201-1',
    groupId: 'group-cis201-algorithms',
    title: 'Graph traversal walkthrough',
    scheduledAt: '2026-08-06T17:30:00.000Z',
    durationMinutes: 60,
    mode: 'online',
    location: '',
    meetingLink: 'https://meet.example.com/algorithms-lab',
    notes: 'BFS/DFS practice problems.',
    createdBy: null,
    rsvps: {},
    history: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'meeting-math201-1',
    groupId: 'group-math201-foundations',
    title: 'Eigenvalues review',
    scheduledAt: '2026-08-07T16:00:00.000Z',
    durationMinutes: 75,
    mode: 'campus',
    location: 'Math building · Room 204',
    meetingLink: '',
    notes: 'Past paper section B.',
    createdBy: null,
    rsvps: {},
    history: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];
const methodRatings = [];
const units = [
  { id: 1, code: 'CIS301', name: 'Data Structures', description: 'Learn fundamental data structures', enrolledBy: [] },
  { id: 2, code: 'CIS201', name: 'Algorithms', description: 'Algorithm design and analysis', enrolledBy: [] },
  { id: 3, code: 'MATH201', name: 'Linear Algebra', description: 'Matrix operations and theory', enrolledBy: [] },
  { id: 4, code: 'CIS401', name: 'Operating Systems', description: 'OS concepts and design', enrolledBy: [] },
  { id: 5, code: 'CIS501', name: 'Database Design', description: 'Database architecture and SQL', enrolledBy: [] },
];

const recordActivity = (userId, title, message) => {
  activityLog.unshift({
    id: crypto.randomUUID(),
    userId,
    title,
    message,
    timestamp: new Date(),
  });
  if (activityLog.length > 200) activityLog.length = 200;
};

const recordLogin = (user, meta = {}) => {
  const event = {
    id: crypto.randomUUID(),
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    timestamp: new Date(),
    ip: meta.ip || null,
    userAgent: meta.userAgent || null,
  };
  loginEvents.unshift(event);
  if (loginEvents.length > 300) loginEvents.length = 300;
  user.lastLoginAt = event.timestamp;
  user.loginCount = (user.loginCount || 0) + 1;
  try {
    store.saveLogin(user);
  } catch (_error) {
    // Keep request flowing if persistence fails.
  }
  return event;
};

const recordError = ({ title, message, source = 'system', severity = 'medium', userId = null, pathName = null }) => {
  const report = {
    id: crypto.randomUUID(),
    title,
    message,
    source,
    severity,
    userId,
    path: pathName,
    status: 'open',
    createdAt: new Date(),
    resolvedAt: null,
    resolutionNote: null,
  };
  errorReports.unshift(report);
  if (errorReports.length > 200) errorReports.length = 200;
  return report;
};

const recordNotification = ({ userId = null, email = null, title, message, type = 'info', otp = null }) => {
  const notification = {
    id: crypto.randomUUID(),
    userId,
    email: email ? String(email).toLowerCase() : null,
    title,
    message,
    type,
    otp,
    read: false,
    createdAt: new Date(),
  };
  notifications.unshift(notification);
  if (notifications.length > 300) notifications.length = 300;
  return notification;
};

const serializeAdminUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  status: user.status || 'active',
  createdAt: user.createdAt,
  lastLoginAt: user.lastLoginAt || null,
  loginCount: user.loginCount || 0,
  enrolledUnits: units.filter((unit) => unit.enrolledBy?.includes(user.id)).map((unit) => unit.code),
  groupCount: groups.filter((group) => group.members.includes(user.id)).length,
  notesCount: notes.filter((note) => note.uploadedBy === user.id).length,
});

const findUserById = (id) => users.find((user) => user.id === id);

const normalizeList = (value) => {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((item) => String(item).trim()).filter(Boolean))];
};

const normalizeAvailability = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((slot) => ({
      day: String(slot.day || '').trim(),
      start: String(slot.start || '').trim(),
      end: String(slot.end || '').trim(),
    }))
    .filter((slot) => slot.day && slot.start && slot.end && slot.start < slot.end);
};

const createDefaultProfileFields = (overrides = {}) => ({
  bio: overrides.bio || '',
  interests: normalizeList(overrides.interests),
  studyMethods: normalizeList(overrides.studyMethods),
  availability: normalizeAvailability(overrides.availability),
});

const timeToMinutes = (value) => {
  const [hours, minutes] = String(value).split(':').map(Number);
  return hours * 60 + minutes;
};

const getSharedValues = (left = [], right = []) => left.filter((item) => right.includes(item));

const getScheduleOverlaps = (left = [], right = []) => {
  const overlaps = [];
  left.forEach((slotA) => {
    right.forEach((slotB) => {
      if (slotA.day !== slotB.day) return;
      const start = Math.max(timeToMinutes(slotA.start), timeToMinutes(slotB.start));
      const end = Math.min(timeToMinutes(slotA.end), timeToMinutes(slotB.end));
      if (end > start) {
        const startHour = String(Math.floor(start / 60)).padStart(2, '0');
        const startMin = String(start % 60).padStart(2, '0');
        const endHour = String(Math.floor(end / 60)).padStart(2, '0');
        const endMin = String(end % 60).padStart(2, '0');
        overlaps.push({
          day: slotA.day,
          start: `${startHour}:${startMin}`,
          end: `${endHour}:${endMin}`,
          minutes: end - start,
        });
      }
    });
  });
  return overlaps.sort((a, b) => b.minutes - a.minutes);
};

const areConnected = (userId, peerId) => {
  const outgoing = peerDecisions.some(
    (decision) => decision.userId === userId && decision.peerId === peerId && decision.decision === 'match'
  );
  const incoming = peerDecisions.some(
    (decision) => decision.userId === peerId && decision.peerId === userId && decision.decision === 'match'
  );
  return outgoing && incoming;
};

const getConnectedPeerIds = (userId) =>
  users
    .filter((user) => user.id !== userId && areConnected(userId, user.id))
    .map((user) => user.id);

const buildCompatibility = (viewer, peer) => {
  const sharedUnits = units
    .filter((unit) => unit.enrolledBy?.includes(viewer.id) && unit.enrolledBy?.includes(peer.id))
    .map((unit) => unit.code);
  const sharedInterests = getSharedValues(viewer.interests || [], peer.interests || []);
  const sharedMethods = getSharedValues(viewer.studyMethods || [], peer.studyMethods || []);
  const scheduleOverlaps = getScheduleOverlaps(viewer.availability || [], peer.availability || []);
  const overlapMinutes = scheduleOverlaps.reduce((sum, slot) => sum + slot.minutes, 0);

  const score =
    sharedUnits.length * 3 +
    sharedInterests.length * 2 +
    sharedMethods.length * 2 +
    Math.min(5, Math.floor(overlapMinutes / 60));

  return {
    sharedUnits,
    sharedInterests,
    sharedMethods,
    scheduleOverlaps,
    overlapMinutes,
    score,
    connected: areConnected(viewer.id, peer.id),
  };
};

const serializePublicProfile = (user, viewerId = null) => {
  const profile = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    bio: user.bio || '',
    interests: user.interests || [],
    studyMethods: user.studyMethods || [],
    availability: user.availability || [],
    enrolledUnits: units.filter((unit) => unit.enrolledBy?.includes(user.id)).map((unit) => unit.code),
  };

  if (viewerId && viewerId !== user.id) {
    const viewer = findUserById(viewerId);
    if (viewer) {
      profile.compatibility = buildCompatibility(viewer, user);
    }
  }

  return profile;
};


const enrollUserInUnit = (userId, unitId) => {
  const unit = units.find((item) => item.id === unitId);
  if (!unit) return null;
  if (!unit.enrolledBy.includes(userId)) unit.enrolledBy.push(userId);
  return unit;
};

async function seedDemoData() {
  if (store.userCount() > 0) {
    users.splice(0, users.length, ...store.listUsers());
    userInterests.length = 0;
    store.listUsers().forEach((user) => {
      store.myInterests(user.id).forEach((interest) => {
        userInterests.push({
          id: crypto.randomUUID(),
          userId: user.id,
          interestId: interest.id,
        });
      });
    });

    // Restore demo enrollments/groups into memory for known seed accounts
    const demoMemberships = {
      'user-maya': { unitIds: [1, 2], groupIds: ['group-cis301-evening'] },
      'user-leo': { unitIds: [2, 3], groupIds: ['group-cis201-algorithms'] },
      'user-sara': { unitIds: [1, 5], groupIds: ['group-cis301-evening'] },
      'user-noah': { unitIds: [4, 2], groupIds: [] },
      'user-aisha': { unitIds: [3, 1], groupIds: ['group-math201-foundations'] },
      'user-jordan': { unitIds: [5, 4], groupIds: [] },
    };
    Object.entries(demoMemberships).forEach(([userId, meta]) => {
      if (!findUserById(userId)) return;
      meta.unitIds.forEach((unitId) => enrollUserInUnit(userId, unitId));
      meta.groupIds.forEach((groupId) => {
        const group = groups.find((item) => item.id === groupId);
        if (group && !group.members.includes(userId)) group.members.push(userId);
      });
    });
    return;
  }

  const passwordHash = await bcrypt.hash('password123', 10);
  const adminHash = await bcrypt.hash('admin123', 10);

  users.push({
    id: 'user-admin',
    name: 'Platform Admin',
    email: 'admin@studymatch.com',
    password: adminHash,
    role: 'admin',
    status: 'active',
    loginCount: 0,
    lastLoginAt: null,
    createdAt: new Date(),
    ...createDefaultProfileFields({
      bio: 'Platform administrator',
      interests: ['Career prep'],
      studyMethods: ['Online calls'],
    }),
  });

  const demoPeers = [
    {
      id: 'user-maya',
      name: 'Maya Chen',
      email: 'maya@example.com',
      bio: 'Focused on algorithms and weekly problem sets. Prefer quiet co-working with short check-ins.',
      interests: ['Algorithms', 'Coding practice', 'Exam prep'],
      studyMethods: ['Silent co-working', 'Past papers', 'Pomodoro'],
      availability: [
        { day: 'Monday', start: '17:00', end: '19:00' },
        { day: 'Wednesday', start: '18:00', end: '20:00' },
      ],
      unitIds: [1, 2],
      groupIds: ['group-cis301-evening'],
    },
    {
      id: 'user-leo',
      name: 'Leo Okonkwo',
      email: 'leo@example.com',
      bio: 'Love teaching concepts out loud and whiteboard walkthroughs before exams.',
      interests: ['Exam prep', 'Math foundations', 'Homework help'],
      studyMethods: ['Teaching each other', 'Whiteboard problem-solving', 'Group discussion'],
      availability: [
        { day: 'Tuesday', start: '16:00', end: '18:30' },
        { day: 'Thursday', start: '17:00', end: '19:00' },
      ],
      unitIds: [2, 3],
      groupIds: ['group-cis201-algorithms'],
    },
    {
      id: 'user-sara',
      name: 'Sara Ahmed',
      email: 'sara@example.com',
      bio: 'Database design projects and SQL practice. Happy to share notes asynchronously.',
      interests: ['Databases', 'Project collaboration', 'Homework help'],
      studyMethods: ['Async chat notes', 'Online calls', 'Flashcards'],
      availability: [
        { day: 'Wednesday', start: '19:00', end: '21:00' },
        { day: 'Saturday', start: '10:00', end: '12:00' },
      ],
      unitIds: [1, 5],
      groupIds: ['group-cis301-evening'],
    },
    {
      id: 'user-noah',
      name: 'Noah Patel',
      email: 'noah@example.com',
      bio: 'OS concepts and systems thinking. Prefer campus meetups with a clear agenda.',
      interests: ['Operating systems', 'Coding practice', 'Research'],
      studyMethods: ['In-person campus', 'Whiteboard problem-solving', 'Pomodoro'],
      availability: [
        { day: 'Friday', start: '14:00', end: '17:00' },
        { day: 'Sunday', start: '15:00', end: '17:00' },
      ],
      unitIds: [4, 2],
      groupIds: [],
    },
    {
      id: 'user-aisha',
      name: 'Aisha Rahman',
      email: 'aisha@example.com',
      bio: 'Linear algebra study partner looking for proof practice and exam drills.',
      interests: ['Math foundations', 'Exam prep', 'Homework help'],
      studyMethods: ['Past papers', 'Group discussion', 'Flashcards'],
      availability: [
        { day: 'Thursday', start: '16:00', end: '18:00' },
        { day: 'Monday', start: '18:00', end: '20:00' },
      ],
      unitIds: [3, 1],
      groupIds: ['group-math201-foundations'],
    },
    {
      id: 'user-jordan',
      name: 'Jordan Blake',
      email: 'jordan@example.com',
      bio: 'Balancing coursework with career prep. Looking for project teammates and mock interviews.',
      interests: ['Career prep', 'Project collaboration', 'Databases'],
      studyMethods: ['Online calls', 'Teaching each other', 'Async chat notes'],
      availability: [
        { day: 'Tuesday', start: '19:00', end: '21:00' },
        { day: 'Saturday', start: '13:00', end: '15:00' },
      ],
      unitIds: [5, 4],
      groupIds: [],
    },
  ];

  demoPeers.forEach((peer) => {
    users.push({
      id: peer.id,
      name: peer.name,
      email: peer.email,
      password: passwordHash,
      role: 'student',
      status: 'active',
      loginCount: 0,
      lastLoginAt: null,
      createdAt: new Date(),
      ...createDefaultProfileFields({
        bio: peer.bio,
        interests: peer.interests,
        studyMethods: peer.studyMethods,
        availability: peer.availability,
      }),
    });

    peer.unitIds.forEach((unitId) => enrollUserInUnit(peer.id, unitId));
    peer.groupIds.forEach((groupId) => {
      const group = groups.find((item) => item.id === groupId);
      if (group && !group.members.includes(peer.id)) group.members.push(peer.id);
    });
  });

  // Seed subject-interest selections for demo classmates (separate from free-text profile interests)
  const demoSubjectInterests = {
    'user-maya': ['int-cs', 'int-math', 'int-physics'],
    'user-leo': ['int-math', 'int-engineering', 'int-physics'],
    'user-sara': ['int-cs', 'int-economics', 'int-math'],
    'user-noah': ['int-engineering', 'int-cs', 'int-physics'],
    'user-aisha': ['int-math', 'int-biology', 'int-chemistry'],
    'user-jordan': ['int-economics', 'int-cs', 'int-psychology'],
  };
  Object.entries(demoSubjectInterests).forEach(([userId, interestIds]) => {
    interestIds.forEach((interestId) => {
      userInterests.push({
        id: crypto.randomUUID(),
        userId,
        interestId,
      });
    });
  });

  // Persist demo accounts + subject interests to SQLite
  users.forEach((user) => {
    if (!store.findUserById(user.id)) {
      store.createUser(user);
    }
  });
  userInterests.forEach((row) => {
    if (!store.hasUserInterest(row.userId, row.interestId)) {
      store.addUserInterest(row.id, row.userId, row.interestId);
    }
  });
}

// Authentication Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, bio, interests, studyMethods, availability } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields.' });
    }

    if (users.find((u) => u.email === email)) {
      return res.status(409).json({ message: 'Email already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const profile = createDefaultProfileFields({ bio, interests, studyMethods, availability });
    const user = {
      id: `user-${crypto.randomUUID()}`,
      name,
      email,
      password: hashedPassword,
      role: 'student',
      status: 'active',
      loginCount: 0,
      lastLoginAt: null,
      createdAt: new Date(),
      ...profile,
    };

    users.push(user);
    store.createUser(user);
    recordActivity(user.id, 'Welcome', 'Your StudyMatch account was created.');
    recordLogin(user, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    const token = jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role }, JWT_SECRET, {
      expiresIn: '7d',
    });

    res.status(201).json({
      message: 'Registration successful!',
      token,
      user: serializePublicProfile(user),
    });
  } catch (error) {
    recordError({
      title: 'Registration failure',
      message: error.message || 'Server error during registration.',
      source: 'server',
      severity: 'high',
      pathName: '/api/auth/register',
    });
    res.status(500).json({ message: 'Server error during registration.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const expectedRole = role === 'admin' ? 'admin' : role === 'student' ? 'student' : null;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password.' });
    }

    const user = users.find((u) => u.email === email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ message: 'This account is suspended. Contact an administrator.' });
    }

    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (expectedRole && user.role !== expectedRole) {
      return res.status(403).json({
        message:
          expectedRole === 'admin'
            ? 'This is the admin login. Use a student account on Student Login.'
            : 'This is the student login. Use an admin account on Admin Login.',
      });
    }

    recordLogin(user, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
    recordActivity(user.id, 'Signed in', `You signed in as ${user.role}.`);

    const token = jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role }, JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({
      message: 'Login successful!',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status },
    });
  } catch (error) {
    recordError({
      title: 'Login failure',
      message: error.message || 'Server error during login.',
      source: 'server',
      severity: 'high',
      pathName: '/api/auth/login',
    });
    res.status(500).json({ message: 'Server error during login.' });
  }
});

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const serializePasswordReset = (request, { includeOtp = false } = {}) => ({
  id: request.id,
  userId: request.userId,
  name: request.name,
  email: request.email,
  status: request.status,
  requestedAt: request.requestedAt,
  otpSentAt: request.otpSentAt || null,
  expiresAt: request.expiresAt || null,
  completedAt: request.completedAt || null,
  otp: includeOtp ? request.otp : undefined,
});

app.post('/api/auth/forgot-password', (req, res) => {
  const email = req.body.email?.trim().toLowerCase();
  if (!email) {
    return res.status(400).json({ message: 'Please provide your account email.' });
  }

  const user = users.find((item) => item.email.toLowerCase() === email);
  if (!user) {
    return res.status(404).json({ message: 'No account found with that email.' });
  }
  if (user.status === 'suspended') {
    return res.status(403).json({ message: 'This account is suspended. Contact an administrator.' });
  }

  // Replace any open request for this user.
  for (let i = passwordResetRequests.length - 1; i >= 0; i -= 1) {
    if (
      passwordResetRequests[i].userId === user.id &&
      ['pending', 'otp_sent'].includes(passwordResetRequests[i].status)
    ) {
      passwordResetRequests.splice(i, 1);
    }
  }

  const request = {
    id: crypto.randomUUID(),
    userId: user.id,
    name: user.name,
    email: user.email,
    status: 'pending',
    otp: null,
    requestedAt: new Date(),
    otpSentAt: null,
    expiresAt: null,
    completedAt: null,
  };
  passwordResetRequests.unshift(request);
  recordActivity(user.id, 'Password reset requested', 'You asked to reset your password. An admin will send an OTP.');
  recordError({
    title: 'Password reset requested',
    message: `${user.name} (${user.email}) requested a password reset OTP.`,
    source: 'user',
    severity: 'medium',
    userId: user.id,
    pathName: '/api/auth/forgot-password',
  });

  res.status(201).json({
    message: 'Reset request submitted. Stay on this page — when an admin sends your OTP, it will appear as a notification here.',
    request: serializePasswordReset(request),
  });
});

app.get('/api/auth/password-reset/notification', (req, res) => {
  const email = String(req.query.email || '').trim().toLowerCase();
  if (!email) {
    return res.status(400).json({ message: 'Email is required.' });
  }

  const request = passwordResetRequests.find((item) => item.email.toLowerCase() === email);
  if (!request) {
    return res.json({ status: 'none', waiting: false, notification: null });
  }

  if (request.status === 'pending') {
    return res.json({
      status: 'pending',
      waiting: true,
      message: 'Waiting for an administrator to send your OTP…',
      notification: null,
    });
  }

  if (request.status === 'otp_sent') {
    const expired = !request.expiresAt || new Date(request.expiresAt).getTime() < Date.now();
    if (expired) {
      request.status = 'expired';
      return res.json({
        status: 'expired',
        waiting: false,
        message: 'Your OTP expired. Submit a new reset request.',
        notification: null,
      });
    }

    return res.json({
      status: 'otp_sent',
      waiting: false,
      message: 'Your password reset OTP is ready.',
      notification: {
        title: 'Password reset OTP',
        message: `Your one-time code is ${request.otp}. It expires at ${new Date(request.expiresAt).toLocaleTimeString()}.`,
        otp: request.otp,
        expiresAt: request.expiresAt,
        createdAt: request.otpSentAt,
      },
    });
  }

  return res.json({
    status: request.status,
    waiting: false,
    message: request.status === 'completed' ? 'Password was already updated.' : `Reset status: ${request.status}`,
    notification: null,
  });
});

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const otp = String(req.body.otp || '').trim();
    const newPassword = req.body.newPassword || req.body.password;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Provide email, OTP, and a new password.' });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const request = passwordResetRequests.find(
      (item) => item.email.toLowerCase() === email && item.status === 'otp_sent'
    );
    if (!request) {
      return res.status(400).json({ message: 'No active OTP found for this email. Ask an admin to send one.' });
    }
    if (!request.expiresAt || new Date(request.expiresAt).getTime() < Date.now()) {
      request.status = 'expired';
      return res.status(400).json({ message: 'This OTP has expired. Request a new reset.' });
    }
    if (request.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP. Check the code from your administrator.' });
    }

    const user = findUserById(request.userId);
    if (!user) {
      return res.status(404).json({ message: 'Account not found.' });
    }
    if (user.status === 'suspended') {
      return res.status(403).json({ message: 'This account is suspended. Contact an administrator.' });
    }

    user.password = await bcrypt.hash(String(newPassword), 10);
    request.status = 'completed';
    request.completedAt = new Date();
    request.otp = null;

    recordActivity(user.id, 'Password updated', 'You updated your password with an admin OTP.');
    res.json({ message: 'Password updated successfully. You can sign in with your new password.' });
  } catch (error) {
    res.status(500).json({ message: 'Unable to reset password.' });
  }
});

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'No token provided.' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Invalid or expired token.' });
    }

    const currentUser = findUserById(decoded.id);
    if (!currentUser) {
      return res.status(401).json({ message: 'Account no longer exists.' });
    }
    if (currentUser.status === 'suspended') {
      return res.status(403).json({ message: 'This account is suspended. Contact an administrator.' });
    }

    req.user = {
      id: currentUser.id,
      name: currentUser.name,
      email: currentUser.email,
      role: currentUser.role,
    };
    next();
  });
};

app.get('/api/notifications', verifyToken, (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 20;
  const list = notifications
    .filter((item) => item.userId === req.user.id || item.email === req.user.email?.toLowerCase())
    .slice(0, limit)
    .map(({ id, title, message, type, otp, read, createdAt }) => ({
      id,
      title,
      message,
      type,
      otp,
      read,
      createdAt,
    }));
  res.json(list);
});

app.post('/api/notifications/:id/read', verifyToken, (req, res) => {
  const notification = notifications.find(
    (item) =>
      item.id === req.params.id &&
      (item.userId === req.user.id || item.email === req.user.email?.toLowerCase())
  );
  if (!notification) {
    return res.status(404).json({ message: 'Notification not found.' });
  }
  notification.read = true;
  res.json({ message: 'Notification marked as read.', notification });
});

// Dashboard Routes
app.get('/api/dashboard/summary', verifyToken, (req, res) => {
  const userGroups = groups.filter((g) => g.members.includes(req.user.id));
  const userUnits = units.filter((u) => u.enrolledBy?.includes(req.user.id));

  res.json({
    groupsCount: userGroups.length,
    peersCount: getConnectedPeerIds(req.user.id).length,
    notesCount: notes.filter((note) => note.uploadedBy === req.user.id).length,
    pendingMatches: peerDecisions.filter(
      (decision) => decision.userId === req.user.id && decision.decision === 'match' && !areConnected(req.user.id, decision.peerId)
    ).length,
  });
});

app.get('/api/profile', verifyToken, (req, res) => {
  const user = findUserById(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found.' });
  res.json(serializePublicProfile(user));
});

app.get('/api/profile/:id', verifyToken, (req, res) => {
  const user = findUserById(req.params.id);
  if (!user || user.status === 'suspended') {
    return res.status(404).json({ message: 'Student not found.' });
  }
  res.json(serializePublicProfile(user, req.user.id));
});

app.patch('/api/profile', verifyToken, (req, res) => {
  const user = findUserById(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found.' });

  if (typeof req.body.bio === 'string') user.bio = req.body.bio.trim().slice(0, 280);
  if (typeof req.body.name === 'string' && req.body.name.trim()) user.name = req.body.name.trim();
  if (Array.isArray(req.body.interests)) user.interests = normalizeList(req.body.interests).slice(0, 8);
  if (Array.isArray(req.body.studyMethods)) user.studyMethods = normalizeList(req.body.studyMethods).slice(0, 8);
  if (Array.isArray(req.body.availability)) user.availability = normalizeAvailability(req.body.availability).slice(0, 14);

  try {
    store.updateProfile(user);
  } catch (_error) {
    // Keep in-memory profile even if DB write fails.
  }

  recordActivity(user.id, 'Profile updated', 'You updated your study preferences and schedule.');
  res.json({ message: 'Profile saved.', profile: serializePublicProfile(user) });
});

app.get('/api/connections', verifyToken, (req, res) => {
  const viewer = findUserById(req.user.id);
  const connected = users
    .filter((user) => user.id !== req.user.id && user.role === 'student' && areConnected(req.user.id, user.id))
    .map((user) => ({
      ...serializePublicProfile(user, req.user.id),
      ...buildCompatibility(viewer, user),
    }))
    .sort((a, b) => b.score - a.score);

  res.json(connected);
});

app.get('/api/schedule/align', verifyToken, (req, res) => {
  const viewer = findUserById(req.user.id);
  const alignments = getConnectedPeerIds(req.user.id)
    .map((peerId) => {
      const peer = findUserById(peerId);
      if (!peer) return null;
      const overlaps = getScheduleOverlaps(viewer.availability || [], peer.availability || []);
      return {
        peer: serializePublicProfile(peer),
        overlaps,
        totalMinutes: overlaps.reduce((sum, slot) => sum + slot.minutes, 0),
        suggestion: overlaps[0] || null,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.totalMinutes - a.totalMinutes);

  res.json({
    myAvailability: viewer.availability || [],
    alignments,
  });
});

// Units Routes
app.get('/api/units', verifyToken, (req, res) => {
  const enrolledUnits = units.map((unit) => ({
    ...unit,
    enrolled: unit.enrolledBy?.includes(req.user.id) || false,
  }));
  res.json(enrolledUnits);
});

app.post('/api/units/enroll', verifyToken, (req, res) => {
  const { unitId } = req.body;
  const unit = units.find((u) => u.id === Number.parseInt(unitId, 10));

  if (!unit) {
    return res.status(404).json({ message: 'Unit not found.' });
  }

  if (!unit.enrolledBy) {
    unit.enrolledBy = [];
  }

  if (unit.enrolledBy.includes(req.user.id)) {
    return res.status(400).json({ message: 'Already enrolled in this unit.' });
  }

  unit.enrolledBy.push(req.user.id);
  recordActivity(req.user.id, 'Course Enrollment', `You enrolled in ${unit.code}`);
  res.json({
    message: 'Enrolled successfully!',
    unit: {
      ...unit,
      enrolled: true,
    },
  });
});

app.post('/api/units/unenroll', verifyToken, (req, res) => {
  const { unitId } = req.body;
  const unit = units.find((u) => u.id === Number.parseInt(unitId, 10));

  if (!unit) {
    return res.status(404).json({ message: 'Unit not found.' });
  }

  unit.enrolledBy = (unit.enrolledBy || []).filter((id) => id !== req.user.id);
  recordActivity(req.user.id, 'Left course', `You unenrolled from ${unit.code}`);
  res.json({
    message: `You unenrolled from ${unit.code}.`,
    unit: {
      ...unit,
      enrolled: false,
    },
  });
});

// Matching Routes
app.get('/api/match', verifyToken, (req, res) => {
  const viewer = findUserById(req.user.id);
  if (!viewer) return res.status(404).json({ message: 'User not found.' });

  const matchedPeers = users
    .filter((user) => user.id !== viewer.id && user.role === 'student' && user.status !== 'suspended')
    .map((user) => {
      const compatibility = buildCompatibility(viewer, user);
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        bio: user.bio || '',
        interests: user.interests || [],
        studyMethods: user.studyMethods || [],
        availability: user.availability || [],
        ...compatibility,
        theyMatchedYou: peerDecisions.some(
          (decision) => decision.userId === user.id && decision.peerId === viewer.id && decision.decision === 'match'
        ),
      };
    })
    .filter((peer) => peer.sharedUnits.length > 0 || peer.sharedInterests.length > 0 || peer.sharedMethods.length > 0)
    .filter(
      (peer) => !peerDecisions.some(
        (decision) => decision.userId === viewer.id && decision.peerId === peer.id
      )
    )
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);

  res.json(matchedPeers);
});

app.get('/api/match/confirmed', verifyToken, (req, res) => {
  const viewer = findUserById(req.user.id);
  const confirmedPeerIds = new Set(
    peerDecisions
      .filter((decision) => decision.userId === req.user.id && decision.decision === 'match')
      .map((decision) => decision.peerId)
  );

  const confirmedMatches = users
    .filter((user) => confirmedPeerIds.has(user.id))
    .map((user) => {
      const compatibility = buildCompatibility(viewer, user);
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        bio: user.bio || '',
        interests: user.interests || [],
        studyMethods: user.studyMethods || [],
        ...compatibility,
        mutual: compatibility.connected,
      };
    })
    .sort((a, b) => Number(b.mutual) - Number(a.mutual) || b.score - a.score);

  res.json(confirmedMatches);
});

app.post('/api/match/decide', verifyToken, (req, res) => {
  const { peerId, decision } = req.body;
  const peer = users.find((user) => user.id === peerId);

  if (!peer || peer.id === req.user.id) {
    return res.status(404).json({ message: 'Peer not found.' });
  }

  if (!['match', 'pass'].includes(decision)) {
    return res.status(400).json({ message: 'Decision must be match or pass.' });
  }

  const existingDecision = peerDecisions.find(
    (item) => item.userId === req.user.id && item.peerId === peerId
  );

  if (existingDecision) {
    existingDecision.decision = decision;
    existingDecision.updatedAt = new Date();
  } else {
    peerDecisions.push({
      userId: req.user.id,
      peerId,
      decision,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  const mutual = decision === 'match' && areConnected(req.user.id, peer.id);

  if (decision === 'match') {
    recordActivity(
      req.user.id,
      mutual ? 'Connected with peer' : 'Connection requested',
      mutual
        ? `You and ${peer.name} are now connected.`
        : `You asked to connect with ${peer.name}. Waiting for them to match you back.`
    );
    if (mutual) {
      recordActivity(peer.id, 'Connected with peer', `You and ${req.user.name} are now connected.`);
    }
  }

  res.json({
    message: mutual
      ? `You and ${peer.name} are connected! You can share notes and align schedules.`
      : decision === 'match'
        ? `Connection request sent to ${peer.name}.`
        : `You passed on ${peer.name}.`,
    decision,
    mutual,
  });
});

const serializeGroup = (group, userId) => ({
  ...group,
  memberCount: group.members.length,
  isMember: group.members.includes(userId),
});

const requireGroupMembership = (group, userId) => group?.members?.includes(userId);

const serializeMeeting = (meeting, userId) => {
  const rsvpEntries = Object.entries(meeting.rsvps || {}).map(([memberId, status]) => {
    const member = users.find((user) => user.id === memberId);
    return {
      userId: memberId,
      name: member?.name || 'Member',
      status,
    };
  });
  return {
    id: meeting.id,
    groupId: meeting.groupId,
    title: meeting.title,
    scheduledAt: meeting.scheduledAt,
    durationMinutes: meeting.durationMinutes,
    mode: meeting.mode,
    location: meeting.location || '',
    meetingLink: meeting.meetingLink || '',
    notes: meeting.notes || '',
    createdBy: meeting.createdBy,
    myRsvp: meeting.rsvps?.[userId] || null,
    rsvps: rsvpEntries,
    history: meeting.history || [],
    createdAt: meeting.createdAt,
    updatedAt: meeting.updatedAt,
  };
};

const methodRatingSummary = (groupId) => {
  const ratings = methodRatings.filter((item) => item.groupId === groupId);
  const byMethod = {};
  ratings.forEach((rating) => {
    if (!byMethod[rating.method]) {
      byMethod[rating.method] = { method: rating.method, total: 0, count: 0, comments: [] };
    }
    byMethod[rating.method].total += rating.score;
    byMethod[rating.method].count += 1;
    if (rating.comment) {
      byMethod[rating.method].comments.push({
        userId: rating.userId,
        name: users.find((user) => user.id === rating.userId)?.name || 'Member',
        score: rating.score,
        comment: rating.comment,
        createdAt: rating.createdAt,
      });
    }
  });
  return Object.values(byMethod)
    .map((item) => ({
      method: item.method,
      average: Number((item.total / item.count).toFixed(1)),
      count: item.count,
      comments: item.comments.slice(-5).reverse(),
    }))
    .sort((a, b) => b.average - a.average || b.count - a.count);
};

app.post('/api/invite', verifyToken, (req, res) => {
  const { peerId, groupId } = req.body;
  const group = groups.find((item) => item.id === groupId);
  const peer = users.find((user) => user.id === peerId);
  const hasMatchedPeer = peerDecisions.some(
    (decision) => decision.userId === req.user.id && decision.peerId === peerId && decision.decision === 'match'
  );

  if (!group || !peer) {
    return res.status(404).json({ message: 'Peer or group not found.' });
  }

  if (!group.members.includes(req.user.id)) {
    return res.status(403).json({ message: 'Join the group before inviting a peer.' });
  }

  if (!hasMatchedPeer) {
    return res.status(400).json({ message: 'Choose Match for this peer before sending an invitation.' });
  }

  if (!group.members.includes(peer.id)) {
    group.members.push(peer.id);
  }

  recordActivity(req.user.id, 'Peer Invited', `You invited ${peer.name} to "${group.name}"`);
  recordActivity(peer.id, 'Joined Study Group', `You were added to "${group.name}"`);

  res.json({
    message: `${peer.name} was added to "${group.name}".`,
    group: serializeGroup(group, req.user.id),
  });
});

// Notes Routes
const uploadNoteFile = (req, res, next) => {
  noteUpload.single('file')(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      const message = error.code === 'LIMIT_FILE_SIZE'
        ? 'Notes must be 10 MB or smaller.'
        : 'Unable to upload this note.';
      return res.status(400).json({ message });
    }

    if (error) {
      return res.status(400).json({ message: error.message || 'Unable to upload this note.' });
    }

    next();
  });
};

const canAccessNote = (note, userId) => {
  if (note.uploadedBy === userId) return true;
  if (note.visibility === 'connections' && areConnected(userId, note.uploadedBy)) return true;
  if (note.visibility === 'group' && note.groupId) {
    const group = groups.find((item) => item.id === note.groupId);
    return Boolean(group?.members.includes(userId) && group.members.includes(note.uploadedBy));
  }
  return false;
};

const serializeNote = (note, userId = null) => {
  const uploader = findUserById(note.uploadedBy);
  return {
    id: note.id,
    title: note.title,
    unitId: note.unitId,
    unitCode: note.unitCode,
    filename: note.filename,
    fileSize: note.fileSize,
    createdAt: note.createdAt,
    visibility: note.visibility || 'private',
    groupId: note.groupId || null,
    uploadedBy: note.uploadedBy,
    uploaderName: uploader?.name || 'Student',
    isMine: userId ? note.uploadedBy === userId : false,
  };
};

app.get('/api/notes', verifyToken, (req, res) => {
  res.json(
    notes
      .filter((note) => note.uploadedBy === req.user.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map((note) => serializeNote(note, req.user.id))
  );
});

app.get('/api/notes/shared', verifyToken, (req, res) => {
  res.json(
    notes
      .filter((note) => note.uploadedBy !== req.user.id && canAccessNote(note, req.user.id))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map((note) => serializeNote(note, req.user.id))
  );
});

app.post('/api/notes', verifyToken, uploadNoteFile, (req, res) => {
  const title = req.body.title?.trim();
  const unitId = Number.parseInt(req.body.unitId, 10);
  const unit = units.find((item) => item.id === unitId);
  const visibility = ['private', 'connections', 'group'].includes(req.body.visibility)
    ? req.body.visibility
    : 'private';
  const groupId = req.body.groupId || null;

  if (!title || title.length > 120) {
    if (req.file) fs.unlinkSync(req.file.path);
    return res.status(400).json({ message: 'Add a note title between 1 and 120 characters.' });
  }

  if (!unit || !unit.enrolledBy?.includes(req.user.id)) {
    if (req.file) fs.unlinkSync(req.file.path);
    return res.status(400).json({ message: 'Choose one of your enrolled courses.' });
  }

  if (visibility === 'group') {
    const group = groups.find((item) => item.id === groupId);
    if (!group || !group.members.includes(req.user.id)) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Choose a study group you belong to for group sharing.' });
    }
  }

  if (!req.file) {
    return res.status(400).json({ message: 'Choose a file to upload.' });
  }

  const note = {
    id: crypto.randomUUID(),
    title,
    unitId: unit.id,
    unitCode: unit.code,
    filename: req.file.originalname,
    storedFilename: req.file.filename,
    filePath: req.file.path,
    fileSize: req.file.size,
    uploadedBy: req.user.id,
    visibility,
    groupId: visibility === 'group' ? groupId : null,
    createdAt: new Date(),
  };

  notes.push(note);
  recordActivity(
    req.user.id,
    'Notes Uploaded',
    visibility === 'private'
      ? `You uploaded "${note.title}" (private).`
      : `You shared "${note.title}" with ${visibility === 'connections' ? 'your connections' : 'a study group'}.`
  );
  res.status(201).json({ message: 'Note uploaded successfully.', note: serializeNote(note, req.user.id) });
});

app.get('/api/notes/:id/download', verifyToken, (req, res) => {
  const note = notes.find((item) => item.id === req.params.id);

  if (!note || !canAccessNote(note, req.user.id)) {
    return res.status(404).json({ message: 'Note not found.' });
  }

  if (!fs.existsSync(note.filePath)) {
    return res.status(404).json({ message: 'Note file is no longer available.' });
  }

  res.download(note.filePath, note.filename);
});

app.delete('/api/notes/:id', verifyToken, (req, res) => {
  const noteIndex = notes.findIndex((item) => item.id === req.params.id && item.uploadedBy === req.user.id);

  if (noteIndex === -1) {
    return res.status(404).json({ message: 'Note not found.' });
  }

  const [note] = notes.splice(noteIndex, 1);
  if (fs.existsSync(note.filePath)) fs.unlinkSync(note.filePath);
  res.json({ message: 'Note deleted successfully.' });
});

// Groups Routes
app.get('/api/groups', verifyToken, (req, res) => {
  const userGroups = groups
    .filter((group) => group.members.includes(req.user.id))
    .map((group) => serializeGroup(group, req.user.id));
  res.json(userGroups);
});

app.get('/api/groups/discoverable', verifyToken, (req, res) => {
  res.json(groups.map((group) => serializeGroup(group, req.user.id)));
});

app.get('/api/groups/:id', verifyToken, (req, res) => {
  const group = groups.find((item) => item.id === req.params.id);

  if (!group) {
    return res.status(404).json({ message: 'Study group not found.' });
  }

  const members = group.members
    .map((memberId) => users.find((user) => user.id === memberId))
    .filter(Boolean)
    .map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      studyMethods: user.studyMethods || [],
      interests: user.interests || [],
    }));

  const upcomingMeetings = groupMeetings
    .filter((meeting) => meeting.groupId === group.id)
    .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))
    .map((meeting) => serializeMeeting(meeting, req.user.id));

  const groupNotes = notes
    .filter((note) => note.visibility === 'group' && note.groupId === group.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((note) => serializeNote(note, req.user.id));

  const messages = groupMessages
    .filter((message) => message.groupId === group.id)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .slice(-80)
    .map((message) => ({
      id: message.id,
      body: message.body,
      createdAt: message.createdAt,
      userId: message.userId,
      name: users.find((user) => user.id === message.userId)?.name || 'Member',
      isMine: message.userId === req.user.id,
    }));

  res.json({
    ...serializeGroup(group, req.user.id),
    members,
    meetings: upcomingMeetings,
    notes: requireGroupMembership(group, req.user.id) ? groupNotes : [],
    messages: requireGroupMembership(group, req.user.id) ? messages : [],
    methodRatings: methodRatingSummary(group.id),
    myMethodRatings: methodRatings
      .filter((item) => item.groupId === group.id && item.userId === req.user.id)
      .map((item) => ({ method: item.method, score: item.score, comment: item.comment || '' })),
  });
});

app.post('/api/groups/:id/join', verifyToken, (req, res) => {
  const group = groups.find((item) => item.id === req.params.id);

  if (!group) {
    return res.status(404).json({ message: 'Study group not found.' });
  }

  if (group.members.includes(req.user.id)) {
    return res.status(400).json({ message: 'You already joined this group.' });
  }

  group.members.push(req.user.id);
  recordActivity(req.user.id, 'Joined Study Group', `You joined "${group.name}"`);
  res.status(201).json({
    message: 'You joined the study group!',
    group: serializeGroup(group, req.user.id),
  });
});

app.post('/api/groups/:id/messages', verifyToken, (req, res) => {
  const group = groups.find((item) => item.id === req.params.id);
  const body = req.body.body?.trim();

  if (!group) {
    return res.status(404).json({ message: 'Study group not found.' });
  }
  if (!requireGroupMembership(group, req.user.id)) {
    return res.status(403).json({ message: 'Join this group to send messages.' });
  }
  if (!body || body.length > 1000) {
    return res.status(400).json({ message: 'Message must be between 1 and 1000 characters.' });
  }

  const message = {
    id: crypto.randomUUID(),
    groupId: group.id,
    userId: req.user.id,
    body,
    createdAt: new Date(),
  };
  groupMessages.push(message);

  group.members
    .filter((memberId) => memberId !== req.user.id)
    .forEach((memberId) => {
      recordNotification({
        userId: memberId,
        title: 'Group chat',
        message: `${req.user.name} posted in "${group.name}".`,
        type: 'info',
      });
    });

  res.status(201).json({
    message: 'Message sent.',
    chatMessage: {
      id: message.id,
      body: message.body,
      createdAt: message.createdAt,
      userId: message.userId,
      name: req.user.name,
      isMine: true,
    },
  });
});

app.post('/api/groups/:id/meetings', verifyToken, (req, res) => {
  const group = groups.find((item) => item.id === req.params.id);
  const title = req.body.title?.trim();
  const scheduledAt = req.body.scheduledAt;
  const mode = ['online', 'campus', 'hybrid'].includes(req.body.mode) ? req.body.mode : group.meetingMode || 'online';
  const durationMinutes = Number.parseInt(req.body.durationMinutes, 10) || 60;

  if (!group) {
    return res.status(404).json({ message: 'Study group not found.' });
  }
  if (!requireGroupMembership(group, req.user.id)) {
    return res.status(403).json({ message: 'Join this group to schedule meetings.' });
  }
  if (!title || !scheduledAt || Number.isNaN(new Date(scheduledAt).getTime())) {
    return res.status(400).json({ message: 'Provide a meeting title and valid date/time.' });
  }

  const meeting = {
    id: crypto.randomUUID(),
    groupId: group.id,
    title,
    scheduledAt: new Date(scheduledAt).toISOString(),
    durationMinutes: Math.min(Math.max(durationMinutes, 15), 240),
    mode,
    location: req.body.location?.trim() || group.campusLocation || '',
    meetingLink: req.body.meetingLink?.trim() || group.meetingLink || '',
    notes: req.body.notes?.trim() || '',
    createdBy: req.user.id,
    rsvps: { [req.user.id]: 'going' },
    history: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  groupMeetings.push(meeting);
  group.nextSession = new Date(meeting.scheduledAt).toLocaleString();

  group.members
    .filter((memberId) => memberId !== req.user.id)
    .forEach((memberId) => {
      recordNotification({
        userId: memberId,
        title: 'New group meeting',
        message: `${req.user.name} scheduled "${meeting.title}" for ${group.name}.`,
        type: 'info',
      });
    });

  recordActivity(req.user.id, 'Meeting scheduled', `You scheduled "${meeting.title}" in ${group.name}.`);
  res.status(201).json({
    message: 'Meeting scheduled.',
    meeting: serializeMeeting(meeting, req.user.id),
  });
});

app.patch('/api/groups/:id/meetings/:meetingId', verifyToken, (req, res) => {
  const group = groups.find((item) => item.id === req.params.id);
  const meeting = groupMeetings.find(
    (item) => item.id === req.params.meetingId && item.groupId === req.params.id
  );

  if (!group || !meeting) {
    return res.status(404).json({ message: 'Meeting not found.' });
  }
  if (!requireGroupMembership(group, req.user.id)) {
    return res.status(403).json({ message: 'Join this group to reschedule meetings.' });
  }

  const previous = {
    scheduledAt: meeting.scheduledAt,
    title: meeting.title,
    mode: meeting.mode,
    location: meeting.location,
    meetingLink: meeting.meetingLink,
  };

  if (req.body.title?.trim()) meeting.title = req.body.title.trim();
  if (req.body.scheduledAt && !Number.isNaN(new Date(req.body.scheduledAt).getTime())) {
    meeting.scheduledAt = new Date(req.body.scheduledAt).toISOString();
  }
  if (['online', 'campus', 'hybrid'].includes(req.body.mode)) meeting.mode = req.body.mode;
  if (typeof req.body.location === 'string') meeting.location = req.body.location.trim();
  if (typeof req.body.meetingLink === 'string') meeting.meetingLink = req.body.meetingLink.trim();
  if (typeof req.body.notes === 'string') meeting.notes = req.body.notes.trim();
  if (req.body.durationMinutes) {
    const duration = Number.parseInt(req.body.durationMinutes, 10);
    if (!Number.isNaN(duration)) meeting.durationMinutes = Math.min(Math.max(duration, 15), 240);
  }

  meeting.history = meeting.history || [];
  meeting.history.unshift({
    changedBy: req.user.id,
    changedByName: req.user.name,
    previous,
    reason: req.body.reason?.trim() || 'Rescheduled',
    at: new Date(),
  });
  if (meeting.history.length > 10) meeting.history.length = 10;
  meeting.updatedAt = new Date();
  group.nextSession = new Date(meeting.scheduledAt).toLocaleString();

  group.members
    .filter((memberId) => memberId !== req.user.id)
    .forEach((memberId) => {
      recordNotification({
        userId: memberId,
        title: 'Meeting rescheduled',
        message: `${req.user.name} updated "${meeting.title}" in ${group.name}.`,
        type: 'info',
      });
    });

  recordActivity(req.user.id, 'Meeting rescheduled', `You updated "${meeting.title}" in ${group.name}.`);
  res.json({ message: 'Meeting updated.', meeting: serializeMeeting(meeting, req.user.id) });
});

app.post('/api/groups/:id/meetings/:meetingId/rsvp', verifyToken, (req, res) => {
  const group = groups.find((item) => item.id === req.params.id);
  const meeting = groupMeetings.find(
    (item) => item.id === req.params.meetingId && item.groupId === req.params.id
  );
  const status = req.body.status;

  if (!group || !meeting) {
    return res.status(404).json({ message: 'Meeting not found.' });
  }
  if (!requireGroupMembership(group, req.user.id)) {
    return res.status(403).json({ message: 'Join this group to RSVP.' });
  }
  if (!['going', 'maybe', 'not_going'].includes(status)) {
    return res.status(400).json({ message: 'RSVP must be going, maybe, or not_going.' });
  }

  meeting.rsvps = meeting.rsvps || {};
  meeting.rsvps[req.user.id] = status;
  meeting.updatedAt = new Date();

  res.json({ message: `RSVP saved as ${status.replace('_', ' ')}.`, meeting: serializeMeeting(meeting, req.user.id) });
});

app.post('/api/groups/:id/method-ratings', verifyToken, (req, res) => {
  const group = groups.find((item) => item.id === req.params.id);
  const method = req.body.method?.trim();
  const score = Number.parseInt(req.body.score, 10);
  const comment = req.body.comment?.trim() || '';

  if (!group) {
    return res.status(404).json({ message: 'Study group not found.' });
  }
  if (!requireGroupMembership(group, req.user.id)) {
    return res.status(403).json({ message: 'Join this group to rate study methods.' });
  }
  if (!method || Number.isNaN(score) || score < 1 || score > 5) {
    return res.status(400).json({ message: 'Choose a study method and a score from 1 to 5.' });
  }

  const existing = methodRatings.find(
    (item) => item.groupId === group.id && item.userId === req.user.id && item.method === method
  );

  if (existing) {
    existing.score = score;
    existing.comment = comment;
    existing.updatedAt = new Date();
  } else {
    methodRatings.push({
      id: crypto.randomUUID(),
      groupId: group.id,
      userId: req.user.id,
      method,
      score,
      comment,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  recordActivity(req.user.id, 'Study method rated', `You rated "${method}" in ${group.name}.`);
  res.status(201).json({
    message: 'Study method feedback saved.',
    methodRatings: methodRatingSummary(group.id),
    myMethodRatings: methodRatings
      .filter((item) => item.groupId === group.id && item.userId === req.user.id)
      .map((item) => ({ method: item.method, score: item.score, comment: item.comment || '' })),
  });
});

app.patch('/api/groups/:id/how-we-meet', verifyToken, (req, res) => {
  const group = groups.find((item) => item.id === req.params.id);

  if (!group) {
    return res.status(404).json({ message: 'Study group not found.' });
  }
  if (!requireGroupMembership(group, req.user.id)) {
    return res.status(403).json({ message: 'Join this group to update meeting details.' });
  }

  if (['online', 'campus', 'hybrid'].includes(req.body.meetingMode)) {
    group.meetingMode = req.body.meetingMode;
  }
  if (typeof req.body.meetingLink === 'string') group.meetingLink = req.body.meetingLink.trim();
  if (typeof req.body.campusLocation === 'string') group.campusLocation = req.body.campusLocation.trim();
  if (typeof req.body.nextSession === 'string') group.nextSession = req.body.nextSession.trim();
  if (Array.isArray(req.body.preferredMethods)) {
    group.preferredMethods = req.body.preferredMethods.map((item) => String(item).trim()).filter(Boolean).slice(0, 8);
  }

  recordActivity(req.user.id, 'Group meeting plan updated', `You updated how "${group.name}" meets.`);
  res.json({ message: 'How we meet updated.', group: serializeGroup(group, req.user.id) });
});

// Activity Routes
app.get('/api/activity', verifyToken, (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 10;
  const activity = activityLog
    .filter((item) => item.userId === req.user.id)
    .slice(0, limit)
    .map(({ id, title, message, timestamp }) => ({ id, title, message, timestamp }));
  res.json(activity);
});

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied.' });
  }
  next();
};

// Authenticated users can report issues; admins manage the queue.
app.post('/api/errors', verifyToken, (req, res) => {
  const title = req.body.title?.trim();
  const message = req.body.message?.trim();
  const severity = ['low', 'medium', 'high'].includes(req.body.severity) ? req.body.severity : 'medium';

  if (!title || !message) {
    return res.status(400).json({ message: 'Provide an error title and description.' });
  }

  const report = recordError({
    title,
    message,
    source: 'user',
    severity,
    userId: req.user.id,
    pathName: req.body.path || null,
  });

  res.status(201).json({ message: 'Issue reported to administrators.', report });
});

// Admin Routes
app.get('/api/admin/users', verifyToken, requireAdmin, (req, res) => {
  const role = req.query.role;
  const status = req.query.status;
  let list = users.map(serializeAdminUser);

  if (role) list = list.filter((user) => user.role === role);
  if (status) list = list.filter((user) => user.status === status);

  list.sort((a, b) => {
    const aTime = a.lastLoginAt ? new Date(a.lastLoginAt).getTime() : 0;
    const bTime = b.lastLoginAt ? new Date(b.lastLoginAt).getTime() : 0;
    return bTime - aTime;
  });

  res.json(list);
});

app.get('/api/admin/users/:id', verifyToken, requireAdmin, (req, res) => {
  const user = findUserById(req.params.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  const recentLogins = loginEvents
    .filter((event) => event.userId === user.id)
    .slice(0, 10);
  const recentActivity = activityLog
    .filter((item) => item.userId === user.id)
    .slice(0, 10)
    .map(({ id, title, message, timestamp }) => ({ id, title, message, timestamp }));
  const userGroups = groups
    .filter((group) => group.members.includes(user.id))
    .map((group) => serializeGroup(group, user.id));
  const userNotes = notes
    .filter((note) => note.uploadedBy === user.id)
    .map((note) => ({ id: note.id, title: note.title, unitCode: note.unitCode, createdAt: note.createdAt }));

  res.json({
    ...serializeAdminUser(user),
    groups: userGroups,
    notes: userNotes,
    recentLogins,
    recentActivity,
  });
});

app.patch('/api/admin/users/:id', verifyToken, requireAdmin, (req, res) => {
  const user = findUserById(req.params.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  if (user.id === req.user.id && req.body.status === 'suspended') {
    return res.status(400).json({ message: 'You cannot suspend your own admin account.' });
  }
  if (user.id === req.user.id && req.body.role && req.body.role !== 'admin') {
    return res.status(400).json({ message: 'You cannot remove your own admin role.' });
  }

  if (typeof req.body.name === 'string' && req.body.name.trim()) {
    user.name = req.body.name.trim();
  }
  if (req.body.role === 'admin' || req.body.role === 'student') {
    user.role = req.body.role;
  }
  if (req.body.status === 'active' || req.body.status === 'suspended') {
    user.status = req.body.status;
  }

  recordActivity(req.user.id, 'Admin update', `Updated account for ${user.email}.`);
  res.json({ message: 'User updated successfully.', user: serializeAdminUser(user) });
});

app.post('/api/admin/users/:id/reset-password', verifyToken, requireAdmin, async (req, res) => {
  try {
    const user = findUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const temporaryPassword = req.body.password?.trim() || `Temp${Math.random().toString(36).slice(-8)}!`;
    user.password = await bcrypt.hash(temporaryPassword, 10);
    recordActivity(req.user.id, 'Password reset', `Reset password for ${user.email}.`);
    recordError({
      title: 'Password reset issued',
      message: `Admin reset password for ${user.email}.`,
      source: 'admin',
      severity: 'low',
      userId: user.id,
      pathName: `/api/admin/users/${user.id}/reset-password`,
    });

    res.json({
      message: 'Password reset successfully.',
      temporaryPassword,
      user: serializeAdminUser(user),
    });
  } catch (error) {
    res.status(500).json({ message: 'Unable to reset password.' });
  }
});

app.delete('/api/admin/users/:id', verifyToken, requireAdmin, (req, res) => {
  const index = users.findIndex((user) => user.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: 'User not found.' });
  }

  const [user] = users.splice(index, 1);
  if (user.id === req.user.id) {
    users.splice(index, 0, user);
    return res.status(400).json({ message: 'You cannot delete your own admin account.' });
  }

  units.forEach((unit) => {
    unit.enrolledBy = (unit.enrolledBy || []).filter((id) => id !== user.id);
  });
  groups.forEach((group) => {
    group.members = group.members.filter((id) => id !== user.id);
  });

  for (let i = notes.length - 1; i >= 0; i -= 1) {
    if (notes[i].uploadedBy === user.id) {
      if (fs.existsSync(notes[i].filePath)) fs.unlinkSync(notes[i].filePath);
      notes.splice(i, 1);
    }
  }

  recordActivity(req.user.id, 'User deleted', `Deleted account ${user.email}.`);
  res.json({ message: `Deleted ${user.name}.` });
});

app.get('/api/admin/logins', verifyToken, requireAdmin, (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 50;
  res.json(loginEvents.slice(0, limit));
});

app.get('/api/admin/activity', verifyToken, requireAdmin, (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 50;
  const items = activityLog.slice(0, limit).map((item) => {
    const user = findUserById(item.userId);
    return {
      id: item.id,
      title: item.title,
      message: item.message,
      timestamp: item.timestamp,
      userId: item.userId,
      userName: user?.name || 'Unknown user',
      userEmail: user?.email || null,
    };
  });
  res.json(items);
});

app.get('/api/admin/errors', verifyToken, requireAdmin, (req, res) => {
  const status = req.query.status;
  let list = errorReports.map((report) => {
    const user = report.userId ? findUserById(report.userId) : null;
    return {
      ...report,
      userName: user?.name || null,
      userEmail: user?.email || null,
    };
  });
  if (status) list = list.filter((report) => report.status === status);
  res.json(list);
});

app.patch('/api/admin/errors/:id', verifyToken, requireAdmin, (req, res) => {
  const report = errorReports.find((item) => item.id === req.params.id);
  if (!report) {
    return res.status(404).json({ message: 'Error report not found.' });
  }

  if (req.body.status === 'open' || req.body.status === 'resolved') {
    report.status = req.body.status;
    report.resolvedAt = req.body.status === 'resolved' ? new Date() : null;
  }
  if (typeof req.body.resolutionNote === 'string') {
    report.resolutionNote = req.body.resolutionNote.trim();
  }
  if (['low', 'medium', 'high'].includes(req.body.severity)) {
    report.severity = req.body.severity;
  }

  res.json({ message: 'Error report updated.', report });
});

app.post('/api/admin/errors', verifyToken, requireAdmin, (req, res) => {
  const title = req.body.title?.trim();
  const message = req.body.message?.trim();
  if (!title || !message) {
    return res.status(400).json({ message: 'Provide a title and message.' });
  }

  const report = recordError({
    title,
    message,
    source: 'admin',
    severity: ['low', 'medium', 'high'].includes(req.body.severity) ? req.body.severity : 'medium',
    userId: req.body.userId || null,
    pathName: req.body.path || null,
  });

  res.status(201).json({ message: 'Error logged.', report });
});

app.get('/api/admin/groups', verifyToken, requireAdmin, (req, res) => {
  res.json(groups.map((group) => serializeGroup(group, req.user.id)));
});

app.post('/api/admin/groups', verifyToken, requireAdmin, (req, res) => {
  const name = req.body.name?.trim();
  const description = req.body.description?.trim() || '';
  const nextSession = req.body.nextSession?.trim() || 'Schedule coming soon';
  const unitCodes = Array.isArray(req.body.unitCodes)
    ? req.body.unitCodes.map((code) => String(code).trim().toUpperCase()).filter(Boolean)
    : [];

  if (!name) {
    return res.status(400).json({ message: 'Group name is required.' });
  }

  const group = {
    id: `group-${crypto.randomUUID()}`,
    name,
    description,
    members: [],
    nextSession,
    unitCodes,
  };
  groups.push(group);
  res.status(201).json({ message: 'Group created.', group: serializeGroup(group, req.user.id) });
});

app.patch('/api/admin/groups/:id', verifyToken, requireAdmin, (req, res) => {
  const group = groups.find((item) => item.id === req.params.id);
  if (!group) {
    return res.status(404).json({ message: 'Study group not found.' });
  }

  if (typeof req.body.name === 'string' && req.body.name.trim()) group.name = req.body.name.trim();
  if (typeof req.body.description === 'string') group.description = req.body.description.trim();
  if (typeof req.body.nextSession === 'string') group.nextSession = req.body.nextSession.trim();
  if (Array.isArray(req.body.unitCodes)) {
    group.unitCodes = req.body.unitCodes.map((code) => String(code).trim().toUpperCase()).filter(Boolean);
  }

  res.json({ message: 'Group updated.', group: serializeGroup(group, req.user.id) });
});

app.delete('/api/admin/groups/:id', verifyToken, requireAdmin, (req, res) => {
  const index = groups.findIndex((item) => item.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: 'Study group not found.' });
  }
  const [group] = groups.splice(index, 1);
  res.json({ message: `Deleted group "${group.name}".` });
});

app.get('/api/admin/units', verifyToken, requireAdmin, (req, res) => {
  res.json(
    units.map((unit) => ({
      id: unit.id,
      code: unit.code,
      name: unit.name,
      description: unit.description,
      enrolledCount: unit.enrolledBy?.length || 0,
    }))
  );
});

app.post('/api/admin/units', verifyToken, requireAdmin, (req, res) => {
  const code = req.body.code?.trim().toUpperCase();
  const name = req.body.name?.trim();
  const description = req.body.description?.trim() || '';

  if (!code || !name) {
    return res.status(400).json({ message: 'Unit code and name are required.' });
  }
  if (units.some((unit) => unit.code === code)) {
    return res.status(409).json({ message: 'A unit with this code already exists.' });
  }

  const unit = {
    id: units.reduce((max, item) => Math.max(max, item.id), 0) + 1,
    code,
    name,
    description,
    enrolledBy: [],
  };
  units.push(unit);
  res.status(201).json({
    message: 'Unit created.',
    unit: { id: unit.id, code: unit.code, name: unit.name, description: unit.description, enrolledCount: 0 },
  });
});

app.patch('/api/admin/units/:id', verifyToken, requireAdmin, (req, res) => {
  const unit = units.find((item) => item.id === Number.parseInt(req.params.id, 10));
  if (!unit) {
    return res.status(404).json({ message: 'Unit not found.' });
  }

  if (typeof req.body.code === 'string' && req.body.code.trim()) {
    const code = req.body.code.trim().toUpperCase();
    if (units.some((item) => item.code === code && item.id !== unit.id)) {
      return res.status(409).json({ message: 'A unit with this code already exists.' });
    }
    unit.code = code;
  }
  if (typeof req.body.name === 'string' && req.body.name.trim()) unit.name = req.body.name.trim();
  if (typeof req.body.description === 'string') unit.description = req.body.description.trim();

  res.json({
    message: 'Unit updated.',
    unit: {
      id: unit.id,
      code: unit.code,
      name: unit.name,
      description: unit.description,
      enrolledCount: unit.enrolledBy?.length || 0,
    },
  });
});

app.delete('/api/admin/units/:id', verifyToken, requireAdmin, (req, res) => {
  const index = units.findIndex((item) => item.id === Number.parseInt(req.params.id, 10));
  if (index === -1) {
    return res.status(404).json({ message: 'Unit not found.' });
  }
  const [unit] = units.splice(index, 1);
  res.json({ message: `Deleted unit ${unit.code}.` });
});

app.get('/api/admin/password-resets', verifyToken, requireAdmin, (req, res) => {
  const status = req.query.status;
  let list = passwordResetRequests.map((request) => serializePasswordReset(request, { includeOtp: true }));
  if (status) list = list.filter((item) => item.status === status);
  res.json(list);
});

app.post('/api/admin/password-resets/:id/send-otp', verifyToken, requireAdmin, (req, res) => {
  const request = passwordResetRequests.find((item) => item.id === req.params.id);
  if (!request) {
    return res.status(404).json({ message: 'Password reset request not found.' });
  }
  if (request.status === 'completed') {
    return res.status(400).json({ message: 'This reset request was already completed.' });
  }

  const user = findUserById(request.userId);
  if (!user) {
    return res.status(404).json({ message: 'User account no longer exists.' });
  }
  if (user.status === 'suspended') {
    return res.status(400).json({ message: 'Reactivate the account before sending an OTP.' });
  }

  const otp = generateOtp();
  request.otp = otp;
  request.status = 'otp_sent';
  request.otpSentAt = new Date();
  request.expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  recordActivity(req.user.id, 'OTP sent', `Sent password reset OTP to ${user.email}.`);
  recordActivity(user.id, 'OTP ready', 'An administrator sent a password reset OTP for your account.');
  recordNotification({
    userId: user.id,
    email: user.email,
    title: 'Password reset OTP',
    message: `Your one-time code is ${otp}. Use it on the Forgot password page within 15 minutes.`,
    type: 'otp',
    otp,
  });

  res.json({
    message: `OTP sent. ${user.name} will see it as a notification on the Forgot password page.`,
    otp,
    request: serializePasswordReset(request, { includeOtp: true }),
  });
});

app.get('/api/admin/stats', verifyToken, requireAdmin, (req, res) => {
  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const loggedInToday = new Set(
    loginEvents.filter((event) => new Date(event.timestamp).getTime() >= dayAgo).map((event) => event.userId)
  );

  res.json({
    totalUsers: users.length,
    totalStudents: users.filter((user) => user.role === 'student').length,
    totalGroups: groups.length,
    totalUnits: units.length,
    activeUsers: users.filter((user) => user.status !== 'suspended' && user.role === 'student').length,
    suspendedUsers: users.filter((user) => user.status === 'suspended').length,
    loggedInToday: loggedInToday.size,
    openErrors: errorReports.filter((report) => report.status === 'open').length,
    pendingPasswordResets: passwordResetRequests.filter((item) => ['pending', 'otp_sent'].includes(item.status)).length,
    totalNotes: notes.length,
  });
});

// ---- Subject interests (catalog + matching) ----
app.get('/api/interests/all', (_req, res) => {
  res.json(store.allInterests());
});

app.get('/api/interests/my-interests', verifyToken, (req, res) => {
  res.json(store.myInterests(req.user.id));
});

app.post('/api/interests/add', verifyToken, (req, res) => {
  const interestId = req.body.interestId || req.body.interest_id;
  if (!interestId) {
    return res.status(400).json({ message: 'interestId is required.' });
  }

  const interest = store.findInterest(interestId);
  if (!interest) {
    return res.status(404).json({ message: 'Interest not found.' });
  }

  if (store.hasUserInterest(req.user.id, interestId)) {
    return res.status(409).json({ message: 'Interest already selected.' });
  }

  const rowId = crypto.randomUUID();
  store.addUserInterest(rowId, req.user.id, interestId);
  userInterests.push({ id: rowId, userId: req.user.id, interestId });

  recordActivity(req.user.id, 'Interest added', `You added ${interest.name} to your subjects.`);
  res.status(201).json({ message: 'Interest added.', interest });
});

app.delete('/api/interests/remove/:interestId', verifyToken, (req, res) => {
  const removed = store.removeUserInterest(req.user.id, req.params.interestId);
  if (!removed) {
    return res.status(404).json({ message: 'Interest was not in your list.' });
  }

  const index = userInterests.findIndex(
    (row) => row.userId === req.user.id && row.interestId === req.params.interestId
  );
  if (index !== -1) userInterests.splice(index, 1);

  const interest = store.findInterest(req.params.interestId);
  if (interest) {
    recordActivity(req.user.id, 'Interest removed', `You removed ${interest.name} from your subjects.`);
  }
  res.json({ message: 'Interest removed.' });
});

app.get('/api/interests/find-matches', verifyToken, (req, res) => {
  res.json(store.findInterestMatches(req.user.id));
});

seedDemoData()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Database file: ${store.path}`);
      console.log('Demo accounts: admin@studymatch.com / admin123');
      console.log('Classmates (password123): maya@example.com, leo@example.com, sara@example.com, noah@example.com, aisha@example.com, jordan@example.com');
    });
  })
  .catch((error) => {
    console.error('Failed to seed demo data:', error);
    process.exit(1);
  });
