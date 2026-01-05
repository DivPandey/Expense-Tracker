# PocketExpense+ 💰

A full-stack expense tracking mobile application with intelligent spending insights, offline support, budget management, and social finance features.

## 📱 Screenshots

*Add your app screenshots here*

## ✨ Features

### Core Features
- **User Authentication** - JWT-based secure login/register
- **Expense Tracking** - Add, edit, delete expenses with categories
- **Multiple Views** - Daily, monthly, and category-wise breakdown
- **Smart Insights** - AI-powered spending analysis ("You spent 20% more on Food this month")
- **Offline Support** - Works without internet, syncs when connected

### 🚀 Advanced Features
- **Financial Goals** - Create saving goals (e.g., "New Laptop"), track progress, and contribute funds.
- **Group Expenses (Social Finance)** - Split bills with friends (Equal, Exact, Percentage), track balances, and settle debts. Similar to Splitwise.
- **Data Export** - Export your expense reports in CSV and PDF formats with custom date ranges and category filters.
- **Smart Templates** - Save frequently added expenses as templates for quick one-tap entry.
- **Budget Limits** - Set monthly limits per category with visual progress bars.
- **Push Notifications** - Alerts for budget warnings, group payment reminders, and goal achievements.

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React Native (Expo SDK 54) |
| Navigation | React Navigation (Stack + Tabs) |
| State Management | React Context API |
| Backend | Node.js + Express |
| Database | MongoDB (Atlas) |
| Authentication | JWT (JSON Web Tokens) |
| File Generation | PDFKit, JSON2CSV |
| Local Storage | AsyncStorage |

## 📁 Project Structure

```
├── backend/
│   ├── config/         # Database configuration
│   ├── middleware/     # Auth & Error handling
│   ├── models/         # Mongoose schemas (User, Expense, Goal, Group, etc.)
│   ├── routes/         # API routes (Auth, Expenses, Goals, Groups, Exports)
│   └── server.js       # Entry point
│
└── frontend/
    └── src/
        ├── api/        # Axios setup & endpoints
        ├── components/ # Reusable UI (Cards, Charts, Input Fields)
        ├── context/    # Global state (Auth, Expense, Theme)
        ├── navigation/ # App navigation setup
        ├── screens/    # Main application screens
        └── utils/      # Helpers, formatters & constants
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn
- Expo CLI
- MongoDB Atlas account (free tier works)

### Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Update .env with your credentials
# MONGODB_URI=mongodb+srv://...
# JWT_SECRET=your_secret_key

# Start server
npm run dev
```

### Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Update API URL in src/api/axios.js
# const API_URL = 'http://YOUR_IP:5000/api';

# Start Expo
npx expo start
```

### Running on Device
1. Install **Expo Go** app on your phone (Android/iOS)
2. Scan the QR code displayed in the terminal
3. App will load on your device

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user & get token |

### Expenses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/expenses` | Get all expenses |
| POST | `/api/expenses` | Add new expense |
| GET | `/api/expenses/insights` | Get spending analysis |

### Goals 🎯
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/goals` | List all savings goals |
| POST | `/api/goals` | Create a new goal |
| POST | `/api/goals/:id/contribute` | Add funds to a goal |

### Groups 👥
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/groups` | Create a new group |
| POST | `/api/groups/join/:code` | Join group via code |
| POST | `/api/groups/:id/expenses` | Add group expense (Split) |
| GET | `/api/groups/:id/balances` | View who owes whom |
| POST | `/api/groups/:id/settle` | Settle debts |

### Exports 📄
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/exports/csv` | Download CSV report |
| GET | `/api/exports/pdf` | Download PDF report |

### Templates 📋
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/templates` | Get saved templates |
| POST | `/api/templates/:id/use` | Create expense from template |

## 📋 Expense Categories
- 🍔 Food
- 🚗 Transport
- 🛍️ Shopping
- 📄 Bills
- 🎬 Entertainment
- 💊 Health
- 📦 Other

## 👨‍💻 Author
**Divyanshu**
