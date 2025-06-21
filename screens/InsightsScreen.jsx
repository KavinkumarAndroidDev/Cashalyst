import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Surface, SegmentedButtons } from 'react-native-paper';
import { LineChart, PieChart, BarChart } from 'react-native-chart-kit';
import useStore from '../hooks/useStore';
import { formatCurrency } from '../utils/formatCurrency';
import theme from '../utils/theme';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  ShoppingCart,
  Utensils,
  Film,
  Banknote,
  Calendar,
  Wallet,
  BarChart2,
  List,
  FileText,
  Book,
  Car,
} from 'lucide-react-native';
import AppButton from '../components/AppButton';
import AppTextField from '../components/AppTextField';
import AppDropdown from '../components/AppDropdown';
import AppSegmentedButton from '../components/AppSegmentedButton';

const { width } = Dimensions.get('window');

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

const InsightsScreen = ({ navigation }) => {
  const { transactions, accounts, getStats } = useStore();
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [stats, setStats] = useState({
    totalBalance: 0,
    monthlyIncome: 0,
    monthlyExpense: 0,
    monthlySavings: 0,
  });

  useEffect(() => {
    const currentStats = getStats();
    setStats(currentStats);
  }, [transactions, accounts]);

  const periods = [
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
    { value: 'year', label: 'Year' },
  ];

  // Get category breakdown
  const getCategoryBreakdown = () => {
    const categoryData = {};
    
    transactions.forEach(transaction => {
      if (transaction.type === 'expense') {
        if (categoryData[transaction.category]) {
          categoryData[transaction.category] += transaction.amount;
        } else {
          categoryData[transaction.category] = transaction.amount;
        }
      }
    });

    return Object.entries(categoryData)
      .map(([category, amount]) => ({
        name: category,
        amount,
        color: getCategoryColor(category),
        legendFontColor: '#F9FAFB',
        legendFontSize: 12,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
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

  // Get monthly trend data
  const getMonthlyTrend = (monthsToShow = 6) => {
    // Get all months with transactions, sorted ascending
    const monthMap = {};
    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const key = `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2,'0')}`;
      if (!monthMap[key]) {
        monthMap[key] = { income: 0, expense: 0 };
      }
      if (transaction.type === 'income') {
        monthMap[key].income += transaction.amount;
      } else if (transaction.type === 'expense') {
        monthMap[key].expense += transaction.amount;
      }
    });
    // Sort months chronologically
    const sortedKeys = Object.keys(monthMap).sort();
    // Only show the last N months
    const lastKeys = sortedKeys.slice(-monthsToShow);
    const labels = lastKeys.map(key => {
      const [year, month] = key.split('-');
      return `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][parseInt(month)-1]} '${year.slice(-2)}`;
    });
    const incomeData = lastKeys.map(key =>
      isFinite(monthMap[key].income) ? monthMap[key].income : 0
    );
    const expenseData = lastKeys.map(key =>
      isFinite(monthMap[key].expense) ? monthMap[key].expense : 0
    );
    
    return {
      labels,
      datasets: [
        {
          data: incomeData,
          color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
          strokeWidth: 2,
        },
        {
          data: expenseData,
          color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };
  };

  // Get source breakdown
  const getSourceBreakdown = () => {
    const sourceData = {};
    
    transactions.forEach(transaction => {
      if (sourceData[transaction.source]) {
        sourceData[transaction.source] += transaction.amount;
      } else {
        sourceData[transaction.source] = transaction.amount;
      }
    });

    return Object.entries(sourceData)
      .map(([source, amount]) => ({
        name: source,
        amount: isFinite(amount) ? amount : 0, // ✅ Sanitize
        color: getSourceColor(source),
        legendFontColor: '#F9FAFB',
        legendFontSize: 12,
      }))
      .sort((a, b) => b.amount - a.amount);

  };

  const getSourceColor = (source) => {
    const colors = {
      'GPay': '#3B82F6',
      'Cash': '#10B981',
      'SBI Bank': '#8B5CF6',
      'Other': '#94A3B8',
    };
    return colors[source] || '#94A3B8';
  };

  const categoryBreakdown = getCategoryBreakdown();
  const monthlyTrend = getMonthlyTrend();
  const sourceBreakdown = getSourceBreakdown();

  // Helper for rendering Lucide icon for category
  const renderCategoryIcon = (category, color) => {
    const Icon = CATEGORY_ICONS[category] || PiggyBank;
    return <Icon color={color} size={20} />;
  };

  // Helper to ensure chart data is valid
  const isValidNumber = n => typeof n === 'number' && isFinite(n);
  const isValidDataArray = arr => Array.isArray(arr) && arr.length > 0 && arr.every(isValidNumber);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      {/* Header */}
      <View style={{ paddingTop: 60, paddingBottom: 20, paddingHorizontal: theme.spacing.lg, backgroundColor: theme.colors.background }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <AppButton
            style={{ width: 40, height: 40, borderRadius: theme.radii.button, backgroundColor: theme.colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.border }}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft color={theme.colors.textMain} size={22} />
          </AppButton>
          <Text style={{ fontFamily: theme.font.family.bold, fontSize: theme.font.size.section, color: theme.colors.textMain, letterSpacing: -0.3 }}>Financial Insights</Text>
          <View style={{ width: 40 }} />
        </View>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Period Selector */}
        <Text style={{ fontFamily: theme.font.family.medium, fontSize: theme.font.size.label, color: theme.colors.textSubtle, marginBottom: 8 }}>Time Period</Text>
        <Surface style={theme.card}>
          <AppSegmentedButton items={periods.map(p=>p.label)} selectedIndex={periods.findIndex(p=>p.value===selectedPeriod)} onSelect={(index)=>setSelectedPeriod(periods[index].value)} />
        </Surface>
        {/* Summary Cards */}
        <Text style={{ fontFamily: theme.font.family.bold, fontSize: theme.font.size.label, color: theme.colors.textMain, marginTop: theme.spacing.lg, marginBottom: 8 }}>Overview</Text>
        <View style={{ flexDirection: 'row', gap: theme.spacing.md, marginBottom: theme.spacing.lg }}>
          <Surface style={theme.card}>
            <View style={{ alignItems: 'center', padding: theme.spacing.md }}>
              <TrendingUp color={theme.colors.accent} size={20} style={{ marginBottom: 8 }} />
              <Text style={{ fontFamily: theme.font.family.bold, fontSize: theme.font.size.body, color: theme.colors.textMain, marginBottom: 4 }}>{formatCurrency(stats.monthlyIncome)}</Text>
              <Text style={{ fontFamily: theme.font.family.medium, fontSize: theme.font.size.caption, color: theme.colors.textSubtle }}>Income</Text>
            </View>
          </Surface>
          <Surface style={theme.card}>
            <View style={{ alignItems: 'center', padding: theme.spacing.md }}>
              <TrendingDown color={theme.colors.error} size={20} style={{ marginBottom: 8 }} />
              <Text style={{ fontFamily: theme.font.family.bold, fontSize: theme.font.size.body, color: theme.colors.textMain, marginBottom: 4 }}>{formatCurrency(stats.monthlyExpense)}</Text>
              <Text style={{ fontFamily: theme.font.family.medium, fontSize: theme.font.size.caption, color: theme.colors.textSubtle }}>Expenses</Text>
            </View>
          </Surface>
          <Surface style={theme.card}>
            <View style={{ alignItems: 'center', padding: theme.spacing.md }}>
              <PiggyBank color={theme.colors.success} size={20} style={{ marginBottom: 8 }} />
              <Text style={{ fontFamily: theme.font.family.bold, fontSize: theme.font.size.body, color: theme.colors.textMain, marginBottom: 4 }}>{formatCurrency(stats.monthlySavings)}</Text>
              <Text style={{ fontFamily: theme.font.family.medium, fontSize: theme.font.size.caption, color: theme.colors.textSubtle }}>Savings</Text>
            </View>
          </Surface>
        </View>
        {/* Monthly Trend Chart */}
        <Text style={{ fontFamily: theme.font.family.bold, fontSize: theme.font.size.label, color: theme.colors.textMain, marginBottom: 8 }}>Monthly Trend</Text>
        <Surface style={[theme.card, { alignItems: 'center', padding: theme.spacing.md }]}> {/* Chart container */}
          {monthlyTrend.labels.length > 0 &&
            monthlyTrend.datasets.every(ds => isValidDataArray(ds.data)) ? (
            <LineChart
              data={monthlyTrend}
              width={width - theme.spacing.lg * 2 - 20}
              height={220}
              chartConfig={{
                backgroundColor: theme.colors.card,
                backgroundGradientFrom: theme.colors.card,
                backgroundGradientTo: theme.colors.card,
                decimalPlaces: 0,
                color: (opacity = 1) => theme.colors.textMain,
                labelColor: (opacity = 1) => theme.colors.textSubtle,
                style: { borderRadius: theme.radii.card },
                propsForDots: {
                  r: '6',
                  strokeWidth: '2',
                  stroke: theme.colors.accent,
                },
              }}
              bezier
              style={{ marginVertical: 8, borderRadius: theme.radii.card }}
            />
          ) : (
            <View style={{ height: 220, justifyContent: 'center', alignItems: 'center' }}>
              <FileText color={theme.colors.textSubtle} size={48} style={{ marginBottom: 16 }} />
              <Text style={{ fontFamily: theme.font.family.medium, fontSize: theme.font.size.body, color: theme.colors.textSubtle, textAlign: 'center' }}>No valid trend data</Text>
            </View>
          )}
        </Surface>
        {/* Category Breakdown */}
        <Text style={{ fontFamily: theme.font.family.bold, fontSize: theme.font.size.label, color: theme.colors.textMain, marginTop: theme.spacing.lg, marginBottom: 8 }}>Expense by Category</Text>
        <Surface style={[theme.card, { alignItems: 'center', padding: theme.spacing.md }]}> {/* Chart container */}
          {categoryBreakdown.length > 0 && isValidDataArray(categoryBreakdown.map(c => c.amount)) ? (
            <PieChart
              data={categoryBreakdown}
              width={width - theme.spacing.lg * 2 - 20}
              height={220}
              chartConfig={{
                color: (opacity = 1) => theme.colors.textMain,
              }}
              accessor="amount"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          ) : (
            <View style={{ height: 220, justifyContent: 'center', alignItems: 'center' }}>
              <FileText color={theme.colors.textSubtle} size={48} style={{ marginBottom: 16 }} />
              <Text style={{ fontFamily: theme.font.family.medium, fontSize: theme.font.size.body, color: theme.colors.textSubtle, textAlign: 'center' }}>No expense data yet</Text>
            </View>
          )}
        </Surface>
        {/* Source Breakdown */}
        <Text style={{ fontFamily: theme.font.family.bold, fontSize: theme.font.size.label, color: theme.colors.textMain, marginTop: theme.spacing.lg, marginBottom: 8 }}>Transactions by Source</Text>
        <Surface style={[theme.card, { alignItems: 'center', padding: theme.spacing.md }]}> {/* Chart container */}
          {sourceBreakdown.length > 0 && isValidDataArray(sourceBreakdown.map(s => s.amount)) ? (
            <BarChart
              data={{
                labels: sourceBreakdown.map(item => item.name),
                datasets: [{ data: sourceBreakdown.map(item => isValidNumber(item.amount) ? item.amount : 0) }],
              }}
              width={width - theme.spacing.lg * 2 - 20}
              height={220}
              chartConfig={{
                backgroundColor: theme.colors.card,
                backgroundGradientFrom: theme.colors.card,
                backgroundGradientTo: theme.colors.card,
                decimalPlaces: 0,
                color: (opacity = 1) => theme.colors.accent,
                labelColor: (opacity = 1) => theme.colors.textSubtle,
                style: { borderRadius: theme.radii.card },
              }}
              style={{ marginVertical: 8, borderRadius: theme.radii.card }}
            />
          ) : (
            <View style={{ height: 220, justifyContent: 'center', alignItems: 'center' }}>
              <FileText color={theme.colors.textSubtle} size={48} style={{ marginBottom: 16 }} />
              <Text style={{ fontFamily: theme.font.family.medium, fontSize: theme.font.size.body, color: theme.colors.textSubtle, textAlign: 'center' }}>No transaction data yet</Text>
            </View>
          )}
        </Surface>
        {/* Top Categories List */}
        <Text style={{ fontFamily: theme.font.family.bold, fontSize: theme.font.size.label, color: theme.colors.textMain, marginTop: theme.spacing.lg, marginBottom: 8 }}>Top Expense Categories</Text>
        {categoryBreakdown.length > 0 ? (
          categoryBreakdown.map((category, index) => (
            <Surface key={category.name} style={[theme.card, { flexDirection: 'row', alignItems: 'center', padding: theme.spacing.md, marginBottom: theme.spacing.md }]}> 
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View style={{ width: 40, height: 40, borderRadius: theme.radii.card, backgroundColor: category.color + '20', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  {renderCategoryIcon(category.name, category.color)}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: theme.font.family.bold, fontSize: theme.font.size.body, color: theme.colors.textMain, marginBottom: 2 }}>{category.name}</Text>
                  <Text style={{ fontFamily: theme.font.family.medium, fontSize: theme.font.size.caption, color: theme.colors.textSubtle }}>{formatCurrency(category.amount)}</Text>
                </View>
              </View>
              <View style={{ backgroundColor: theme.colors.card, paddingHorizontal: 12, paddingVertical: 6, borderRadius: theme.radii.button, borderWidth: 1, borderColor: theme.colors.border }}>
                <Text style={{ fontFamily: theme.font.family.bold, fontSize: theme.font.size.caption, color: theme.colors.textMain }}>#{index + 1}</Text>
              </View>
            </Surface>
          ))
        ) : (
          <Surface style={[theme.card, { alignItems: 'center', padding: theme.spacing.xl, marginBottom: theme.spacing.md }]}> 
            <FileText color={theme.colors.textSubtle} size={48} style={{ marginBottom: 16 }} />
            <Text style={{ fontFamily: theme.font.family.bold, fontSize: theme.font.size.body, color: theme.colors.textMain, marginBottom: 8 }}>No categories yet</Text>
            <Text style={{ fontFamily: theme.font.family.medium, fontSize: theme.font.size.caption, color: theme.colors.textSubtle, textAlign: 'center' }}>
              Add some transactions to see your spending patterns
            </Text>
          </Surface>
        )}
      </ScrollView>
    </View>
  );
};

export default InsightsScreen; 