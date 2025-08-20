import * as SQLite from 'expo-sqlite';

// Open SQLite database for the app
const db = SQLite.openDatabase('cashalyst.db');

export const initDatabase = () => {
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        // Create transactions table with all necessary fields
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS transactions (
            id TEXT PRIMARY KEY,
            amount REAL NOT NULL,
            type TEXT NOT NULL,
            category TEXT NOT NULL,
            source TEXT NOT NULL,
            sourceId TEXT,
            note TEXT,
            date TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
          );`
        );
        
        // Migration: add sourceId column if not present for backward compatibility
        tx.executeSql(
          `PRAGMA table_info(transactions);`,
          [],
          (_, { rows }) => {
            const hasSourceId = rows._array.some(col => col.name === 'sourceId');
            if (!hasSourceId) {
              tx.executeSql('ALTER TABLE transactions ADD COLUMN sourceId TEXT;');
            }
          }
        );

        // Create accounts table for storing financial accounts
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS accounts (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            balance REAL DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
          );`
        );

        // Insert default accounts if they don't exist (Cash, GPay, Bank)
        tx.executeSql(
          `INSERT OR IGNORE INTO accounts (id, name, balance) VALUES 
           ('cash', 'Cash', 0),
           ('gpay', 'GPay', 0),
           ('bank', 'Bank', 0);`
        );
      },
      (error) => {
        console.error('Database initialization error:', error);
        reject(error);
      },
      () => {
        console.log('Database initialized successfully');
        resolve();
      }
    );
  });
};

export default db; 