import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Surface, FAB } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import useStore from '../hooks/useStore';
import { formatCurrency } from '../utils/formatCurrency';
import { CreditCard, TrendingUp, TrendingDown, PlusCircle, List, BarChart2, Wallet, ShoppingCart, Utensils, Film, PiggyBank, Banknote, Calendar, ArrowDownCircle, ArrowUpCircle } from 'lucide-react-native';
import AppButton from '../components/AppButton';
import AppTextField from '../components/AppTextField';
import AppDropdown from '../components/AppDropdown';

const { width } = Dimensions.get('window');

const ICONS = {
  income: ArrowDownCircle,
  expense: ArrowUpCircle,
  shopping: ShoppingCart,
  food: Utensils,
  entertainment: Film,
  savings: PiggyBank,
  bank: Banknote,
  default: CreditCard,
};

const getLucideIcon = (type, category) => {
  if (type === 'income') return ArrowDownCircle;
  if (type === 'expense') {
    if (category && category.toLowerCase().includes('shop')) return ShoppingCart;
    if (category && category.toLowerCase().includes('food')) return Utensils;
    if (category && category.toLowerCase().includes('entertain')) return Film;
    return ArrowUpCircle;
  }
  return CreditCard;
};

const HomeScreen = ({ navigation }) => {
  const { accounts, transactions, getStats } = useStore();
  const [stats, setStats] = useState({
    totalBalance: 0,
    monthlyIncome: 0,
    monthlyExpense: 0,
    monthlySavings: 0,
  });

  useEffect(() => {
    const currentStats = getStats();
    setStats(currentStats);
  }, [accounts, transactions]);

  const recentTransactions = transactions
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  const getTransactionColor = (type) => {
    switch (type) {
      case 'income': return '#10B981';
      case 'expense': return '#EF4444';
      default: return '#94A3B8';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={[styles.greeting, { fontFamily: 'Inter_400Regular' }]}>Welcome back</Text>
            <Text style={[styles.headerTitle, { fontFamily: 'Inter_700Bold' }]}>Your Financial Overview</Text>
          </View>
          <TouchableOpacity
            style={styles.accountsButton}
            onPress={() => navigation.navigate('Accounts')}
          >
            <Wallet color="#3B82F6" size={22} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Total Balance Card - Glassmorphic */}
        <Surface style={styles.balanceCard}>
          <LinearGradient
            colors={["rgba(59, 130, 246, 0.18)", "rgba(37, 99, 235, 0.08)"]}
            style={styles.balanceGradient}
          >
            <View style={styles.balanceContent}>
              <Text style={[styles.balanceLabel, { fontFamily: 'Inter_600SemiBold' }]}>Total Balance</Text>
              <Text style={[styles.balanceAmount, { fontFamily: 'Inter_700Bold' }]}>{formatCurrency(stats.totalBalance)}</Text>
              <View style={styles.balanceTrend}>
                <Text style={[styles.trendText, { fontFamily: 'Inter_600SemiBold' }]}> {stats.monthlySavings >= 0 ? '+' : ''}{formatCurrency(stats.monthlySavings)} this month</Text>
              </View>
            </View>
          </LinearGradient>
        </Surface>

        {/* Monthly Overview */}
        <View style={styles.overviewSection}>
          <Text style={[styles.sectionTitle, { fontFamily: 'Inter_700Bold' }]}>This Month</Text>
          <View style={styles.overviewGrid}>
            <Surface style={styles.overviewCard}>
              <View style={styles.overviewContent}>
                <TrendingUp color="#10B981" size={24} />
                <Text style={[styles.overviewAmount, { fontFamily: 'Inter_700Bold' }]}>{formatCurrency(stats.monthlyIncome)}</Text>
                <Text style={[styles.overviewLabel, { fontFamily: 'Inter_600SemiBold' }]}>Income</Text>
              </View>
            </Surface>
            <Surface style={styles.overviewCard}>
              <View style={styles.overviewContent}>
                <TrendingDown color="#EF4444" size={24} />
                <Text style={[styles.overviewAmount, { fontFamily: 'Inter_700Bold' }]}>{formatCurrency(stats.monthlyExpense)}</Text>
                <Text style={[styles.overviewLabel, { fontFamily: 'Inter_600SemiBold' }]}>Expenses</Text>
              </View>
            </Surface>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={[styles.sectionTitle, { fontFamily: 'Inter_700Bold' }]}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('AddTransaction')}
            >
              <View style={styles.actionContent}>
                <PlusCircle color="#3B82F6" size={24} />
                <Text style={[styles.actionText, { fontFamily: 'Inter_600SemiBold' }]}>Add Transaction</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('History')}
            >
              <View style={styles.actionContent}>
                <List color="#94A3B8" size={24} />
                <Text style={[styles.actionText, { fontFamily: 'Inter_600SemiBold' }]}>View History</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('Insights')}
            >
              <View style={styles.actionContent}>
                <BarChart2 color="#94A3B8" size={24} />
                <Text style={[styles.actionText, { fontFamily: 'Inter_600SemiBold' }]}>Insights</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('Accounts')}
            >
              <View style={styles.actionContent}>
                <Wallet color="#94A3B8" size={24} />
                <Text style={[styles.actionText, { fontFamily: 'Inter_600SemiBold' }]}>Accounts</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.transactionsSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { fontFamily: 'Inter_700Bold' }]}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => navigation.navigate('History')}>
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
                onPress={() => navigation.navigate('AddTransaction')}
              >
                <Text style={styles.emptyButtonText}>Add Transaction</Text>
              </TouchableOpacity>
            </Surface>
          ) : (
            recentTransactions.map((transaction) => {
              const Icon = getLucideIcon(transaction.type, transaction.category);
              return (
                <Surface key={transaction.id} style={styles.transactionCard}>
                  <View style={styles.transactionRow}>
                    <View style={styles.transactionIconWrap}>
                      <Icon color={getTransactionColor(transaction.type)} size={22} />
                    </View>
                    <View style={styles.transactionDetails}>
                      <Text style={[styles.transactionTitle, { fontFamily: 'Inter_600SemiBold' }]}>{transaction.title}</Text>
                      <View style={styles.transactionMetaRow}>
                        <Text style={styles.transactionMeta}>{transaction.category}</Text>
                        <Text style={styles.transactionMeta}>• {transaction.source}</Text>
                        <Text style={styles.transactionMeta}>• {new Date(transaction.date).toLocaleDateString()}</Text>
                      </View>
                    </View>
                    <View style={styles.transactionAmountWrap}>
                      <Text style={[styles.amountText, { color: getTransactionColor(transaction.type), fontFamily: 'Inter_700Bold' }]}> {transaction.type === 'expense' ? '-' : '+'}{formatCurrency(transaction.amount)}</Text>
                    </View>
                  </View>
                </Surface>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        icon={({ color, size }) => <PlusCircle color={color} size={size + 2} />}
        style={styles.fab}
        onPress={() => navigation.navigate('AddTransaction')}
        color="#fff"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    backgroundColor: '#0F172A',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 16,
    color: '#94A3B8',
    marginBottom: 4,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F9FAFB',
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
    color: '#F9FAFB',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
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
    color: '#94A3B8',
    marginBottom: 8,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#F9FAFB',
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
    fontWeight: '600',
  },
  overviewSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F9FAFB',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  overviewGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  overviewCard: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    elevation: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  overviewContent: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  overviewIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  overviewAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F9FAFB',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  overviewLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  actionsSection: {
    marginBottom: 32,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  actionCard: {
    width: (width - 72) / 2,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    elevation: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  actionContent: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionText: {
    color: '#F9FAFB',
    fontSize: 14,
    fontWeight: '600',
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
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  emptyCard: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
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
    fontWeight: '700',
    color: '#F9FAFB',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  emptyButtonText: {
    color: '#F9FAFB',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  transactionCard: {
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
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
  transactionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F9FAFB',
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#94A3B8',
    letterSpacing: 0.2,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  transactionIconWrap: {
    marginRight: 12,
  },
  transactionMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  transactionMeta: {
    fontSize: 12,
    color: '#94A3B8',
    marginRight: 4,
  },
  transactionAmountWrap: {
    alignItems: 'flex-end',
  },
});

export default HomeScreen; 