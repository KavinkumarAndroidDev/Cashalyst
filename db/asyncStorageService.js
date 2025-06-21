import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const TRANSACTIONS_KEY = 'cashalyst_transactions';
const ACCOUNTS_KEY = 'cashalyst_accounts';

// Helper functions
const getData = async (key) => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error('Error reading data:', error);
    return null;
  }
};

const storeData = async (key, value) => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
  } catch (error) {
    console.error('Error storing data:', error);
    throw error;
  }
};

// Initialize database with default data
export const initDatabase = async () => {
  try {
    // Only initialize empty arrays if not present
    const existingAccounts = await getData(ACCOUNTS_KEY);
    if (!existingAccounts) {
      await storeData(ACCOUNTS_KEY, []);
    }
    const existingTransactions = await getData(TRANSACTIONS_KEY);
    if (!existingTransactions) {
      await storeData(TRANSACTIONS_KEY, []);
    }
    await migrateAccounts();
    console.log('AsyncStorage database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
};

// Transaction operations
export const addTransaction = async (transaction) => {
  try {
    const transactions = await getData(TRANSACTIONS_KEY) || [];
    const accounts = await getData(ACCOUNTS_KEY) || [];
    
    // Add transaction
    transactions.unshift(transaction); // Add to beginning
    await storeData(TRANSACTIONS_KEY, transactions);
    
    // Update account balance
    const accountIndex = accounts.findIndex(acc => acc.name === transaction.source);
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
    const transactions = await getData(TRANSACTIONS_KEY) || [];
    
    let filtered = [...transactions];
    
    if (filters.type) {
      filtered = filtered.filter(t => t.type === filters.type);
    }
    
    if (filters.category) {
      filtered = filtered.filter(t => t.category === filters.category);
    }
    
    if (filters.source) {
      filtered = filtered.filter(t => t.source === filters.source);
    }
    
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
    const transactions = await getData(TRANSACTIONS_KEY) || [];
    const accounts = await getData(ACCOUNTS_KEY) || [];
    
    // Find the transaction to delete
    const transactionIndex = transactions.findIndex(t => t.id === id);
    if (transactionIndex === -1) {
      throw new Error('Transaction not found');
    }
    
    const transaction = transactions[transactionIndex];
    
    // Update account balance (reverse the transaction)
    const accountIndex = accounts.findIndex(acc => acc.name === transaction.source);
    if (accountIndex !== -1) {
      const balanceChange = transaction.type === 'income' ? -transaction.amount : transaction.amount;
      accounts[accountIndex].balance += balanceChange;
      await storeData(ACCOUNTS_KEY, accounts);
    }
    
    // Remove transaction
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
    const accounts = await getData(ACCOUNTS_KEY) || [];
    return accounts;
  } catch (error) {
    console.error('Get accounts error:', error);
    return [];
  }
};

export const addAccount = async (account) => {
  try {
    const accounts = await getData(ACCOUNTS_KEY) || [];
    // Prevent duplicate by name (case-insensitive, trimmed)
    const exists = accounts.some(acc => acc.name.trim().toLowerCase() === account.name.trim().toLowerCase());
    if (exists) {
      throw new Error('Account with this name already exists.');
    }
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
    const accounts = await getData(ACCOUNTS_KEY) || [];
    const accountIndex = accounts.findIndex(acc => acc.id === id);
    if (accountIndex === -1) {
      throw new Error('Account not found');
    }
    
    // Update account with new data
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
    const accounts = await getData(ACCOUNTS_KEY) || [];
    const accountIndex = accounts.findIndex(acc => acc.id === id);
    if (accountIndex === -1) {
      throw new Error('Account not found');
    }
    
    // Remove account
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
    const accounts = await getData(ACCOUNTS_KEY) || [];
    const accountIndex = accounts.findIndex(acc => acc.id === id);
    if (accountIndex !== -1) {
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
    const transactions = await getData(TRANSACTIONS_KEY) || [];
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;
    
    const monthlyTransactions = transactions.filter(t => 
      t.date >= startDate && t.date <= endDate
    );
    
    const income = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
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
    const transactions = await getData(TRANSACTIONS_KEY) || [];
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;
    
    const monthlyExpenses = transactions.filter(t => 
      t.type === 'expense' && t.date >= startDate && t.date <= endDate
    );
    
    const categoryMap = {};
    monthlyExpenses.forEach(transaction => {
      if (categoryMap[transaction.category]) {
        categoryMap[transaction.category] += transaction.amount;
      } else {
        categoryMap[transaction.category] = transaction.amount;
      }
    });
    
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
  let accounts = await getData(ACCOUNTS_KEY) || [];
  const seenNames = new Set();
  const seenIds = new Set();
  let changed = false;
  const migrated = [];
  for (const acc of accounts) {
    const nameKey = acc.name.trim().toLowerCase();
    if (seenNames.has(nameKey)) {
      changed = true;
      continue; // skip duplicate by name
    }
    let id = acc.id;
    if (!id || seenIds.has(id)) {
      id = require('../utils/formatCurrency').generateId();
      changed = true;
    }
    seenNames.add(nameKey);
    seenIds.add(id);
    migrated.push({ ...acc, id });
  }
  if (changed) {
    await storeData(ACCOUNTS_KEY, migrated);
  }
}; 