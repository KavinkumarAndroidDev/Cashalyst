import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Animated,
} from 'react-native';
import { Surface, FAB } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import useStore from '../hooks/useStore';
import { formatCurrency } from '../utils/formatCurrency';
import { Home, PlusCircle, List, BarChart2, Wallet, TrendingUp, TrendingDown, PiggyBank, Settings, Coffee, Car, ShoppingCart, Film, Banknote, Book, FileText } from 'lucide-react-native';
import AppButton from '../components/AppButton';
import AppTextField from '../components/AppTextField';
import AppDropdown from '../components/AppDropdown';
import theme from '../utils/theme';
import { responsiveFontSize, moderateScale } from '../utils/scale';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notificationService from '../utils/notificationService';

const { width } = Dimensions.get('window');

// Icon mappings for different transaction categories
const CATEGORY_ICONS = {
  'Food & Dining': Coffee,
  'Transportation': Car,
  'Shopping': ShoppingCart,
  'Entertainment': Film,
  'Bills & Utilities': Banknote,
  'Education': Book,
  'Salary': PiggyBank,
  'Freelance': FileText,
  'Investment': TrendingUp,
  'Other': PiggyBank,
};

// Get color for transaction category
const getCategoryColor = (category) => {
  const colors = {
    'Food & Dining': '#EF4444',
    'Transportation': '#3B82F6',
    'Shopping': '#8B5CF6',
    'Entertainment': '#F59E0B',
    'Bills & Utilities': '#10B981',
    'Healthcare': '#EC4899',
    'Education': '#06B6D4',
    'Travel': '#84CC16',
    'Other': '#94A3B8',
  };
  return colors[category] || '#94A3B8'; // Return default color if category not found
};

const HomeScreen = ({ navigation }) => {
  // Get account data, transactions, and statistics from Zustand store
  const { accounts, transactions, getStats } = useStore();
  
  // Statistics state for financial overview
  const [stats, setStats] = useState({
    totalBalance: 0,
    monthlyIncome: 0,
    monthlyExpense: 0,
    monthlySavings: 0,
  });
  
  // Animation state for balance changes
  const [balanceAnimation] = useState(new Animated.Value(1));
  const [lastBalance, setLastBalance] = useState(0); // Track previous balance for animations
  
  // User state
  const [username, setUsername] = useState(''); // User's name from settings

  // Update statistics and animate balance changes when data changes
  useEffect(() => {
    const currentStats = getStats(); // Get updated statistics
    setStats(currentStats);
    
    // Animate balance change if it's different from last time (skip initial load)
    if (currentStats.totalBalance !== lastBalance && lastBalance !== 0) {
      Animated.sequence([
        Animated.timing(balanceAnimation, {
          toValue: 1.05, // Scale up slightly
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(balanceAnimation, {
          toValue: 1, // Return to normal size
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
    setLastBalance(currentStats.totalBalance); // Update last balance for next comparison
  }, [accounts, transactions]);

  // Load user settings and initialize notifications on component mount
  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem('username'); // Load saved username
      if (saved) setUsername(saved);
      // Request notification permission on first launch
      await notificationService.initialize();
    })();
  }, []);

  // Get recent transactions sorted by date (most recent first, limit to 5)
  const recentTransactions = transactions
    .sort((a, b) => new Date(b.date) - new Date(a.date)) // Sort by date descending
    .slice(0, 5); // Take only the 5 most recent transactions

  // Get color for transaction type
  const getTransactionColor = (type) => {
    switch (type) {
      case 'income': return '#10B981'; // Green for income
      case 'expense': return '#EF4444'; // Red for expense
      default: return '#94A3B8'; // Gray for unknown type
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" />
      
      {/* Header with greeting and user profile */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Welcome back</Text>
            {/* Show username or app name based on user settings */}
            {!username && <Text style={styles.headerTitle}>Cashalyst</Text>}
            {username && (
              <Text style={[styles.headerTitle, { fontSize: 24 }]}>{username.trim().split(' ')[0]}</Text> // Show first name only
            )}
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {username ? (
              <TouchableOpacity
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: theme.colors.accent,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 2,
                }}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('Settings')} // Navigate to settings
              >
                <Text style={{ color: theme.colors.buttonText || '#fff', fontFamily: theme.font.family.bold, fontSize: 18 }}>
                  {username.trim().charAt(0).toUpperCase()} {/* Show user's first initial */}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.accountsButton, { width: 40, height: 40, paddingHorizontal: 0, alignItems: 'center', justifyContent: 'center' }]}
                onPress={() => navigation.navigate('Settings')} // Navigate to settings
              >
                <Settings color="#F9FAFB" size={20} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Total Balance Card with animated balance display */}
        <Surface style={[styles.balanceCard, { transform: [{ scale: balanceAnimation }] }]}>
          <LinearGradient
            colors={["rgba(59, 130, 246, 0.18)", "rgba(37, 99, 235, 0.08)"]}
            style={styles.balanceGradient}
          >
            <View style={styles.balanceContent}>
              <Text style={styles.balanceLabel}>Total Balance</Text>
              <Text style={styles.balanceAmount}>{formatCurrency(stats.totalBalance)}</Text>
              <View style={styles.balanceTrend}>
                <Text style={styles.trendText}> {stats.monthlySavings >= 0 ? '+' : ''}{formatCurrency(stats.monthlySavings)} this month</Text> {/* Show monthly savings trend */}
              </View>
            </View>
          </LinearGradient>
        </Surface>

        {/* Monthly Overview with Income and Expenses */}
        <View style={styles.overviewSection}>
          <Text style={styles.sectionTitle}>This Month</Text>
          <View style={styles.overviewGrid}>
            <Surface style={styles.overviewCard}>
              <View style={styles.overviewContent}>
                <TrendingUp color="#10B981" size={24} />
                <Text style={styles.overviewAmount}>{formatCurrency(stats.monthlyIncome)}</Text>
                <Text style={styles.overviewLabel}>Income</Text>
              </View>
            </Surface>
            <Surface style={styles.overviewCard}>
              <View style={styles.overviewContent}>
                <TrendingDown color="#EF4444" size={24} />
                <Text style={styles.overviewAmount}>{formatCurrency(stats.monthlyExpense)}</Text>
                <Text style={styles.overviewLabel}>Expenses</Text>
              </View>
            </Surface>
          </View>
        </View>

        {/* Quick Actions Grid for Navigation */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('AddTransaction')} // Navigate to add transaction screen
            >
              <View style={styles.actionContent}>
                <PlusCircle color="#3B82F6" size={24} />
                <Text style={styles.actionText}>Add Transaction</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('History')} // Navigate to transaction history
            >
              <View style={styles.actionContent}>
                <List color="#94A3B8" size={24} />
                <Text style={styles.actionText}>View History</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('Insights')} // Navigate to insights screen
            >
              <View style={styles.actionContent}>
                <BarChart2 color="#94A3B8" size={24} />
                <Text style={styles.actionText}>Insights</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('Accounts')} // Navigate to accounts screen
            >
              <View style={styles.actionContent}>
                <Wallet color="#94A3B8" size={24} />
                <Text style={styles.actionText}>Accounts</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Transactions List */}
        <View style={styles.transactionsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => navigation.navigate('History')}> {/* Navigate to full history */}
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {recentTransactions.length === 0 ? (
            <Surface style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No transactions yet</Text>
              <Text style={styles.emptyText}>
                Start by adding your first transaction
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => navigation.navigate('AddTransaction')} // Navigate to add transaction
              >
                <Text style={styles.emptyButtonText}>Add Transaction</Text>
              </TouchableOpacity>
            </Surface>
          ) : (
            recentTransactions.map((transaction) => {
              return (
                <Surface key={transaction.id} style={styles.transactionCard}>
                  <View style={styles.transactionRow}>
                    <View style={styles.transactionIconWrap}>
                      {(() => {
                        const Icon = CATEGORY_ICONS[transaction.category] || PiggyBank; // Get icon for category
                        return <Icon color={getCategoryColor(transaction.category)} size={20} />;
                      })()}
                    </View>
                    <View style={styles.transactionDetails}>
                      <Text style={styles.transactionTitle}>{transaction.title}</Text>
                      <View style={styles.transactionMetaRow}>
                        <Text style={styles.transactionMeta}>{transaction.category}</Text>
                        <Text style={styles.transactionMeta}>•</Text>
                        <Text style={[styles.transactionMeta, { color: '#3B82F6', fontWeight: '600' }]}>{accounts.find(acc => acc.id === transaction.sourceId)?.name || transaction.source}</Text> {/* Show account name */}
                        <Text style={styles.transactionMeta}>•</Text>
                        <Text style={styles.transactionMeta}>{new Date(transaction.date).toLocaleDateString()}</Text> {/* Show formatted date */}
                      </View>
                    </View>
                    <View style={styles.transactionAmountWrap}>
                      <Text style={[styles.amountText, { color: transaction.type === 'income' ? '#10B981' : '#EF4444' }]}>
                        {transaction.type === 'expense' ? '-' : '+'}{formatCurrency(transaction.amount)} {/* Show amount with sign */}
                      </Text>
                    </View>
                  </View>
                </Surface>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button for Quick Transaction Addition */}
      <FAB
        icon={({ color, size }) => <PlusCircle color={color} size={size + 2} />}
        style={styles.fab}
        onPress={() => navigation.navigate('AddTransaction')} // Navigate to add transaction screen
        color="#fff"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 15,
    color: theme.colors.textSubtle,
    marginBottom: 4,
    fontFamily: theme.font.family.medium,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: theme.font.family.bold,
    color: theme.colors.textMain,
    letterSpacing: -0.5,
  },
  accountsButton: {
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  accountsButtonText: {
    color: theme.colors.textMain,
    fontSize: 14,
    fontFamily: theme.font.family.bold,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: 100,
  },
  balanceCard: {
    marginBottom: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    elevation: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  balanceGradient: {
    padding: 24,
    borderRadius: 16,
  },
  balanceContent: {
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: theme.colors.textSubtle,
    marginBottom: 8,
    fontFamily: theme.font.family.medium,
    letterSpacing: 0.2,
  },
  balanceAmount: {
    fontSize: 32,
    fontFamily: theme.font.family.bold,
    color: theme.colors.textMain,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  balanceTrend: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  trendText: {
    color: '#10B981',
    fontSize: 12,
    fontFamily: theme.font.family.bold,
  },
  overviewSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: theme.font.family.bold,
    color: theme.colors.textMain,
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  overviewGrid: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  overviewCard: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    elevation: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  overviewContent: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  overviewIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  overviewAmount: {
    fontSize: 16,
    fontFamily: theme.font.family.bold,
    color: theme.colors.textMain,
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  overviewLabel: {
    fontSize: 12,
    color: theme.colors.textSubtle,
    fontFamily: theme.font.family.medium,
    letterSpacing: 0.2,
  },
  actionsSection: {
    marginBottom: 32,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '48%',
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    elevation: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  actionContent: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionText: {
    color: theme.colors.textMain,
    fontSize: 14,
    fontFamily: theme.font.family.bold,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  transactionsSection: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    color: theme.colors.accent,
    fontSize: 14,
    fontFamily: theme.font.family.bold,
    letterSpacing: 0.2,
  },
  emptyCard: {
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    elevation: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: theme.font.family.bold,
    color: theme.colors.textMain,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.textSubtle,
    fontFamily: theme.font.family.medium,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyButton: {
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  emptyButtonText: {
    color: theme.colors.buttonText || '#fff',
    fontSize: 14,
    fontFamily: theme.font.family.bold,
    letterSpacing: 0.2,
  },
  transactionCard: {
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    elevation: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  transactionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
    marginRight: 12,
  },
  transactionTitle: {
    fontSize: 15,
    fontFamily: theme.font.family.bold,
    color: theme.colors.textMain,
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  transactionMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  transactionMeta: {
    fontSize: 12,
    color: theme.colors.textSubtle,
    marginRight: 4,
  },
  transactionAmountWrap: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 15,
    fontFamily: theme.font.family.bold,
    letterSpacing: -0.2,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.accent,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
});

export default HomeScreen; 