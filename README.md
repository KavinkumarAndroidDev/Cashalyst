# Cashalyst - Personal Finance Tracker 

A simple yet powerful personal finance tracking app built with React Native and Expo. Perfect for students and early-career individuals who want to track daily expenses and income with clear insights.

---

## Features
### 🏠 Home Dashboard
- Total balance overview with smooth animations
- Monthly summary of income, expenses, and savings
- Account balances (Cash, GPay, Bank)
- Recent transactions (last 5) with improved visual hierarchy
- Quick actions to add transactions and view history

### ➕ Add Transactions
- Simple form with income/expense types
- Predefined categories and multiple source accounts
- Real-time balance impact preview with warnings
- Optional notes for transactions

### 📋 Transaction History
- Search and filter by category, type, or source
- Date-based viewing and pull-to-refresh
- Delete or edit transactions with themed confirmation popups
- Improved UI with better spacing and icons

### 📊 Insights & Analytics
- Category-wise spending (Pie chart)
- Income vs Expenses (Bar chart)
- Balance trends (Line chart)
- Monthly selector and account breakdown

### 🎨 Enhanced UX
- Custom modal system with themed popups
- Smooth animations and balance change transitions
- Consistent spacing and visual hierarchy improvements

---

## Tech Stack
- **Frontend:** React Native with Expo  
- **Navigation:** React Navigation (Bottom Tabs)  
- **UI Components:** React Native Paper  
- **State Management:** Zustand  
- **Database:** SQLite (expo-sqlite)  
- **Charts:** React Native Chart Kit  
- **Forms:** React Hook Form  
- **Icons:** Lucide React Native  
- **Blur Effects:** Expo Blur  

---

## Installation & Setup
### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Expo CLI
- Android Studio (for Android) or Xcode (for iOS)

### Steps
```bash
git clone https://github.com/KavinkumarAndroidDev/Cashalyst
cd Cashalyst
npm install
npm start
````

* Press `a` for Android, `i` for iOS, or scan QR code with Expo Go app.

---

## Project Structure

```
Cashalyst/
├── screens/               # Main app screens
├── components/            # Reusable UI components
├── hooks/                 # Custom React hooks
├── db/                    # Database layer
├── utils/                 # Utility functions
├── App.js                 # Main app component
└── README.md
```

---

## Default Accounts

* **Cash** – Physical cash transactions
* **GPay** – Google Pay transactions
* **Bank** – Bank account transactions

---

## Future Enhancements

* [ ] Budget setting and tracking
* [ ] Recurring transactions setup
* [ ] Export data to CSV
* [ ] Dark mode theme switcher
* [ ] Cloud sync with Google Drive
* [ ] Multi-currency support
* [ ] Bill reminders & notifications
* [ ] Financial goals tracking
* [ ] Transaction templates
* [ ] Advanced analytics

---

## Contribution

We welcome contributions!
Check [CONTRIBUTING.md](CONTRIBUTING.md) and see open [Issues](../../issues).

---

## Contributors

Thanks to these awesome people: <a href="https://github.com/KavinkumarAndroidDev/Cashalyst/graphs/contributors"> <img src="https://contrib.rocks/image?repo=KavinkumarAndroidDev/Cashalyst" /> </a>

---

## License

This project is licensed under the MIT License - see [LICENSE](LICENSE).

---

**Cashalyst** – Making personal finance tracking simple and insightful! 💰📊
