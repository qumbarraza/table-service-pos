const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const { seedDatabase } = require('./seed');

const configuredDatabasePath = process.env.TABLESERVE_DB_PATH;
const databasePath = configuredDatabasePath || path.join(__dirname, 'tableserve.sqlite');
const databaseDir = path.dirname(databasePath);
const schemaPath = path.join(__dirname, '..', 'schema', 'schema.sql');

fs.mkdirSync(databaseDir, { recursive: true });

const db = new Database(databasePath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(fs.readFileSync(schemaPath, 'utf8'));
seedDatabase(db);

module.exports = db;
