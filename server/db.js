const fs = require('fs');
const path = require('path');

const dataDir = path.resolve(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbFilePath = path.resolve(dataDir, 'sugamseva_db.json');

// In-memory database state with persistence
let dbState = {
  users: [],
  fingerprints: [],
  user_applications: [],
  user_documents: []
};

// Load existing database from disk
const loadDb = () => {
  try {
    if (fs.existsSync(dbFilePath)) {
      const rawData = fs.readFileSync(dbFilePath, 'utf8');
      dbState = JSON.parse(rawData);
      console.log(`[DB] Database loaded from ${dbFilePath}. (${dbState.users.length} users registered)`);
    } else {
      saveDb();
      console.log(`[DB] Created new database at ${dbFilePath}`);
    }
  } catch (error) {
    console.error('[DB] Error loading database, initializing fresh state:', error);
  }
};

// Save database to disk atomically
const saveDb = () => {
  try {
    const tempPath = `${dbFilePath}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(dbState, null, 2), 'utf8');
    fs.renameSync(tempPath, dbFilePath);
  } catch (error) {
    console.error('[DB] Error saving database:', error);
  }
};

// Initialize DB
const initDb = async () => {
  loadDb();
};

// Database Query Helpers
const db = {
  // Users
  users: {
    findByPhone: (phone) => dbState.users.find(u => u.phone === phone),
    findById: (id) => dbState.users.find(u => u.id === id),
    create: (user) => {
      dbState.users.push(user);
      saveDb();
      return user;
    },
    update: (id, updates) => {
      const idx = dbState.users.findIndex(u => u.id === id);
      if (idx !== -1) {
        dbState.users[idx] = { ...dbState.users[idx], ...updates, updated_at: new Date().toISOString() };
        saveDb();
        return dbState.users[idx];
      }
      return null;
    },
    all: () => [...dbState.users]
  },

  // Fingerprints
  fingerprints: {
    findByUserId: (userId) => dbState.fingerprints.filter(f => f.user_id === userId).sort((a, b) => a.finger_index - b.finger_index),
    findByUserAndIndex: (userId, fingerIndex) => dbState.fingerprints.find(f => f.user_id === userId && f.finger_index === fingerIndex),
    create: (fp) => {
      dbState.fingerprints.push(fp);
      saveDb();
      return fp;
    },
    createBatch: (fps) => {
      dbState.fingerprints.push(...fps);
      saveDb();
      return fps;
    },
    updateLastVerified: (userId, fingerIndex) => {
      const fp = dbState.fingerprints.find(f => f.user_id === userId && f.finger_index === fingerIndex);
      if (fp) {
        fp.last_verified_at = new Date().toISOString();
        saveDb();
      }
      return fp;
    }
  },

  // Applications
  applications: {
    findByUserId: (userId) => dbState.user_applications.filter(a => a.user_id === userId).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
    create: (app) => {
      dbState.user_applications.push(app);
      saveDb();
      return app;
    }
  },

  // Documents
  documents: {
    findByUserId: (userId) => dbState.user_documents.filter(d => d.user_id === userId),
    create: (doc) => {
      dbState.user_documents.push(doc);
      saveDb();
      return doc;
    },
    createBatch: (docs) => {
      dbState.user_documents.push(...docs);
      saveDb();
      return docs;
    }
  }
};

module.exports = {
  db,
  initDb,
  saveDb
};
