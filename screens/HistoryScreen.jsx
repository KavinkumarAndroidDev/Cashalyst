import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { Surface, Searchbar, Chip } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import useStore from '../hooks/useStore';
import { formatCurrency } from '../utils/formatCurrency';
import AppButton from '../components/AppButton';
import AppTextField from '../components/AppTextField';
import AppDropdown from '../components/AppDropdown';
import { ArrowLeft, Pencil, PiggyBank, Utensils, Car, ShoppingCart, Film, Banknote, Calendar, FileText, Book } from 'lucide-react-native';
import AppSegmentedButton from '../components/AppSegmentedButton';
import theme from '../utils/theme';

const CATEGORY_ICONS = {
  'Food & Dining': Utensils,
  'Transportation': Car,
  'Shopping': ShoppingCart,
  'Entertainment': Film,
  'Bills & Utilities': Banknote,
  'Healthcare': FileText,
  'Education': Book,
  'Travel': Calendar,
  'Other': PiggyBank,
};

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
  return colors[category] || '#94A3B8';
};

const HistoryScreen = ({ navigation }) => {
  const { transactions, accounts } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedSource, setSelectedSource] = useState('all');
  const [filteredTransactions, setFilteredTransactions] = useState([]);

  useEffect(() => {
    filterTransactions();
  }, [transactions, searchQuery, selectedType, selectedSource]);

  const filterTransactions = () => {
    let filtered = [...transactions];

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(transaction =>
        transaction.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.note.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(transaction => transaction.type === selectedType);
    }

    // Filter by source
    if (selectedSource !== 'all') {
      filtered = filtered.filter(transaction => transaction.source === selectedSource);
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    setFilteredTransactions(filtered);
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'income': return '💰';
      case 'expense': return '💸';
      default: return '💳';
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case 'income': return '#10B981';
      case 'expense': return '#EF4444';
      default: return '#94A3B8';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
  };

  const getTotalAmount = () => {
    return filteredTransactions.reduce((total, transaction) => {
      if (transaction.type === 'income') {
        return total + transaction.amount;
      } else {
        return total - transaction.amount;
      }
    }, 0);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      
      {/* Header */}
      <View style={{ paddingTop: 60, paddingBottom: 20, paddingHorizontal: theme.spacing.lg, backgroundColor: theme.colors.background }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <AppButton
            style={{ width: 40, height: 40, borderRadius: theme.radii.button, backgroundColor: theme.colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.border }}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft color={theme.colors.textMain} size={22} />
          </AppButton>
          <Text style={{ fontFamily: theme.font.family.bold, fontSize: theme.font.size.section, color: theme.colors.textMain, letterSpacing: -0.3 }}>Transaction History</Text>
          <View style={{ width: 40 }} />
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <View style={styles.searchSection}>
          <Searchbar
            placeholder="Search transactions..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
            iconColor={theme.colors.textSubtle}
            inputStyle={styles.searchInput}
            placeholderTextColor={theme.colors.textHelper}
          />
        </View>


        {/* Filters */}
        <View style={styles.filtersSection}>
          <Text style={styles.sectionTitle}>Filters</Text>
          
          {/* Type Filter */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Type</Text>
            <AppSegmentedButton
              items={['All', 'Income', 'Expense']}
              selectedIndex={selectedType === 'all' ? 0 : selectedType === 'income' ? 1 : 2}
              onSelect={(index) => setSelectedType(index === 0 ? 'all' : index === 1 ? 'income' : 'expense')}
            />
          </View>

          {/* Source Filter */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Source</Text>
            <AppDropdown
              items={[{ label: 'All Sources', value: 'all' }, ...accounts.map((account) => ({ label: account.name, value: account.name }))]}
              selectedValue={selectedSource}
              onValueChange={setSelectedSource}
              placeholder="Select source"
              style={{ marginBottom: theme.spacing.lg }}
            />
          </View>
        </View>

        {/* Summary */}
        <View style={styles.summarySection}>
          <Surface style={styles.summaryCard}>
            <LinearGradient
              colors={['rgba(59, 130, 246, 0.1)', 'rgba(37, 99, 235, 0.05)']}
              style={styles.summaryGradient}
            >
              <Text style={styles.summaryLabel}>Filtered Total</Text>
              <Text style={styles.summaryAmount}>
                {formatCurrency(Math.abs(getTotalAmount()))}
              </Text>
              <Text style={styles.summaryType}>
                {getTotalAmount() >= 0 ? 'Net Income' : 'Net Expense'}
              </Text>
            </LinearGradient>
          </Surface>
        </View>

        {/* Transactions */}
        <View style={styles.transactionsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {filteredTransactions.length} Transaction{filteredTransactions.length !== 1 ? 's' : ''}
            </Text>
          </View>

          {filteredTransactions.length === 0 ? (
            <Surface style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>📝</Text>
              <Text style={styles.emptyTitle}>No transactions found</Text>
              <Text style={styles.emptyText}>
                Try adjusting your search or filters
              </Text>
            </Surface>
          ) : (
            filteredTransactions.map((transaction, index) => (
              <Surface key={transaction.id || transaction.title + '-' + index} style={styles.transactionCard}>
                <View style={styles.transactionRow}>
                  <View style={styles.transactionIcon}>
                    {(() => {
                      const Icon = CATEGORY_ICONS[transaction.category] || PiggyBank;
                      return <Icon color={getCategoryColor(transaction.category)} size={22} />;
                    })()}
                  </View>
                  
                  <View style={styles.transactionDetails}>
                    <View style={styles.transactionHeader}>
                      <Text style={styles.transactionTitle}>
                        {transaction.title}
                      </Text>
                      <Text style={[
                        styles.transactionAmount,
                        { color: getTransactionColor(transaction.type) }
                      ]}>
                        {transaction.type === 'expense' ? '-' : '+'}{formatCurrency(transaction.amount)}
                      </Text>
                      <TouchableOpacity
                        style={{ marginLeft: 8, padding: 4 }}
                        onPress={() => navigation.navigate('EditTransaction', { transaction })}
                      >
                        <Pencil color={theme.colors.textSubtle} size={18} />
                      </TouchableOpacity>
                    </View>
                    
                    <View style={styles.transactionMeta}>
                      <Text style={styles.transactionCategory}>
                        {transaction.category}
                      </Text>
                      <Text style={styles.transactionDate}>
                        {formatDate(transaction.date)}
                      </Text>
                    </View>
                    
                    <View style={styles.transactionFooter}>
                      <Text style={styles.transactionSource}>
                        {transaction.source}
                      </Text>
                      {transaction.note && (
                        <Text style={styles.transactionNote}>
                          {transaction.note}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              </Surface>
            ))
          )}
        </View>
      </ScrollView>
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
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#0F172A',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  backButtonText: {
    color: '#F9FAFB',
    fontSize: 20,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F9FAFB',
    letterSpacing: -0.3,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  searchSection: {
    marginBottom: 24,
  },
  searchBar: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.button,
    borderWidth: 1,
    borderColor: theme.colors.border,
    elevation: 0,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  searchInput: {
    fontFamily: theme.font.family.regular,
    fontSize: theme.font.size.body,
    color: theme.colors.textMain,
  },
  filtersSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F9FAFB',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  filterGroup: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  chipContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F9FAFB',
    letterSpacing: 0.2,
  },
  summarySection: {
    marginBottom: 24,
  },
  summaryCard: {
    borderRadius: 16,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    elevation: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  summaryGradient: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 8,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  summaryAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F9FAFB',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  summaryType: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  transactionsSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    marginBottom: 16,
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
    lineHeight: 20,
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
    padding: 16,
  },
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  transactionDetails: {
    flex: 1,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F9FAFB',
    flex: 1,
    marginRight: 12,
    letterSpacing: -0.2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  transactionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  transactionCategory: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#94A3B8',
    letterSpacing: 0.2,
  },
  transactionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  transactionSource: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  transactionNote: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
    flex: 1,
    textAlign: 'right',
    marginLeft: 8,
    letterSpacing: 0.2,
  },
});

export default HistoryScreen; 