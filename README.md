# Cashalyst - Personal Finance Tracker

A simple yet powerful personal finance tracking app built with React Native and Expo. Perfect for students and early-career individuals who want to track their daily expenses and income with clear insights.

## Features

### 🏠 Home Dashboard
- **Total Balance**: View your overall financial position across all accounts with smooth animations
- **Monthly Summary**: Quick overview of income, expenses, and savings for the current month
- **Account Balances**: See individual balances for each money source (Cash, GPay, Bank)
- **Recent Transactions**: Last 5 transactions with improved visual hierarchy and better spacing
- **Quick Actions**: Easy access to add transactions and view history

### ➕ Add Transactions
- **Simple Form**: Easy input for daily transactions with consistent spacing
- **Transaction Types**: Income or Expense with color-coded indicators
- **Categories**: Predefined categories for both income and expenses
- **Multiple Sources**: Track transactions across different accounts
- **Account Impact Preview**: Real-time balance validation and warnings
- **Optional Notes**: Add context to your transactions

### 📋 Transaction History
- **Search & Filter**: Find transactions by category, type, or source with enhanced filter modal
- **Date-based Viewing**: Browse transactions chronologically
- **Delete Transactions**: Remove incorrect entries with themed confirmation popups
- **Pull to Refresh**: Update data with a simple swipe
- **Improved UI**: Better transaction cards with circular icons and cleaner layout

### 📊 Insights & Analytics
- **Category Spending**: Pie chart showing where your money goes
- **Income vs Expenses**: Bar chart comparison for monthly overview
- **Balance Trends**: Line chart tracking your financial growth
- **Monthly Selector**: View insights for different months
- **Account Breakdown**: Individual account balance tracking

### 🎨 Enhanced User Experience
- **Custom Modal System**: Themed popups replacing native alerts
- **Balance Validation**: Real-time warnings for insufficient funds
- **Smooth Animations**: Balance change animations and transitions
- **Consistent Spacing**: Standardized margins and padding throughout
- **Better Visual Hierarchy**: Improved typography and layout consistency

## Tech Stack

- **Frontend**: React Native with Expo
- **Navigation**: React Navigation (Bottom Tabs)
- **UI Components**: React Native Paper
- **State Management**: Zustand
- **Database**: SQLite (expo-sqlite)
- **Charts**: React Native Chart Kit
- **Forms**: React Hook Form
- **Icons**: Lucide React Native
- **Blur Effects**: Expo Blur

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Expo CLI
- Android Studio (for Android development) or Xcode (for iOS development)

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/KavinkumarAndroidDev/Cashalyst
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Run on device/simulator**
   - Press `a` for Android
   - Press `i` for iOS
   - Scan QR code with Expo Go app on your phone

## Project Structure

```
Cashalyst/
├── screens/                 # Main app screens
│   ├── HomeScreen.jsx      # Dashboard with overview
│   ├── AddTransactionScreen.jsx  # Transaction input form
│   ├── EditTransactionScreen.jsx # Transaction editing
│   ├── HistoryScreen.jsx   # Transaction history & search
│   ├── InsightsScreen.jsx  # Analytics & charts
│   ├── AccountsScreen.jsx  # Account management
│   └── SetupScreen.jsx     # Initial setup
├── components/             # Reusable UI components
│   ├── AppButton.jsx       # Custom button component
│   ├── AppTextField.jsx    # Custom text input
│   ├── AppDropdown.jsx     # Custom dropdown
│   ├── AppSearchBar.jsx    # Search functionality
│   ├── AppSegmentedButton.jsx # Segmented controls
│   ├── AppModal.jsx        # Custom modal system
│   └── SplashScreen.jsx    # App splash screen
├── hooks/                  # Custom React hooks
│   └── useStore.js        # Zustand state management
├── db/                     # Database layer
│   ├── initDB.js          # Database initialization
│   ├── transactionService.js  # Database operations
│   └── asyncStorageService.js # Local storage
├── utils/                  # Utility functions
│   ├── formatCurrency.js  # Currency & date formatting
│   ├── scale.js           # Responsive scaling
│   └── theme.js           # App theming
├── App.js                  # Main app component
└── README.md              # This file
```

## Database Schema

### Transactions Table
- `id`: Unique identifier
- `amount`: Transaction amount
- `type`: 'income' or 'expense'
- `category`: Transaction category
- `source`: Account/source identifier
- `sourceId`: Account ID reference
- `note`: Optional transaction note
- `date`: Transaction date
- `created_at`: Timestamp

### Accounts Table
- `id`: Unique identifier
- `name`: Account name (e.g., "Cash", "GPay")
- `balance`: Current balance
- `created_at`: Timestamp

## Default Setup

The app comes with three default accounts:
- **Cash**: Physical cash transactions
- **GPay**: Google Pay transactions
- **Bank**: Bank account transactions

## Usage Guide

### Adding Your First Transaction
1. Open the app and go to the "Add Transaction" tab
2. Enter the amount
3. Select transaction type (Income/Expense)
4. Choose a category from the dropdown
5. Select the source account
6. Review the account impact preview
7. Add an optional note
8. Tap "Save Transaction"

### Viewing Insights
1. Navigate to the "Insights" tab
2. Use the month selector to view different periods
3. Explore spending patterns through charts
4. Monitor your savings progress

### Managing Transactions
1. Go to "Transaction History" to see all entries
2. Use search to find specific transactions
3. Apply filters by type, category, or source
4. Edit or delete transactions with themed confirmations

### Account Management
1. Access account settings from the home screen
2. View individual account balances
3. Monitor account-specific transactions
4. Track balance changes over time

## Future Enhancements

### Planned Features
- [ ] Budget setting and tracking
- [ ] Recurring transaction setup
- [ ] Export data to CSV/PDF
- [ ] Dark and Light mode support
- [ ] Cloud sync with Google Drive
- [ ] Multiple currency support
- [ ] Bill reminders
- [ ] Financial goals tracking
- [ ] Transaction templates
- [ ] Advanced analytics

### Technical Improvements
- [ ] Offline-first architecture
- [ ] Performance optimizations
- [ ] Unit and integration tests
- [ ] Accessibility improvements
- [ ] Internationalization (i18n)
- [ ] Push notifications
- [ ] Data backup/restore

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

If you encounter any issues or have questions:
1. Check the existing issues in the repository
2. Create a new issue with detailed information
3. Include device/OS information and steps to reproduce

## Acknowledgments

- Built with React Native and Expo
- UI components from React Native Paper
- Charts powered by React Native Chart Kit
- State management with Zustand
- Database operations with SQLite
- Icons from Lucide React Native

---

**Cashalyst** - Making personal finance tracking simple and insightful! 💰📊 
