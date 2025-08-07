import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys for AsyncStorage
const TRANSACTIONS_KEY = 'cashalyst_transactions';
const ACCOUNTS_KEY = 'cashalyst_accounts';

// Helper functions for AsyncStorage operations
const getData = async (key) => {
  try {
    // Retrieve JSON string from AsyncStorage and parse it
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error('Error reading data:', error);
    return null;
  }
};

const storeData = async (key, value) => {
  try {
    // Convert data to JSON string and store in AsyncStorage
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
  } catch (error) {
    console.error('Error storing data:', error);
    throw error;
  }
};

// Migration: Add sourceId to all transactions based on source name
export const migrateTransactionsAddSourceId = async () => {
  // Get all transactions and accounts from storage
  const transactions = await getData(TRANSACTIONS_KEY) || [];
  const accounts = await getData(ACCOUNTS_KEY) || [];
  let changed = false;
  
  // Map through transactions and add sourceId if missing
  const migrated = transactions.map(txn => {
    if (!txn.sourceId && txn.source) {
      // Find account by name and add its ID as sourceId
      const acc = accounts.find(acc => acc.name === txn.source);
      if (acc) {
        changed = true;
        return { ...txn, sourceId: acc.id };
      }
    }
    return txn;
  });
  
  // Save migrated transactions if any changes were made
  if (changed) {
    await storeData(TRANSACTIONS_KEY, migrated);
    console.log('Migrated transactions to add sourceId');
  }
};

// Initialize database with default data
export const initDatabase = async () => {
  try {
    // Only initialize empty arrays if not present
    const existingAccounts = await getData(ACCOUNTS_KEY);
    if (!existingAccounts) {
      await storeData(ACCOUNTS_KEY, []); // Initialize empty accounts array
    }
    const existingTransactions = await getData(TRANSACTIONS_KEY);
    if (!existingTransactions) {
      await storeData(TRANSACTIONS_KEY, []); // Initialize empty transactions array
    }
    
    // Run migration functions to ensure data consistency
    await migrateAccounts();
    await migrateTransactionsAddSourceId();
    console.log('AsyncStorage database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
};

// Transaction operations
export const addTransaction = async (transaction) => {
  try {
    // Get current transactions and accounts from storage
    const transactions = await getData(TRANSACTIONS_KEY) || [];
    const accounts = await getData(ACCOUNTS_KEY) || [];
    
    // Find the account by id (prefer sourceId, fallback to name for legacy)
    let accountIndex = -1;
    let sourceId = transaction.sourceId;
    if (!sourceId && transaction.source) {
      // Legacy: find account by name for backward compatibility
      const acc = accounts.find(acc => acc.name === transaction.source);
      if (acc) sourceId = acc.id;
    }
    if (sourceId) {
      accountIndex = accounts.findIndex(acc => acc.id === sourceId);
    }
    
    // Add sourceId to transaction for new/legacy transactions
    const transactionWithId = { ...transaction, sourceId };
    transactions.unshift(transactionWithId); // Add new transaction to beginning of list
    await storeData(TRANSACTIONS_KEY, transactions);
    
    // Update account balance based on transaction type and amount
    if (accountIndex !== -1) {
      const balanceChange = transaction.type === 'income' ? transaction.amount : -transaction.amount;
      accounts[accountIndex].balance += balanceChange;
      await storeData(ACCOUNTS_KEY, accounts);
    }
    
    console.log('Transaction added successfully');
  } catch (error) {
    console.error('Add transaction error:', error);
    throw error;
  }
};

export const getTransactions = async (filters = {}) => {
  try {
    // Get all transactions from storage
    const transactions = await getData(TRANSACTIONS_KEY) || [];
    
    // Start with all transactions and apply filters
    let filtered = [...transactions];
    
    // Filter by transaction type (income/expense)
    if (filters.type) {
      filtered = filtered.filter(t => t.type === filters.type);
    }
    
    // Filter by category
    if (filters.category) {
      filtered = filtered.filter(t => t.category === filters.category);
    }
    
    // Filter by account (prefer sourceId, fallback to source name for legacy)
    if (filters.sourceId) {
      filtered = filtered.filter(t => t.sourceId === filters.sourceId);
    } else if (filters.source) {
      // Legacy: filter by source name for backward compatibility
      filtered = filtered.filter(t => t.source === filters.source);
    }
    
    // Filter by date range
    if (filters.startDate) {
      filtered = filtered.filter(t => t.date >= filters.startDate);
    }
    
    if (filters.endDate) {
      filtered = filtered.filter(t => t.date <= filters.endDate);
    }
    
    return filtered;
  } catch (error) {
    console.error('Get transactions error:', error);
    return [];
  }
};

export const deleteTransaction = async (id) => {
  try {
    // Get current transactions and accounts from storage
    const transactions = await getData(TRANSACTIONS_KEY) || [];
    const accounts = await getData(ACCOUNTS_KEY) || [];
    
    // Find the transaction to delete by ID
    const transactionIndex = transactions.findIndex(t => t.id === id);
    if (transactionIndex === -1) {
      throw new Error('Transaction not found');
    }
    
    const transaction = transactions[transactionIndex];
    
    // Update account balance by reversing the transaction effect
    const accountIndex = accounts.findIndex(acc => acc.id === transaction.sourceId);
    if (accountIndex !== -1) {
      const balanceChange = transaction.type === 'income' ? -transaction.amount : transaction.amount;
      accounts[accountIndex].balance += balanceChange;
      await storeData(ACCOUNTS_KEY, accounts);
    }
    
    // Remove transaction from the array
    transactions.splice(transactionIndex, 1);
    await storeData(TRANSACTIONS_KEY, transactions);
    
    console.log('Transaction deleted successfully');
  } catch (error) {
    console.error('Delete transaction error:', error);
    throw error;
  }
};

// Account operations
export const getAccounts = async () => {
  try {
    // Retrieve all accounts from AsyncStorage
    const accounts = await getData(ACCOUNTS_KEY) || [];
    return accounts;
  } catch (error) {
    console.error('Get accounts error:', error);
    return [];
  }
};

export const addAccount = async (account) => {
  try {
    // Get current accounts from storage
    const accounts = await getData(ACCOUNTS_KEY) || [];
    
    // Prevent duplicate by name (case-insensitive, trimmed)
    const exists = accounts.some(acc => acc.name.trim().toLowerCase() === account.name.trim().toLowerCase());
    if (exists) {
      throw new Error('Account with this name already exists.');
    }
    
    // Add new account to the array
    accounts.push(account);
    await storeData(ACCOUNTS_KEY, accounts);
    console.log('Account added successfully');
  } catch (error) {
    console.error('Add account error:', error);
    throw error;
  }
};

export const updateAccount = async (id, accountData) => {
  try {
    // Get current accounts from storage
    const accounts = await getData(ACCOUNTS_KEY) || [];
    const accountIndex = accounts.findIndex(acc => acc.id === id);
    if (accountIndex === -1) {
      throw new Error('Account not found');
    }
    
    // Update account with new data while preserving existing fields
    accounts[accountIndex] = {
      ...accounts[accountIndex],
      ...accountData,
      id: id // Ensure ID doesn't change
    };
    
    await storeData(ACCOUNTS_KEY, accounts);
    console.log('Account updated successfully');
  } catch (error) {
    console.error('Update account error:', error);
    throw error;
  }
};

export const deleteAccount = async (id) => {
  try {
    // Get current accounts from storage
    const accounts = await getData(ACCOUNTS_KEY) || [];
    const accountIndex = accounts.findIndex(acc => acc.id === id);
    if (accountIndex === -1) {
      throw new Error('Account not found');
    }
    
    // Remove account from the array
    accounts.splice(accountIndex, 1);
    await storeData(ACCOUNTS_KEY, accounts);
    console.log('Account deleted successfully');
  } catch (error) {
    console.error('Delete account error:', error);
    throw error;
  }
};

export const updateAccountBalance = async (id, balance) => {
  try {
    // Get current accounts from storage
    const accounts = await getData(ACCOUNTS_KEY) || [];
    const accountIndex = accounts.findIndex(acc => acc.id === id);
    if (accountIndex !== -1) {
      // Update the account balance
      accounts[accountIndex].balance = balance;
      await storeData(ACCOUNTS_KEY, accounts);
      console.log('Account balance updated successfully');
    }
  } catch (error) {
    console.error('Update account balance error:', error);
    throw error;
  }
};

// Analytics operations
export const getMonthlyStats = async (year, month) => {
  try {
    // Get all transactions from storage
    const transactions = await getData(TRANSACTIONS_KEY) || [];
    
    // Create date range for the specified month
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;
    
    // Filter transactions for the specified month
    const monthlyTransactions = transactions.filter(t => 
      t.date >= startDate && t.date <= endDate
    );
    
    // Calculate total income for the month
    const income = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    // Calculate total expenses for the month
    const expenses = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    // Return monthly statistics
    return {
      income,
      expenses,
      savings: income - expenses
    };
  } catch (error) {
    console.error('Get monthly stats error:', error);
    return { income: 0, expenses: 0, savings: 0 };
  }
};

export const getCategoryStats = async (year, month) => {
  try {
    // Get all transactions from storage
    const transactions = await getData(TRANSACTIONS_KEY) || [];
    
    // Create date range for the specified month
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;
    
    // Filter expense transactions for the specified month
    const monthlyExpenses = transactions.filter(t => 
      t.type === 'expense' && t.date >= startDate && t.date <= endDate
    );
    
    // Group expenses by category and sum amounts
    const categoryMap = {};
    monthlyExpenses.forEach(transaction => {
      if (categoryMap[transaction.category]) {
        categoryMap[transaction.category] += transaction.amount;
      } else {
        categoryMap[transaction.category] = transaction.amount;
      }
    });
    
    // Convert to array and sort by total amount (highest first)
    return Object.entries(categoryMap).map(([category, total]) => ({
      category,
      total
    })).sort((a, b) => b.total - a.total);
  } catch (error) {
    console.error('Get category stats error:', error);
    return [];
  }
};

export const migrateAccounts = async () => {
  // Get current accounts from storage
  let accounts = await getData(ACCOUNTS_KEY) || [];
  const seenNames = new Set();
  const seenIds = new Set();
  let changed = false;
  const migrated = [];
  
  // Process each account to ensure data integrity
  for (const acc of accounts) {
    const nameKey = acc.name.trim().toLowerCase();
    if (seenNames.has(nameKey)) {
      changed = true;
      continue; // skip duplicate by name
    }
    
    // Ensure each account has a unique ID
    let id = acc.id;
    if (!id || seenIds.has(id)) {
      id = require('../utils/formatCurrency').generateId();
      changed = true;
    }
    
    // Track processed names and IDs to prevent duplicates
    seenNames.add(nameKey);
    seenIds.add(id);
    migrated.push({ ...acc, id });
  }
  
  // Save migrated accounts if any changes were made
  if (changed) {
    await storeData(ACCOUNTS_KEY, migrated);
  }
};

// Update transaction
export const updateTransaction = async (id, updatedData) => {
  try {
    // Get current transactions and accounts from storage
    const transactions = await getData(TRANSACTIONS_KEY) || [];
    const accounts = await getData(ACCOUNTS_KEY) || [];
    const transactionIndex = transactions.findIndex(t => t.id === id);
    if (transactionIndex === -1) {
      throw new Error('Transaction not found');
    }
    
    // Create updated transaction object
    const oldTransaction = transactions[transactionIndex];
    const newTransaction = { ...oldTransaction, ...updatedData, id };

    // If sourceId or amount/type changed, update account balances
    if (
      oldTransaction.sourceId !== newTransaction.sourceId ||
      oldTransaction.amount !== newTransaction.amount ||
      oldTransaction.type !== newTransaction.type
    ) {
      // Reverse old transaction effect on account balance
      const oldAccountIndex = accounts.findIndex(acc => acc.id === oldTransaction.sourceId);
      if (oldAccountIndex !== -1) {
        const reverse = oldTransaction.type === 'income' ? -oldTransaction.amount : oldTransaction.amount;
        accounts[oldAccountIndex].balance += reverse;
      }
      
      // Apply new transaction effect on account balance
      const newAccountIndex = accounts.findIndex(acc => acc.id === newTransaction.sourceId);
      if (newAccountIndex !== -1) {
        const apply = newTransaction.type === 'income' ? newTransaction.amount : -newTransaction.amount;
        accounts[newAccountIndex].balance += apply;
      }
      await storeData(ACCOUNTS_KEY, accounts);
    }

    // Update transaction in storage
    transactions[transactionIndex] = newTransaction;
    await storeData(TRANSACTIONS_KEY, transactions);
    console.log('Transaction updated successfully');
    return newTransaction;
  } catch (error) {
    console.error('Update transaction error:', error);
    throw error;
  }
}; 