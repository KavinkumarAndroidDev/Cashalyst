import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StatusBar,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Surface, SegmentedButtons } from 'react-native-paper';
import { LineChart, PieChart, BarChart } from 'react-native-chart-kit';
import useStore from '../hooks/useStore';
import { formatCurrency } from '../utils/formatCurrency';
import theme from '../utils/theme';
import { responsiveFontSize, moderateScale } from '../utils/scale';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  ShoppingCart,
  Coffee,
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
// get device window width for responsive charts 
const { width } = Dimensions.get('window');
//map of category names to icon components(lucide icons)
//used when rendering category list items to show a relevant icon 
const CATEGORY_ICONS = {
  'Food & Dining': Coffee,
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
  //pull transactions and accounts from global store(custom hook)
  const { transactions, accounts } = useStore();
  //selectedPeriod determines whether we show week/month/year views
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  //local state holding summary statistics
  const [stats, setStats] = useState({
    totalBalance: 0,
    monthlyIncome: 0,
    monthlyExpense: 0,
    monthlySavings: 0,
  });

  // Filtering logic
  //returns filtered transactions by selectedPeriod
  const getFilteredTransactions = () => {
    const today = new Date();
    //for 'week' view include today and last 6 days 
    if (selectedPeriod === 'week') {
      const start = new Date(today);
      start.setDate(today.getDate() - 6);
      return transactions.filter(t => {
        const d = new Date(t.date);
        return d >= start && d <= today;
      });
    } else if (selectedPeriod === 'month') {
      // for 'month' view include transactions in current month and year
      const month = today.getMonth();
      const year = today.getFullYear();
      return transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === month && d.getFullYear() === year;
      });
    } else if (selectedPeriod === 'year') {
      //for 'year' view include transactions in current year
      const year = today.getFullYear();
      return transactions.filter(t => {
        const d = new Date(t.date);
        return d.getFullYear() === year;
      });
    }
    //fallback:return all transactions
    return transactions;
  };
  //compute filtered transactions once per render

  const filteredTransactions = getFilteredTransactions();
  //options for the segmented period selector UI

  const periods = [
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
    { value: 'year', label: 'Year' },
  ];

  // Get category breakdown
  const getCategoryBreakdown = () => {
    const categoryData = {};
    
    filteredTransactions.forEach(transaction => {
      //only count expenses for category breakdown 
      if (transaction.type === 'expense') {
        if (categoryData[transaction.category]) {
          categoryData[transaction.category] += transaction.amount;
        } else {
          categoryData[transaction.category] = transaction.amount;
        }
      }
    });
    // turn grouped data into array format required by chart lib

    return Object.entries(categoryData)
      .map(([category, amount]) => ({
        name: category,
        amount,
        color: getCategoryColor(category),
        legendFontColor: '#F9FAFB',
        legendFontSize: 12,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);//take top 5 categories  for display
  };
  //return colour hex based on category name(used by charts)

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

  // Get trend data
  const getTrendData = (period, txns) => {
    if (period === 'week') {
      // 7 days: today and previous 6 days
      const days = [];
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        days.push(d);
      }
      const labels = days.map(d => `${d.getDate()}/${d.getMonth() + 1}`);
      const incomeData = days.map(day => txns.filter(t => t.type === 'income' && new Date(t.date).toDateString() === day.toDateString()).reduce((sum, t) => sum + t.amount, 0));
      const expenseData = days.map(day => txns.filter(t => t.type === 'expense' && new Date(t.date).toDateString() === day.toDateString()).reduce((sum, t) => sum + t.amount, 0));
      return {
        labels,
        datasets: [
          { data: incomeData, color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`, strokeWidth: 2 },
          { data: expenseData, color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`, strokeWidth: 2 },
        ],
      };
    } else if (period === 'month') {
      // Group by week in current month
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      // Find week ranges (1-7, 8-14, 15-21, 22-28, 29-end)
      const weekRanges = [
        [1, 7],
        [8, 14],
        [15, 21],
        [22, 28],
        [29, daysInMonth],
      ];
      const labels = weekRanges.map((_, i) => `W${i + 1}`);
      const incomeData = weekRanges.map(([start, end]) =>
        txns.filter(t => {
          const d = new Date(t.date);
          return (
            t.type === 'income' &&
            d.getMonth() === month &&
            d.getFullYear() === year &&
            d.getDate() >= start && d.getDate() <= end
          );
        }).reduce((sum, t) => sum + t.amount, 0)
      );
      const expenseData = weekRanges.map(([start, end]) =>
        txns.filter(t => {
          const d = new Date(t.date);
          return (
            t.type === 'expense' &&
            d.getMonth() === month &&
            d.getFullYear() === year &&
            d.getDate() >= start && d.getDate() <= end
          );
        }).reduce((sum, t) => sum + t.amount, 0)
      );
      return {
        labels,
        datasets: [
          { data: incomeData, color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`, strokeWidth: 2 },
          { data: expenseData, color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`, strokeWidth: 2 },
        ],
      };
    } else if (period === 'year') {
      // Current year, group by month
      const today = new Date();
      const year = today.getFullYear();
      const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const incomeData = labels.map((label, i) => txns.filter(t => t.type === 'income' && new Date(t.date).getMonth() === i && new Date(t.date).getFullYear() === year).reduce((sum, t) => sum + t.amount, 0));
      const expenseData = labels.map((label, i) => txns.filter(t => t.type === 'expense' && new Date(t.date).getMonth() === i && new Date(t.date).getFullYear() === year).reduce((sum, t) => sum + t.amount, 0));
      return {
        labels,
        datasets: [
          { data: incomeData, color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`, strokeWidth: 2 },
          { data: expenseData, color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`, strokeWidth: 2 },
        ],
      };
    }
    //default empty chart data
    return { labels: [], datasets: [] };
  };
  //compute trend data for current selected period and filtered transactions

  const trendData = getTrendData(selectedPeriod, filteredTransactions);

  // Overview logic:
  const overview = React.useMemo(() => {
    let income = 0, expense = 0;
    filteredTransactions.forEach(t => {
      if (t.type === 'income') income += t.amount;
      else if (t.type === 'expense') expense += t.amount;
    });
    return {
      income,
      expense,
      savings: income - expense,
    };
  }, [filteredTransactions]);

  // Get source breakdown
  const getSourceBreakdown = () => {
    const sourceData = {};
    
    filteredTransactions.forEach(transaction => {
      if (sourceData[transaction.source]) {
        sourceData[transaction.source] += transaction.amount;
      } else {
        sourceData[transaction.source] = transaction.amount;
      }
    });

    return Object.entries(sourceData)
      .map(([source, amount]) => ({
        name: source,
        //ensure amount is finite before passing to chart
        amount: isFinite(amount) ? amount : 0, // ✅ Sanitize
        color: getSourceColor(source),
        legendFontColor: '#F9FAFB',
        legendFontSize: 12,
      }))
      .sort((a, b) => b.amount - a.amount);

  };
  //colors for common sources

  const getSourceColor = (source) => {
    const colors = {
      'GPay': '#3B82F6',
      'Cash': '#10B981',
      'SBI Bank': '#8B5CF6',
      'Other': '#94A3B8',
    };
    return colors[source] || '#94A3B8';
  };
  //derived datasets for charts
  const categoryBreakdown = getCategoryBreakdown();
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
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      {/* Header */}
      <View style={{ paddingTop: 20, paddingBottom: 20, paddingHorizontal: theme.spacing.lg, backgroundColor: theme.colors.background }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <AppButton
            style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: theme.colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.border }}
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
        <Text style={{ fontFamily: theme.font.family.bold, fontSize: theme.font.size.label, color: theme.colors.textMain, marginTop: theme.spacing.md, marginBottom: 8 }}>Overview ({periods.find(p=>p.value===selectedPeriod).label})</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.md, marginBottom: theme.spacing.lg }}>
          <Surface style={[theme.card, { flex: 1, alignItems: 'center', padding: theme.spacing.md  }]}>
            <TrendingUp color={theme.colors.accent} size={18} style={{ marginBottom: 4 }} />
            <Text style={{ fontFamily: theme.font.family.bold, fontSize: theme.font.size.body, color: theme.colors.textMain, marginBottom: 2 }}>{formatCurrency(overview.income)}</Text>
            <Text style={{ fontFamily: theme.font.family.medium, fontSize: theme.font.size.note, color: theme.colors.textSubtle }}>Income</Text>
          </Surface>
          <Surface style={[theme.card, { flex: 1, alignItems: 'center', padding: theme.spacing.md  }]}> 
            <TrendingDown color={theme.colors.error} size={18} style={{ marginBottom: 4 }} />
            <Text style={{ fontFamily: theme.font.family.bold, fontSize: theme.font.size.body, color: theme.colors.textMain, marginBottom: 2 }}>{formatCurrency(overview.expense)}</Text>
            <Text style={{ fontFamily: theme.font.family.medium, fontSize: theme.font.size.note, color: theme.colors.textSubtle }}>Expenses</Text>
          </Surface>
          <Surface style={[theme.card, { flex: 1, alignItems: 'center', padding: theme.spacing.md }]}> 
            <PiggyBank color={theme.colors.textSubtle} size={18} style={{ marginBottom: 4 }} />
            <Text style={{ fontFamily: theme.font.family.bold, fontSize: theme.font.size.body, color: theme.colors.textMain, marginBottom: 2 }}>{formatCurrency(overview.savings)}</Text>
            <Text style={{ fontFamily: theme.font.family.medium, fontSize: theme.font.size.note, color: theme.colors.textSubtle }}>Savings</Text>
          </Surface>
        </View>
        {/* Trend Chart */}
        <Text style={{ fontFamily: theme.font.family.bold, fontSize: theme.font.size.label, color: theme.colors.textMain, marginBottom: 8 }}>{periods.find(p=>p.value===selectedPeriod).label} Trend</Text>
        <Surface style={[theme.card, { alignItems: 'center', padding: theme.spacing.md }]}>
          {trendData.labels.length > 0 &&
            trendData.datasets.every(ds => isValidDataArray(ds.data)) ? (
            <>
              <LineChart
                data={trendData}
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
              {/* Legend for trend chart */}
              <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 8, marginBottom: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16 }}>
                  <View style={{ width: 16, height: 4, borderRadius: 2, backgroundColor: 'rgba(16, 185, 129, 1)', marginRight: 6 }} />
                  <Text style={{ fontFamily: theme.font.family.medium, fontSize: theme.font.size.caption, color: theme.colors.textMain }}>Income</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 16, height: 4, borderRadius: 2, backgroundColor: 'rgba(239, 68, 68, 1)', marginRight: 6 }} />
                  <Text style={{ fontFamily: theme.font.family.medium, fontSize: theme.font.size.caption, color: theme.colors.textMain }}>Expenses</Text>
                </View>
              </View>
            </>
          ) : (
            //empty state when there are no expense categories to show
            <View style={{ height: 220, justifyContent: 'center', alignItems: 'center' }}>
              <FileText color={theme.colors.textSubtle} size={48} style={{ marginBottom: 16 }} />
              <Text style={{ fontFamily: theme.font.family.medium, fontSize: theme.font.size.body, color: theme.colors.textSubtle, textAlign: 'center' }}>No valid trend data</Text>
            </View>
          )}
        </Surface>
        {/* Category Breakdown */}
        <Text style={{ fontFamily: theme.font.family.bold, fontSize: theme.font.size.label, color: theme.colors.textMain, marginTop: theme.spacing.md, marginBottom: 8 }}>Expense by Category</Text>
        <Surface style={[theme.card, { alignItems: 'center', padding: theme.spacing.md }]}>
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
        <Text style={{ fontFamily: theme.font.family.bold, fontSize: theme.font.size.label, color: theme.colors.textMain, marginTop: theme.spacing.md, marginBottom: 8 }}>Transactions by Source</Text>
        <Surface style={[theme.card, { alignItems: 'center', padding: theme.spacing.md }]}>
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
        <Text style={{ fontFamily: theme.font.family.bold, fontSize: theme.font.size.label, color: theme.colors.textMain, marginTop: theme.spacing.md, marginBottom: 8 }}>Top Expense Categories</Text>
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
    </SafeAreaView>
  );
};

export default InsightsScreen; 