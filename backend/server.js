const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

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
const groups = [
  {
    id: 'group-cis301-evening',
    name: 'CIS301 Evening Crew',
    description: 'Work through data structures problem sets with a focused evening study rhythm.',
    members: [],
    nextSession: 'Tuesdays · 6:00 PM',
    unitCodes: ['CIS301'],
  },
  {
    id: 'group-cis201-algorithms',
    name: 'Algorithms Practice Lab',
    description: 'Share walkthroughs and solve weekly algorithm challenges together.',
    members: [],
    nextSession: 'Wednesdays · 5:30 PM',
    unitCodes: ['CIS201'],
  },
  {
    id: 'group-math201-foundations',
    name: 'Linear Algebra Foundations',
    description: 'Build confidence with matrix operations, proofs, and exam preparation.',
    members: [],
    nextSession: 'Thursdays · 4:00 PM',
    unitCodes: ['MATH201'],
  },
];
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
      id: `user-${crypto.randomUUID()}`,
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
    peersCount: peerDecisions.filter((decision) => decision.userId === req.user.id && decision.decision === 'match').length,
    notesCount: notes.filter((note) => note.uploadedBy === req.user.id).length,
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
  const enrolledUnitIds = new Set(
    units.filter((unit) => unit.enrolledBy?.includes(req.user.id)).map((unit) => unit.id)
  );

  const matchedPeers = users
    .filter((user) => user.id !== req.user.id)
    .map((user) => {
      const sharedUnits = units.filter(
        (unit) => enrolledUnitIds.has(unit.id) && unit.enrolledBy?.includes(user.id)
      );

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        sharedUnits: sharedUnits.map((unit) => unit.code),
      };
    })
    .filter((peer) => peer.sharedUnits.length > 0)
    .filter(
      (peer) => !peerDecisions.some(
        (decision) => decision.userId === req.user.id && decision.peerId === peer.id
      )
    )
    .slice(0, 5);

  res.json(matchedPeers);
});

app.get('/api/match/confirmed', verifyToken, (req, res) => {
  const enrolledUnitIds = new Set(
    units.filter((unit) => unit.enrolledBy?.includes(req.user.id)).map((unit) => unit.id)
  );
  const confirmedPeerIds = new Set(
    peerDecisions
      .filter((decision) => decision.userId === req.user.id && decision.decision === 'match')
      .map((decision) => decision.peerId)
  );

  const confirmedMatches = users
    .filter((user) => confirmedPeerIds.has(user.id))
    .map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      sharedUnits: units
        .filter((unit) => enrolledUnitIds.has(unit.id) && unit.enrolledBy?.includes(user.id))
        .map((unit) => unit.code),
    }))
    .filter((peer) => peer.sharedUnits.length > 0);

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

  res.json({
    message: decision === 'match' ? `You matched with ${peer.name}.` : `You passed on ${peer.name}.`,
    decision,
  });
});

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

  res.json({ message: `Invitation sent to ${peer.name}.` });
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

const serializeNote = (note) => ({
  id: note.id,
  title: note.title,
  unitId: note.unitId,
  unitCode: note.unitCode,
  filename: note.filename,
  fileSize: note.fileSize,
  createdAt: note.createdAt,
});

app.get('/api/notes', verifyToken, (req, res) => {
  res.json(
    notes
      .filter((note) => note.uploadedBy === req.user.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map(serializeNote)
  );
});

app.post('/api/notes', verifyToken, uploadNoteFile, (req, res) => {
  const title = req.body.title?.trim();
  const unitId = Number.parseInt(req.body.unitId, 10);
  const unit = units.find((item) => item.id === unitId);

  if (!title || title.length > 120) {
    if (req.file) fs.unlinkSync(req.file.path);
    return res.status(400).json({ message: 'Add a note title between 1 and 120 characters.' });
  }

  if (!unit || !unit.enrolledBy?.includes(req.user.id)) {
    if (req.file) fs.unlinkSync(req.file.path);
    return res.status(400).json({ message: 'Choose one of your enrolled courses.' });
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
    createdAt: new Date(),
  };

  notes.push(note);
  res.status(201).json({ message: 'Note uploaded successfully.', note: serializeNote(note) });
});

app.get('/api/notes/:id/download', verifyToken, (req, res) => {
  const note = notes.find((item) => item.id === req.params.id && item.uploadedBy === req.user.id);

  if (!note) {
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
const serializeGroup = (group, userId) => ({
  ...group,
  memberCount: group.members.length,
  isMember: group.members.includes(userId),
});

app.get('/api/groups', verifyToken, (req, res) => {
  const userGroups = groups
    .filter((group) => group.members.includes(req.user.id))
    .map((group) => serializeGroup(group, req.user.id));
  res.json(userGroups);
});

app.get('/api/groups/discoverable', verifyToken, (req, res) => {
  res.json(groups.map((group) => serializeGroup(group, req.user.id)));
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
  res.status(201).json({
    message: 'You joined the study group!',
    group: serializeGroup(group, req.user.id),
  });
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
