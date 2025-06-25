import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Alert,
  Animated,
  Easing,
  SectionList,
  FlatList,
  Dimensions,
  Keyboard,
} from 'react-native';
import { Surface, Searchbar, Chip, IconButton, Modal, Portal, Provider as PaperProvider } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import useStore from '../hooks/useStore';
import { formatCurrency } from '../utils/formatCurrency';
import AppButton from '../components/AppButton';
import AppTextField from '../components/AppTextField';
import AppDropdown from '../components/AppDropdown';
import { ArrowLeft, Pencil, PiggyBank, Utensils, Car, ShoppingCart, Film, Banknote, Calendar, FileText, Book, Trash2, Filter, RefreshCw, X, SlidersHorizontal } from 'lucide-react-native';
import AppSegmentedButton from '../components/AppSegmentedButton';
import theme from '../utils/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppSearchBar from '../components/AppSearchBar';
import { responsiveFontSize, moderateScale } from '../utils/scale';

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

const FILTERS_KEY = 'history_last_filters';
const SAVED_VIEWS_KEY = 'history_saved_views';

const EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Education',
  'Travel',
  'Other',
];
const INCOME_CATEGORIES = [
  'Salary',
  'Freelance',
  'Investment',
  'Gift',
  'Refund',
  'Other',
];

// Helper to get all unique categories
const ALL_CATEGORIES = Array.from(new Set([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES]));

const HistoryScreen = ({ navigation }) => {
  const { transactions, accounts, deleteTransaction } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedSource, setSelectedSource] = useState('all');
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState('from');
  const [showSubtotals, setShowSubtotals] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [modalType, setModalType] = useState(selectedType);
  const [modalCategory, setModalCategory] = useState(selectedCategory);
  const [modalSource, setModalSource] = useState(selectedSource);
  const [modalDateRange, setModalDateRange] = useState(dateRange);
  const [showModalDatePicker, setShowModalDatePicker] = useState(false);
  const [modalDatePickerMode, setModalDatePickerMode] = useState('from');

  const getTotalAmount = () => {
    return filteredTransactions.reduce((total, transaction) => {
      if (transaction.type === 'income') {
        return total + transaction.amount;
      } else {
        return total - transaction.amount;
      }
    }, 0);
  };

  const [animatedTotal] = useState(new Animated.Value(Math.abs(getTotalAmount())));
  const [lastTotal, setLastTotal] = useState(Math.abs(getTotalAmount()));
  const [collapsedMonths, setCollapsedMonths] = useState({});
  const [visibleCounts, setVisibleCounts] = useState({});
  const PAGE_SIZE = 20;
  const [savedViews, setSavedViews] = useState([]);

  const windowWidth = Dimensions.get('window').width;
  const isSmallScreen = windowWidth < 400;

  useEffect(() => {
    (async () => {
      const last = await AsyncStorage.getItem(FILTERS_KEY);
      if (last) {
        const f = JSON.parse(last);
        setSelectedType(f.selectedType || 'all');
        setSelectedSource(f.selectedSource || 'all');
        setSelectedCategory(f.selectedCategory || 'all');
        setDateRange(f.dateRange || { from: null, to: null });
        setSearchQuery(f.searchQuery || '');
      }
      const views = await AsyncStorage.getItem(SAVED_VIEWS_KEY);
      if (views) setSavedViews(JSON.parse(views));
    })();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(FILTERS_KEY, JSON.stringify({ selectedType, selectedSource, selectedCategory, dateRange, searchQuery }));
  }, [selectedType, selectedSource, selectedCategory, dateRange, searchQuery]);

  const saveCurrentView = async () => {
    const newView = {
      name: `View ${savedViews.length + 1}`,
      filters: { selectedType, selectedSource, selectedCategory, dateRange, searchQuery },
    };
    const updated = [...savedViews, newView];
    setSavedViews(updated);
    await AsyncStorage.setItem(SAVED_VIEWS_KEY, JSON.stringify(updated));
  };

  const applySavedView = (view) => {
    setSelectedType(view.filters.selectedType);
    setSelectedSource(view.filters.selectedSource);
    setSelectedCategory(view.filters.selectedCategory);
    setDateRange(view.filters.dateRange);
    setSearchQuery(view.filters.searchQuery);
  };

  const availableCategories = selectedType === 'income'
    ? INCOME_CATEGORIES
    : EXPENSE_CATEGORIES;
  useEffect(() => {
    if (selectedCategory !== 'all' && !availableCategories.includes(selectedCategory)) {
      setSelectedCategory('all');
    }
  }, [selectedType]);

  useEffect(() => {
    filterTransactions();
  }, [transactions, searchQuery, selectedType, selectedSource, selectedCategory, dateRange]);

  useEffect(() => {
    const newTotal = Math.abs(getTotalAmount());
    Animated.timing(animatedTotal, {
      toValue: newTotal,
      duration: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    setLastTotal(newTotal);
  }, [filteredTransactions]);

  const handleSearchChange = (text) => {
    setSearchQuery(text);
  };

  const handleSearchSubmit = (text) => {
    setSearchQuery(text);
  };

  const handleSearchClear = () => {
    setSearchQuery('');
  };

  const filterTransactions = () => {
    let filtered = [...transactions];

    if (searchQuery.trim()) {
      filtered = filtered.filter(transaction =>
        transaction.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.note.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.source.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter(transaction => transaction.type === selectedType);
    }

    if (selectedSource !== 'all') {
      filtered = filtered.filter(transaction => transaction.source === selectedSource);
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(transaction => transaction.category === selectedCategory);
    }

    if (dateRange.from) {
      filtered = filtered.filter(transaction => new Date(transaction.date) >= new Date(dateRange.from));
    }
    if (dateRange.to) {
      filtered = filtered.filter(transaction => new Date(transaction.date) <= new Date(dateRange.to));
    }

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

  const handleDelete = (transaction) => {
    Alert.alert(
      'Delete Transaction',
      `Are you sure you want to delete "${transaction.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTransaction(transaction.id);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete transaction. Please try again.');
            }
          },
        },
      ]
    );
  };

  const getIncomeExpenseTotals = () => {
    let income = 0, expense = 0;
    filteredTransactions.forEach(t => {
      if (t.type === 'income') income += t.amount;
      else if (t.type === 'expense') expense += t.amount;
    });
    return { income, expense };
  };

  const groupByMonth = (txs) => {
    const groups = {};
    txs.forEach(tx => {
      const d = new Date(tx.date);
      const key = `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(tx);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  };

  const monthSections = groupByMonth(filteredTransactions).map(([month, txs]) => {
    const visible = visibleCounts[month] || PAGE_SIZE;
    return {
      title: month,
      data: collapsedMonths[month] ? [] : txs.slice(0, visible),
      allData: txs,
      visible,
      hasMore: txs.length > visible,
    };
  });

  const toggleMonth = (month) => {
    setCollapsedMonths(prev => ({ ...prev, [month]: !prev[month] }));
  };
  const loadMoreMonth = (month) => {
    setVisibleCounts(prev => ({ ...prev, [month]: (prev[month] || PAGE_SIZE) + PAGE_SIZE }));
  };

  const openFilterModal = () => {
    setModalType(selectedType);
    setModalCategory(selectedCategory);
    setModalSource(selectedSource);
    setModalDateRange(dateRange);
    setFilterModalVisible(true);
  };

  const applyModalFilters = () => {
    setSelectedType(modalType);
    setSelectedCategory(modalCategory);
    setSelectedSource(modalSource);
    setDateRange(modalDateRange);
    setFilterModalVisible(false);
  };

  const resetModalFilters = () => {
    setModalType('all');
    setModalCategory('all');
    setModalSource('all');
    setModalDateRange({ from: null, to: null });
  };

  // In modal: category options logic
  const getModalCategories = () => {
    if (modalType === 'all') return ALL_CATEGORIES;
    if (modalType === 'income') return INCOME_CATEGORIES;
    return EXPENSE_CATEGORIES;
  };

  // In modal: dropdown style
  const modalDropdownStyle = { width: '100%', alignSelf: 'flex-start', height: 44, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.background, justifyContent: 'center', marginBottom: 0 };

  // In modal: button style
  const modalButtonStyle = { flex: 1, minHeight: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 16, paddingHorizontal: 0, paddingVertical: 0 };

  const renderHeader = () => (
    <View style={{ backgroundColor: theme.colors.background, paddingBottom: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <AppSearchBar
          onSearch={setSearchQuery}
          placeholder="Search transactions..."
          style={{ flex: 1 }}
        />
        <AppButton style={{ backgroundColor: theme.colors.accent, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 12, elevation: 2 }} onPress={openFilterModal}>
          <SlidersHorizontal color="#fff" size={20} />
        </AppButton>
      </View>
      <TouchableOpacity onPress={() => setShowSubtotals(v => !v)} activeOpacity={0.85} style={{ marginBottom: 8, alignItems: 'center' }}>
        <Animated.Text style={{ color: theme.colors.textMain, fontFamily: theme.font.family.bold, fontSize: 17, letterSpacing: -0.2 }}>
          {`Showing ${filteredTransactions.length} transaction${filteredTransactions.length !== 1 ? 's' : ''} · Total: ₹${Math.abs(getTotalAmount()).toLocaleString()}`}
        </Animated.Text>
        {showSubtotals && (
          <View style={{ flexDirection: 'row', marginTop: 4, gap: 16 }}>
            {(() => {
              const { income, expense } = getIncomeExpenseTotals();
              return <>
                <Text style={{ color: '#10B981', fontFamily: theme.font.family.bold, fontSize: 14 }}>Income: ₹{income.toLocaleString()}</Text>
                <Text style={{ color: '#EF4444', fontFamily: theme.font.family.bold, fontSize: 14 }}>Expense: ₹{expense.toLocaleString()}</Text>
              </>;
            })()}
          </View>
        )}
      </TouchableOpacity>
      <Portal>
        <Modal visible={filterModalVisible} onDismiss={() => setFilterModalVisible(false)} contentContainerStyle={{ backgroundColor: 'transparent' }}>
          <Surface style={{ backgroundColor: theme.colors.card, borderRadius: 20, padding: 0, marginHorizontal: 16, elevation: 8, shadowOpacity: 0.12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopLeftRadius: 20, borderTopRightRadius: 20, backgroundColor: theme.colors.accent, paddingHorizontal: 20, paddingVertical: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <SlidersHorizontal color="#fff" size={20} />
                <Text style={{ color: '#fff', fontFamily: theme.font.family.bold, fontSize: 18, fontWeight: '700' }}>Filters</Text>
              </View>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <X color="#fff" size={22} />
              </TouchableOpacity>
            </View>
            <View style={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 12 }}>
              {/* Type Chips Row */}
              <Text style={{ color: theme.colors.textSubtle, fontFamily: theme.font.family.medium, fontSize: 13, marginBottom: 6 }}>Type</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                {['all', 'income', 'expense'].map(type => (
                  <Chip
                    key={type}
                    selected={modalType === type}
                    onPress={() => setModalType(type)}
                    style={{ backgroundColor: modalType === type ? theme.colors.accent : theme.colors.background, borderRadius: 16, height: 40, minWidth: 80, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border }}
                    textStyle={{ color: modalType === type ? '#fff' : theme.colors.textMain, fontFamily: theme.font.family.medium, fontSize: 15, textAlign: 'center' }}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Chip>
                ))}
              </View>
              {/* Category Dropdown */}
              <Text style={{ color: theme.colors.textSubtle, fontFamily: theme.font.family.medium, fontSize: 13, marginBottom: 6 }}>Category</Text>
              <View style={{ marginBottom: 16, width: '100%' }}>
                <AppDropdown
                  items={[{ label: 'All Categories', value: 'all' }, ...getModalCategories().map(cat => ({ label: cat, value: cat }))]}
                  selectedValue={modalCategory}
                  onValueChange={setModalCategory}
                  placeholder="Category"
                  style={modalDropdownStyle}
                />
              </View>
              {/* Source Dropdown */}
              <Text style={{ color: theme.colors.textSubtle, fontFamily: theme.font.family.medium, fontSize: 13, marginBottom: 6 }}>Source</Text>
              <View style={{ marginBottom: 16, width: '100%' }}>
                <AppDropdown
                  items={[{ label: 'All Sources', value: 'all' }, ...accounts.map((account) => ({ label: account.name, value: account.name }))]}
                  selectedValue={modalSource}
                  onValueChange={setModalSource}
                  placeholder="Source"
                  style={modalDropdownStyle}
                />
              </View>
              {/* Date Range Row */}
              <Text style={{ color: theme.colors.textSubtle, fontFamily: theme.font.family.medium, fontSize: 13, marginBottom: 6 }}>Date Range</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20, justifyContent: 'center' }}>
                <TouchableOpacity onPress={() => { setShowModalDatePicker(true); setModalDatePickerMode('from'); }} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.background, borderRadius: 16, paddingHorizontal: 16, height: 40, borderWidth: 1, borderColor: theme.colors.border, minWidth: 110, justifyContent: 'center' }}>
                  <Calendar color={theme.colors.textSubtle} size={18} />
                  <Text style={{ color: theme.colors.textMain, marginLeft: 6, fontFamily: theme.font.family.medium, fontSize: 15 }}>
                    {modalDateRange.from ? new Date(modalDateRange.from).toLocaleDateString() : 'From'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setShowModalDatePicker(true); setModalDatePickerMode('to'); }} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.background, borderRadius: 16, paddingHorizontal: 16, height: 40, borderWidth: 1, borderColor: theme.colors.border, minWidth: 110, justifyContent: 'center' }}>
                  <Calendar color={theme.colors.textSubtle} size={18} />
                  <Text style={{ color: theme.colors.textMain, marginLeft: 6, fontFamily: theme.font.family.medium, fontSize: 15 }}>
                    {modalDateRange.to ? new Date(modalDateRange.to).toLocaleDateString() : 'To'}
                  </Text>
                </TouchableOpacity>
              </View>
              {showModalDatePicker && (
                <DateTimePicker
                  value={modalDateRange[modalDatePickerMode] ? new Date(modalDateRange[modalDatePickerMode]) : new Date()}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowModalDatePicker(false);
                    if (selectedDate) {
                      setModalDateRange(prev => ({ ...prev, [modalDatePickerMode]: selectedDate }));
                    }
                  }}
                />
              )}
              {/* Action Row */}
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 0, justifyContent: 'center', width: '100%' }}>
                <AppButton style={{ ...modalButtonStyle, backgroundColor: theme.colors.accent, elevation: 2 }} onPress={applyModalFilters}>
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15, textAlign: 'center' }}>Apply</Text>
                </AppButton>
                <AppButton style={{ ...modalButtonStyle, backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.border, elevation: 0 }} onPress={resetModalFilters}>
                  <Text style={{ color: theme.colors.textMain, fontWeight: '700', fontSize: 15, textAlign: 'center' }}>Reset</Text>
                </AppButton>
              </View>
            </View>
          </Surface>
        </Modal>
      </Portal>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
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
      <FlatList
        data={monthSections}
        keyExtractor={section => section.title}
        ListHeaderComponent={renderHeader}
        stickyHeaderIndices={[0]}
        renderItem={({ item: section }) => (
          <View key={section.title} style={{ marginBottom: 24 }}>
            <TouchableOpacity onPress={() => toggleMonth(section.title)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.colors.card, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: theme.colors.border, marginBottom: 8 }}>
              <Text style={{ color: theme.colors.textMain, fontFamily: theme.font.family.bold, fontSize: 16 }}>{new Date(section.title + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}</Text>
              <Text style={{ color: theme.colors.textSubtle, fontSize: 14 }}>{collapsedMonths[section.title] ? '▼' : '▲'}</Text>
            </TouchableOpacity>
            {!collapsedMonths[section.title] && section.data.map((transaction, index) => (
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
                      <TouchableOpacity
                        style={{ marginLeft: 4, padding: 4 }}
                        onPress={() => handleDelete(transaction)}
                      >
                        <Trash2 color={theme.colors.error} size={18} />
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
            ))}
            {!collapsedMonths[section.title] && section.hasMore && (
              <AppButton style={{ marginTop: 8, alignSelf: 'center', backgroundColor: theme.colors.accent, borderRadius: 8, paddingHorizontal: 24, paddingVertical: 10 }} onPress={() => loadMoreMonth(section.title)}>
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Load More</Text>
              </AppButton>
            )}
          </View>
        )}
        ListEmptyComponent={
          <Surface style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyTitle}>No transactions found</Text>
            <Text style={styles.emptyText}>
              Try adjusting your search or filters
            </Text>
          </Surface>
        }
        contentContainerStyle={styles.scrollContent}
      />
      {showDatePicker && (
        <DateTimePicker
          value={dateRange[datePickerMode] ? new Date(dateRange[datePickerMode]) : new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              setDateRange(prev => ({ ...prev, [datePickerMode]: selectedDate }));
            }
          }}
        />
      )}
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
  stickyFilters: {
    padding: 12,
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