const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const dataDir = path.join(__dirname, 'data');
fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, 'studymatch.json');

const DEFAULT_INTERESTS = [
  { id: 'int-math', name: 'Math', icon: '📐' },
  { id: 'int-physics', name: 'Physics', icon: '⚛️' },
  { id: 'int-chemistry', name: 'Chemistry', icon: '🧪' },
  { id: 'int-biology', name: 'Biology', icon: '🧬' },
  { id: 'int-cs', name: 'Computer Science', icon: '💻' },
  { id: 'int-literature', name: 'Literature', icon: '📚' },
  { id: 'int-history', name: 'History', icon: '🏛️' },
  { id: 'int-economics', name: 'Economics', icon: '📊' },
  { id: 'int-psychology', name: 'Psychology', icon: '🧠' },
  { id: 'int-engineering', name: 'Engineering', icon: '⚙️' },
  { id: 'int-art', name: 'Art', icon: '🎨' },
  { id: 'int-music', name: 'Music', icon: '🎵' },
];

function emptyState() {
  return {
    users: [],
    interests: DEFAULT_INTERESTS.map((item) => ({ ...item })),
    userInterests: [],
  };
}

function loadState() {
  if (!fs.existsSync(dbPath)) {
    const initial = emptyState();
    fs.writeFileSync(dbPath, JSON.stringify(initial, null, 2), 'utf8');
    return initial;
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    const state = {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      interests: Array.isArray(parsed.interests) && parsed.interests.length
        ? parsed.interests
        : DEFAULT_INTERESTS.map((item) => ({ ...item })),
      userInterests: Array.isArray(parsed.userInterests) ? parsed.userInterests : [],
    };

    const knownIds = new Set(state.interests.map((item) => item.id));
    for (const interest of DEFAULT_INTERESTS) {
      if (!knownIds.has(interest.id)) {
        state.interests.push({ ...interest });
      }
    }

    return state;
  } catch (_error) {
    const fallback = emptyState();
    fs.writeFileSync(dbPath, JSON.stringify(fallback, null, 2), 'utf8');
    return fallback;
  }
}

let state = loadState();

function persist() {
  fs.writeFileSync(dbPath, JSON.stringify(state, null, 2), 'utf8');
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function mapUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    password: row.passwordHash,
    role: row.role,
    status: row.status,
    bio: row.bio || '',
    interests: Array.isArray(row.interests) ? row.interests : [],
    studyMethods: Array.isArray(row.studyMethods) ? row.studyMethods : [],
    availability: Array.isArray(row.availability) ? row.availability : [],
    loginCount: row.loginCount || 0,
    lastLoginAt: row.lastLoginAt ? new Date(row.lastLoginAt) : null,
    createdAt: row.createdAt ? new Date(row.createdAt) : new Date(),
  };
}

function findInterestById(id) {
  return state.interests.find((item) => item.id === id) || null;
}

const api = {
  path: dbPath,

  userCount() {
    return state.users.length;
  },

  findUserByEmail(email) {
    const target = String(email || '').toLowerCase();
    return mapUser(state.users.find((user) => String(user.email).toLowerCase() === target));
  },

  findUserById(id) {
    return mapUser(state.users.find((user) => user.id === id));
  },

  listUsers() {
    return [...state.users]
      .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
      .map(mapUser);
  },

  createUser(user) {
    const record = {
      id: user.id,
      name: user.name,
      email: user.email,
      passwordHash: user.password,
      role: user.role || 'student',
      status: user.status || 'active',
      bio: user.bio || '',
      interests: Array.isArray(user.interests) ? user.interests : [],
      studyMethods: Array.isArray(user.studyMethods) ? user.studyMethods : [],
      availability: Array.isArray(user.availability) ? user.availability : [],
      loginCount: user.loginCount || 0,
      lastLoginAt: user.lastLoginAt ? new Date(user.lastLoginAt).toISOString() : null,
      createdAt: (user.createdAt ? new Date(user.createdAt) : new Date()).toISOString(),
    };

    state.users.push(record);
    persist();
    return api.findUserById(user.id);
  },

  saveLogin(user) {
    const row = state.users.find((item) => item.id === user.id);
    if (!row) return;
    row.loginCount = user.loginCount || 0;
    row.lastLoginAt = user.lastLoginAt ? new Date(user.lastLoginAt).toISOString() : null;
    persist();
  },

  updatePassword(userId, passwordHash) {
    const row = state.users.find((item) => item.id === userId);
    if (!row) return;
    row.passwordHash = passwordHash;
    persist();
  },

  updateProfile(user) {
    const row = state.users.find((item) => item.id === user.id);
    if (!row) return;
    row.name = user.name;
    row.bio = user.bio || '';
    row.interests = Array.isArray(user.interests) ? user.interests : [];
    row.studyMethods = Array.isArray(user.studyMethods) ? user.studyMethods : [];
    row.availability = Array.isArray(user.availability) ? user.availability : [];
    persist();
  },

  updateUserAdmin(user) {
    const row = state.users.find((item) => item.id === user.id);
    if (!row) return;
    row.name = user.name;
    row.role = user.role;
    row.status = user.status;
    persist();
  },

  deleteUser(userId) {
    state.users = state.users.filter((item) => item.id !== userId);
    state.userInterests = state.userInterests.filter((item) => item.userId !== userId);
    persist();
  },

  allInterests() {
    return clone([...state.interests].sort((a, b) => a.name.localeCompare(b.name)));
  },

  findInterest(id) {
    const interest = findInterestById(id);
    return interest ? clone(interest) : null;
  },

  myInterests(userId) {
    const ids = state.userInterests
      .filter((row) => row.userId === userId)
      .map((row) => row.interestId);
    return clone(
      state.interests
        .filter((interest) => ids.includes(interest.id))
        .sort((a, b) => a.name.localeCompare(b.name))
    );
  },

  addUserInterest(id, userId, interestId) {
    state.userInterests.push({
      id: id || crypto.randomUUID(),
      userId,
      interestId,
      createdAt: new Date().toISOString(),
    });
    persist();
  },

  removeUserInterest(userId, interestId) {
    const before = state.userInterests.length;
    state.userInterests = state.userInterests.filter(
      (row) => !(row.userId === userId && row.interestId === interestId)
    );
    const changed = state.userInterests.length !== before;
    if (changed) persist();
    return changed;
  },

  hasUserInterest(userId, interestId) {
    return state.userInterests.some((row) => row.userId === userId && row.interestId === interestId);
  },

  findInterestMatches(userId) {
    const myIds = new Set(
      state.userInterests.filter((row) => row.userId === userId).map((row) => row.interestId)
    );

    if (!myIds.size) return [];

    const byUser = new Map();
    for (const row of state.userInterests) {
      if (row.userId === userId || !myIds.has(row.interestId)) continue;
      if (!byUser.has(row.userId)) byUser.set(row.userId, new Set());
      byUser.get(row.userId).add(row.interestId);
    }

    const matches = [];
    for (const [peerId, sharedIds] of byUser.entries()) {
      const peer = state.users.find((user) => user.id === peerId);
      if (!peer || peer.role !== 'student' || peer.status === 'suspended') continue;

      const sharedInterests = state.interests
        .filter((interest) => sharedIds.has(interest.id))
        .sort((a, b) => a.name.localeCompare(b.name));

      matches.push({
        id: peer.id,
        name: peer.name,
        email: peer.email,
        bio: peer.bio || '',
        profilePicture: null,
        sharedCount: sharedInterests.length,
        sharedInterests: clone(sharedInterests),
      });
    }

    return matches.sort(
      (a, b) => b.sharedCount - a.sharedCount || a.name.localeCompare(b.name)
    );
  },
};

module.exports = api;
