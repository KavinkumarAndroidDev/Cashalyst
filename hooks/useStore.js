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
  // State
  transactions: [],
  accounts: [],
  monthlyStats: { income: 0, expenses: 0, savings: 0 },
  categoryStats: [],
  loading: false,
  error: null,

  // Actions
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  // Load transactions
  loadTransactions: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const transactions = await getTransactions(filters);
      set({ transactions, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  // Add transaction
  addTransaction: async (transactionData) => {
    set({ loading: true, error: null });
    const prevTransactions = get().transactions;
    const prevAccounts = get().accounts;
    try {
      // Find the account by id (from transactionData or by name for legacy)
      let sourceId = transactionData.sourceId;
      if (!sourceId && transactionData.source) {
        const acc = prevAccounts.find(acc => acc.name === transactionData.source);
        if (acc) sourceId = acc.id;
      }
      const transaction = {
        id: generateId(),
        date: getCurrentDate(),
        ...transactionData,
        sourceId,
      };
      // Optimistically update UI
      let newTransactions = [transaction, ...prevTransactions];
      let newAccounts = prevAccounts.map(acc => {
        if (acc.id === sourceId) {
          const balanceChange = transaction.type === 'income' ? transaction.amount : -transaction.amount;
          return { ...acc, balance: acc.balance + balanceChange };
        }
        return acc;
      });
      set({ transactions: newTransactions, accounts: newAccounts });
      // Persist to storage
      await addTransaction(transaction);
      // Batch reload all data in parallel
      await Promise.all([
        get().loadTransactions(),
        get().loadAccounts(),
        get().loadMonthlyStats(),
        get().loadCategoryStats()
      ]);
      set({ loading: false });
      return transaction;
    } catch (error) {
      // Revert optimistic update
      set({ transactions: prevTransactions, accounts: prevAccounts, error: error.message, loading: false });
      throw error;
    }
  },

  // Delete transaction
  deleteTransaction: async (id) => {
    set({ loading: true, error: null });
    const prevTransactions = get().transactions;
    const prevAccounts = get().accounts;
    try {
      // Find transaction to delete
      const transaction = prevTransactions.find(t => t.id === id);
      if (!transaction) throw new Error('Transaction not found');
      // Optimistically update UI
      let newTransactions = prevTransactions.filter(t => t.id !== id);
      let newAccounts = prevAccounts.map(acc => {
        if (acc.id === transaction.sourceId) {
          const balanceChange = transaction.type === 'income' ? -transaction.amount : transaction.amount;
          return { ...acc, balance: acc.balance + balanceChange };
        }
        return acc;
      });
      set({ transactions: newTransactions, accounts: newAccounts });
      // Persist to storage
      await deleteTransaction(id);
      // Batch reload all data in parallel
      await Promise.all([
        get().loadTransactions(),
        get().loadAccounts(),
        get().loadMonthlyStats(),
        get().loadCategoryStats()
      ]);
      set({ loading: false });
    } catch (error) {
      // Revert optimistic update
      set({ transactions: prevTransactions, accounts: prevAccounts, error: error.message, loading: false });
      throw error;
    }
  },

  // Load accounts
  loadAccounts: async () => {
    set({ loading: true, error: null });
    try {
      const accounts = await getAccounts();
      set({ accounts, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  // Add account
  addAccount: async (accountData) => {
    set({ loading: true, error: null });
    try {
      const account = {
        id: generateId(),
        ...accountData
      };
      await addAccount(account); // Will throw if duplicate
      await get().loadAccounts();
      set({ loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Update account
  updateAccount: async (id, accountData) => {
    set({ loading: true, error: null });
    try {
      await updateAccountService(id, accountData);
      await get().loadAccounts();
      set({ loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Delete account
  deleteAccount: async (id) => {
    set({ loading: true, error: null });
    try {
      await deleteAccountService(id);
      await get().loadAccounts();
      set({ loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Load monthly stats
  loadMonthlyStats: async (year, month) => {
    set({ loading: true, error: null });
    try {
      const currentMonth = getCurrentMonthYear();
      const stats = await getMonthlyStats(year || currentMonth.year, month || currentMonth.month);
      set({ monthlyStats: stats, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  // Load category stats
  loadCategoryStats: async (year, month) => {
    set({ loading: true, error: null });
    try {
      const currentMonth = getCurrentMonthYear();
      const stats = await getCategoryStats(year || currentMonth.year, month || currentMonth.month);
      set({ categoryStats: stats, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  // Get comprehensive stats
  getStats: () => {
    const { accounts, transactions, monthlyStats } = get();
    
    // Calculate total balance
    const totalBalance = accounts.reduce((total, account) => total + account.balance, 0);
    
    // Calculate monthly income and expenses
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyTransactions = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate.getMonth() === currentMonth && 
             transactionDate.getFullYear() === currentYear;
    });
    
    const monthlyIncome = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const monthlyExpense = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
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
    return accounts.reduce((total, account) => total + account.balance, 0);
  },

  // Get recent transactions (last 5)
  getRecentTransactions: () => {
    const { transactions } = get();
    return transactions.slice(0, 5);
  },

  // Initialize app data
  initializeApp: async () => {
    set({ loading: true, error: null });
    try {
      const { month, year } = getCurrentMonthYear();
      
      await Promise.all([
        get().loadTransactions(),
        get().loadAccounts(),
        get().loadMonthlyStats(year, month),
        get().loadCategoryStats(year, month)
      ]);
      
      set({ loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  // Update transaction
  updateTransaction: async (id, updatedData) => {
    set({ loading: true, error: null });
    const prevTransactions = get().transactions;
    const prevAccounts = get().accounts;
    try {
      // Optimistically update UI
      let transactionIndex = prevTransactions.findIndex(t => t.id === id);
      if (transactionIndex === -1) throw new Error('Transaction not found');
      const oldTransaction = prevTransactions[transactionIndex];
      const newTransaction = { ...oldTransaction, ...updatedData, id };
      // Update transactions array
      let newTransactions = [...prevTransactions];
      newTransactions[transactionIndex] = newTransaction;
      // Update accounts array
      let newAccounts = prevAccounts.map(acc => {
        if (acc.name === oldTransaction.source) {
          // Reverse old transaction effect
          const reverse = oldTransaction.type === 'income' ? -oldTransaction.amount : oldTransaction.amount;
          acc = { ...acc, balance: acc.balance + reverse };
        }
        if (acc.name === newTransaction.source) {
          // Apply new transaction effect
          const apply = newTransaction.type === 'income' ? newTransaction.amount : -newTransaction.amount;
          acc = { ...acc, balance: acc.balance + apply };
        }
        return acc;
      });
      set({ transactions: newTransactions, accounts: newAccounts });
      // Persist to storage
      await require('../db/asyncStorageService').updateTransaction(id, updatedData);
      // Batch reload all data in parallel
      await Promise.all([
        get().loadTransactions(),
        get().loadAccounts(),
        get().loadMonthlyStats(),
        get().loadCategoryStats()
      ]);
      set({ loading: false });
    } catch (error) {
      // Revert optimistic update
      set({ transactions: prevTransactions, accounts: prevAccounts, error: error.message, loading: false });
      throw error;
    }
  }
}));

export default useStore; 