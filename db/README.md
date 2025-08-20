# Database Layer

This directory contains the database layer for the Cashalyst app, providing data persistence and management for transactions, accounts, and analytics.

## Overview

The database layer supports two storage systems:
- **AsyncStorage** - For simple key-value storage using React Native's AsyncStorage
- **SQLite** - For structured database operations using expo-sqlite

All functions are designed to be:
- **Consistent** across both storage systems
- **Error-handled** with proper try-catch blocks
- **Backward compatible** with legacy data formats
- **Type-safe** with clear parameter definitions

## Storage Systems

### AsyncStorage (`asyncStorageService.js`)
Uses React Native's AsyncStorage for simple JSON-based data persistence.

**Key Features:**
- JSON serialization/deserialization
- Automatic error handling
- Migration support for data schema updates
- Backup and restore capabilities

### SQLite (`transactionService.js` + `initDB.js`)
Uses expo-sqlite for structured database operations with SQL queries.

**Key Features:**
- ACID-compliant transactions
- Structured data with proper relationships
- Complex queries and analytics
- Migration support for schema changes

## Files

### `asyncStorageService.js`
AsyncStorage-based data management with JSON serialization.

**Key Functions:**
- `initDatabase()` - Initialize storage with empty arrays
- `addTransaction()` - Add new transaction and update account balance
- `getTransactions()` - Retrieve transactions with filtering
- `deleteTransaction()` - Remove transaction and reverse balance changes
- `updateTransaction()` - Modify existing transaction with balance updates
- `getAccounts()` - Retrieve all accounts
- `addAccount()` - Create new account with duplicate prevention
- `updateAccount()` - Modify account details
- `deleteAccount()` - Remove account from storage
- `updateAccountBalance()` - Update account balance directly
- `getMonthlyStats()` - Calculate monthly income/expense statistics
- `getCategoryStats()` - Group expenses by category for analytics
- `migrateAccounts()` - Ensure data integrity and unique IDs
- `migrateTransactionsAddSourceId()` - Add sourceId to legacy transactions

**Usage:**
```javascript
import { addTransaction, getTransactions } from './db/asyncStorageService';

// Add a new transaction
await addTransaction({
  id: 'txn_123',
  amount: 100,
  type: 'expense',
  category: 'Food',
  source: 'Cash',
  sourceId: 'cash',
  note: 'Lunch',
  date: '2024-01-15'
});

// Get filtered transactions
const transactions = await getTransactions({
  type: 'expense',
  startDate: '2024-01-01',
  endDate: '2024-01-31'
});
```

### `initDB.js`
SQLite database initialization and schema management.

**Key Functions:**
- `initDatabase()` - Create tables and insert default data
- Database schema management
- Migration support for schema changes

**Database Schema:**
```sql
-- Transactions table
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  amount REAL NOT NULL,
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  source TEXT NOT NULL,
  sourceId TEXT,
  note TEXT,
  date TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Accounts table
CREATE TABLE accounts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  balance REAL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### `transactionService.js`
SQLite-based transaction and account operations.

**Key Functions:**
- `addTransaction()` - Insert transaction and update account balance
- `getTransactions()` - Query transactions with SQL filters
- `deleteTransaction()` - Remove transaction and reverse balance
- `getAccounts()` - Retrieve all accounts ordered by name
- `addAccount()` - Insert new account into database
- `updateAccountBalance()` - Update account balance directly
- `getMonthlyStats()` - Calculate monthly statistics using SQL
- `getCategoryStats()` - Group expenses by category using SQL
- `migrateTransactionsAddSourceId()` - Update legacy transactions

**Usage:**
```javascript
import { addTransaction, getMonthlyStats } from './db/transactionService';

// Add transaction to SQLite
await addTransaction({
  id: 'txn_123',
  amount: 100,
  type: 'expense',
  category: 'Food',
  source: 'Cash',
  sourceId: 'cash',
  note: 'Lunch',
  date: '2024-01-15'
});

// Get monthly statistics
const stats = await getMonthlyStats(2024, 1);
// Returns: { income: 5000, expenses: 3000, savings: 2000 }
```

## Data Models

### Transaction
```javascript
{
  id: string,           // Unique transaction ID
  amount: number,       // Transaction amount
  type: 'income' | 'expense',
  category: string,     // Transaction category
  source: string,       // Account name (legacy)
  sourceId: string,     // Account ID (preferred)
  note: string,         // Optional transaction note
  date: string,         // Date in YYYY-MM-DD format
  created_at: string    // Timestamp
}
```

### Account
```javascript
{
  id: string,           // Unique account ID
  name: string,         // Account name
  balance: number,      // Current balance
  created_at: string    // Timestamp
}
```

## Migration System

The database layer includes migration functions to handle schema updates:

### `migrateAccounts()`
- Ensures all accounts have unique IDs
- Removes duplicate accounts by name
- Generates new IDs for accounts without them

### `migrateTransactionsAddSourceId()`
- Adds `sourceId` field to legacy transactions
- Maps account names to account IDs
- Maintains backward compatibility

## Analytics Functions

### Monthly Statistics
- `getMonthlyStats(year, month)` - Calculate income, expenses, and savings
- Returns: `{ income: number, expenses: number, savings: number }`

### Category Statistics
- `getCategoryStats(year, month)` - Group expenses by category
- Returns: `[{ category: string, total: number }]` sorted by amount

## Error Handling

All functions include comprehensive error handling:
- Database connection errors
- Data validation errors
- Migration failures
- Storage quota exceeded
- Invalid data formats

## Contributing

When adding new database functions:
1. Follow the existing naming conventions
2. Include proper error handling
3. Add migration support if schema changes
4. Maintain backward compatibility
5. Add comprehensive comments
6. Test with both storage systems
7. Update this README with new functions

## Dependencies

- `@react-native-async-storage/async-storage` - For AsyncStorage operations
- `expo-sqlite` - For SQLite database operations
- `../utils/formatCurrency` - For ID generation

## File Structure

```
db/
├── asyncStorageService.js  # AsyncStorage operations
├── initDB.js              # SQLite initialization
├── transactionService.js   # SQLite operations
└── README.md             # This file
```

## Best Practices

1. **Always use transactions** for multi-step operations
2. **Handle errors gracefully** with proper logging
3. **Validate data** before storage operations
4. **Use migrations** for schema changes
5. **Maintain backward compatibility** with legacy data
6. **Test both storage systems** for consistency
7. **Document new functions** in this README 