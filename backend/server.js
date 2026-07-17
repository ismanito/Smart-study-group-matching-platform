const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

app.use(express.json());
app.use(cors());

// In-memory database (replace with real database in production)
const users = [];
const groups = [];
const units = [
  { id: 1, code: 'CIS301', name: 'Data Structures', description: 'Learn fundamental data structures' },
  { id: 2, code: 'CIS201', name: 'Algorithms', description: 'Algorithm design and analysis' },
  { id: 3, code: 'MATH201', name: 'Linear Algebra', description: 'Matrix operations and theory' },
  { id: 4, code: 'CIS401', name: 'Operating Systems', description: 'OS concepts and design' },
  { id: 5, code: 'CIS501', name: 'Database Design', description: 'Database architecture and SQL' },
];

// Authentication Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields.' });
    }

    if (users.find((u) => u.email === email)) {
      return res.status(409).json({ message: 'Email already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = {
      id: `user-${Date.now()}`,
      name,
      email,
      password: hashedPassword,
      role: role?.toLowerCase() || 'student',
      createdAt: new Date(),
    };

    users.push(user);

    const token = jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role }, JWT_SECRET, {
      expiresIn: '7d',
    });

    res.status(201).json({ message: 'Registration successful!', token });
  } catch (error) {
    res.status(500).json({ message: 'Server error during registration.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password.' });
    }

    const user = users.find((u) => u.email === email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role }, JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({ message: 'Login successful!', token });
  } catch (error) {
    res.status(500).json({ message: 'Server error during login.' });
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
    req.user = decoded;
    next();
  });
};

// Dashboard Routes
app.get('/api/dashboard/summary', verifyToken, (req, res) => {
  const userGroups = groups.filter((g) => g.members.includes(req.user.id));
  const userUnits = units.filter((u) => u.enrolledBy?.includes(req.user.id));

  res.json({
    groupsCount: userGroups.length,
    peersCount: Math.floor(Math.random() * 10) + 1,
    notesCount: Math.floor(Math.random() * 20) + 1,
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
  const unit = units.find((u) => u.id === parseInt(unitId));

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
  res.json({ message: 'Enrolled successfully!', unit });
});

// Matching Routes
app.get('/api/match', verifyToken, (req, res) => {
  const userUnits = units.filter((u) => u.enrolledBy?.includes(req.user.id));
  const matchedPeers = users
    .filter((u) => u.id !== req.user.id)
    .slice(0, 5)
    .map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      sharedUnits: userUnits.slice(0, 2).map((unit) => unit.code),
    }));

  res.json(matchedPeers);
});

app.post('/api/invite', verifyToken, (req, res) => {
  const { peerId, groupId } = req.body;
  res.json({ message: 'Invitation sent successfully!' });
});

// Groups Routes
app.get('/api/groups', verifyToken, (req, res) => {
  const userGroups = groups.filter((g) => g.members.includes(req.user.id));
  res.json(userGroups);
});

// Activity Routes
app.get('/api/activity', verifyToken, (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const activity = [
    { id: 1, title: 'Joined Study Group', message: 'You joined "Data Structures Study" group', timestamp: new Date() },
    { id: 2, title: 'New Match Found', message: 'You matched with Alex on CIS301', timestamp: new Date(Date.now() - 3600000) },
    { id: 3, title: 'Notes Uploaded', message: 'Sarah uploaded notes for CIS301', timestamp: new Date(Date.now() - 7200000) },
  ];
  res.json(activity.slice(0, limit));
});

// Admin Routes
app.get('/api/admin/users', verifyToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied.' });
  }
  res.json(users.map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, createdAt: u.createdAt })));
});

app.get('/api/admin/groups', verifyToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied.' });
  }
  res.json(groups);
});

app.get('/api/admin/stats', verifyToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied.' });
  }
  res.json({
    totalUsers: users.length,
    totalGroups: groups.length,
    totalUnits: units.length,
    activeUsers: Math.floor(users.length * 0.7),
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
