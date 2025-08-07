import { create } from 'zustand';
import { 
  addTransaction, 
  getTransactions, 
  deleteTransaction,
  getAccounts,
  addAccount,
  updateAccount as updateAccountService,
  deleteAccount as deleteAccountService,
  getMonthlyStats,
  getCategoryStats
} from '../db/asyncStorageService';
import { generateId, getCurrentDate, getCurrentMonthYear } from '../utils/formatCurrency';

const useStore = create((set, get) => ({
  // State - Core application data
  transactions: [], // Array of all transactions
  accounts: [], // Array of all financial accounts
  monthlyStats: { income: 0, expenses: 0, savings: 0 }, // Current month statistics
  categoryStats: [], // Expense breakdown by category
  loading: false, // Loading state for async operations
  error: null, // Error state for error handling

  // Actions - Utility functions for state management
  setLoading: (loading) => set({ loading }), // Set loading state
  setError: (error) => set({ error }), // Set error state

  // Load transactions from storage with optional filters
  loadTransactions: async (filters = {}) => {
    set({ loading: true, error: null }); // Start loading and clear errors
    try {
      const transactions = await getTransactions(filters); // Fetch from database
      set({ transactions, loading: false }); // Update state with fetched data
    } catch (error) {
      set({ error: error.message, loading: false }); // Handle errors
    }
  },

  // Add new transaction with optimistic updates
  addTransaction: async (transactionData) => {
    set({ loading: true, error: null }); // Start loading and clear errors
    const prevTransactions = get().transactions; // Store current state for rollback
    const prevAccounts = get().accounts;
    try {
      // Find the account by id (from transactionData or by name for legacy)
      let sourceId = transactionData.sourceId;
      if (!sourceId && transactionData.source) {
        // Legacy: find account by name for backward compatibility
        const acc = prevAccounts.find(acc => acc.name === transactionData.source);
        if (acc) sourceId = acc.id;
      }
      
      // Create transaction object with generated ID and current date
      const transaction = {
        id: generateId(),
        date: getCurrentDate(),
        ...transactionData,
        sourceId,
      };
      
      // Optimistically update UI for immediate feedback
      let newTransactions = [transaction, ...prevTransactions]; // Add to beginning
      let newAccounts = prevAccounts.map(acc => {
        if (acc.id === sourceId) {
          // Update account balance based on transaction type
          const balanceChange = transaction.type === 'income' ? transaction.amount : -transaction.amount;
          return { ...acc, balance: acc.balance + balanceChange };
        }
        return acc;
      });
      set({ transactions: newTransactions, accounts: newAccounts }); // Update UI immediately
      
      // Persist to storage
      await addTransaction(transaction);
      
      // Batch reload all data in parallel to ensure consistency
      await Promise.all([
        get().loadTransactions(),
        get().loadAccounts(),
        get().loadMonthlyStats(),
        get().loadCategoryStats()
      ]);
      set({ loading: false });
      return transaction;
    } catch (error) {
      // Revert optimistic update on error
      set({ transactions: prevTransactions, accounts: prevAccounts, error: error.message, loading: false });
      throw error;
    }
  },

  // Delete transaction with optimistic updates
  deleteTransaction: async (id) => {
    set({ loading: true, error: null }); // Start loading and clear errors
    const prevTransactions = get().transactions; // Store current state for rollback
    const prevAccounts = get().accounts;
    try {
      // Find transaction to delete
      const transaction = prevTransactions.find(t => t.id === id);
      if (!transaction) throw new Error('Transaction not found');
      
      // Optimistically update UI for immediate feedback
      let newTransactions = prevTransactions.filter(t => t.id !== id); // Remove from array
      let newAccounts = prevAccounts.map(acc => {
        if (acc.id === transaction.sourceId) {
          // Reverse the transaction effect on account balance
          const balanceChange = transaction.type === 'income' ? -transaction.amount : transaction.amount;
          return { ...acc, balance: acc.balance + balanceChange };
        }
        return acc;
      });
      set({ transactions: newTransactions, accounts: newAccounts }); // Update UI immediately
      
      // Persist to storage
      await deleteTransaction(id);
      
      // Batch reload all data in parallel to ensure consistency
      await Promise.all([
        get().loadTransactions(),
        get().loadAccounts(),
        get().loadMonthlyStats(),
        get().loadCategoryStats()
      ]);
      set({ loading: false });
    } catch (error) {
      // Revert optimistic update on error
      set({ transactions: prevTransactions, accounts: prevAccounts, error: error.message, loading: false });
      throw error;
    }
  },

  // Load accounts from storage
  loadAccounts: async () => {
    set({ loading: true, error: null }); // Start loading and clear errors
    try {
      const accounts = await getAccounts(); // Fetch from database
      set({ accounts, loading: false }); // Update state with fetched data
    } catch (error) {
      set({ error: error.message, loading: false }); // Handle errors
    }
  },

  // Add new account to storage
  addAccount: async (accountData) => {
    set({ loading: true, error: null }); // Start loading and clear errors
    try {
      // Create account object with generated ID
      const account = {
        id: generateId(),
        ...accountData
      };
      await addAccount(account); // Will throw if duplicate name exists
      await get().loadAccounts(); // Reload accounts to update state
      set({ loading: false });
    } catch (error) {
      set({ error: error.message, loading: false }); // Handle errors
      throw error;
    }
  },

  // Update existing account details
  updateAccount: async (id, accountData) => {
    set({ loading: true, error: null }); // Start loading and clear errors
    try {
      await updateAccountService(id, accountData); // Update in database
      await get().loadAccounts(); // Reload accounts to update state
      set({ loading: false });
    } catch (error) {
      set({ error: error.message, loading: false }); // Handle errors
      throw error;
    }
  },

  // Delete account from storage
  deleteAccount: async (id) => {
    set({ loading: true, error: null }); // Start loading and clear errors
    try {
      await deleteAccountService(id); // Delete from database
      await get().loadAccounts(); // Reload accounts to update state
      set({ loading: false });
    } catch (error) {
      set({ error: error.message, loading: false }); // Handle errors
      throw error;
    }
  },

  // Load monthly statistics from storage
  loadMonthlyStats: async (year, month) => {
    set({ loading: true, error: null }); // Start loading and clear errors
    try {
      const currentMonth = getCurrentMonthYear(); // Get current month/year
      const stats = await getMonthlyStats(year || currentMonth.year, month || currentMonth.month); // Fetch stats
      set({ monthlyStats: stats, loading: false }); // Update state with fetched data
    } catch (error) {
      set({ error: error.message, loading: false }); // Handle errors
    }
  },

  // Load category statistics from storage
  loadCategoryStats: async (year, month) => {
    set({ loading: true, error: null }); // Start loading and clear errors
    try {
      const currentMonth = getCurrentMonthYear(); // Get current month/year
      const stats = await getCategoryStats(year || currentMonth.year, month || currentMonth.month); // Fetch stats
      set({ categoryStats: stats, loading: false }); // Update state with fetched data
    } catch (error) {
      set({ error: error.message, loading: false }); // Handle errors
    }
  },

  // Get comprehensive statistics calculated from current state
  getStats: () => {
    const { accounts, transactions, monthlyStats } = get();
    
    // Calculate total balance across all accounts
    const totalBalance = accounts.reduce((total, account) => total + account.balance, 0);
    
    // Calculate monthly income and expenses for current month
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    // Filter transactions for current month
    const monthlyTransactions = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate.getMonth() === currentMonth && 
             transactionDate.getFullYear() === currentYear;
    });
    
    // Calculate total income for current month
    const monthlyIncome = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    // Calculate total expenses for current month
    const monthlyExpense = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    // Calculate monthly savings
    const monthlySavings = monthlyIncome - monthlyExpense;
    
    return {
      totalBalance,
      monthlyIncome,
      monthlyExpense,
      monthlySavings,
    };
  },

  // Get total balance across all accounts
  getTotalBalance: () => {
    const { accounts } = get();
    return accounts.reduce((total, account) => total + account.balance, 0); // Sum all account balances
  },

  // Get recent transactions (last 5)
  getRecentTransactions: () => {
    const { transactions } = get();
    return transactions.slice(0, 5); // Return first 5 transactions (most recent)
  },

  // Initialize app data on startup
  initializeApp: async () => {
    set({ loading: true, error: null }); // Start loading and clear errors
    try {
      const { month, year } = getCurrentMonthYear(); // Get current month/year
      
      // Load all data in parallel for better performance
      await Promise.all([
        get().loadTransactions(),
        get().loadAccounts(),
        get().loadMonthlyStats(year, month),
        get().loadCategoryStats(year, month)
      ]);
      
      set({ loading: false });
    } catch (error) {
      set({ error: error.message, loading: false }); // Handle errors
    }
  },

  // Update existing transaction with optimistic updates
  updateTransaction: async (id, updatedData) => {
    set({ loading: true, error: null }); // Start loading and clear errors
    const prevTransactions = get().transactions; // Store current state for rollback
    const prevAccounts = get().accounts;
    try {
      // Optimistically update UI for immediate feedback
      let transactionIndex = prevTransactions.findIndex(t => t.id === id);
      if (transactionIndex === -1) throw new Error('Transaction not found');
      const oldTransaction = prevTransactions[transactionIndex];
      const newTransaction = { ...oldTransaction, ...updatedData, id }; // Merge updates
      
      // Update transactions array
      let newTransactions = [...prevTransactions];
      newTransactions[transactionIndex] = newTransaction;
      
      // Update accounts array with balance changes
      let newAccounts = prevAccounts.map(acc => {
        if (acc.name === oldTransaction.source) {
          // Reverse old transaction effect on account balance
          const reverse = oldTransaction.type === 'income' ? -oldTransaction.amount : oldTransaction.amount;
          acc = { ...acc, balance: acc.balance + reverse };
        }
        if (acc.name === newTransaction.source) {
          // Apply new transaction effect on account balance
          const apply = newTransaction.type === 'income' ? newTransaction.amount : -newTransaction.amount;
          acc = { ...acc, balance: acc.balance + apply };
        }
        return acc;
      });
      set({ transactions: newTransactions, accounts: newAccounts }); // Update UI immediately
      
      // Persist to storage
      await require('../db/asyncStorageService').updateTransaction(id, updatedData);
      
      // Batch reload all data in parallel to ensure consistency
      await Promise.all([
        get().loadTransactions(),
        get().loadAccounts(),
        get().loadMonthlyStats(),
        get().loadCategoryStats()
      ]);
      set({ loading: false });
    } catch (error) {
      // Revert optimistic update on error
      set({ transactions: prevTransactions, accounts: prevAccounts, error: error.message, loading: false });
      throw error;
    }
  }
}));

export default useStore; 