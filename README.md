# PocketExpense+ 💰

A full-stack expense tracking mobile application with intelligent spending insights, offline support, and budget management.

## 📱 Screenshots

*Add your app screenshots here*

## ✨ Features

### Core Features
- **User Authentication** - JWT-based secure login/register
- **Expense Tracking** - Add, edit, delete expenses with categories
- **Multiple Views** - Daily, monthly, and category-wise breakdown
- **Smart Insights** - AI-powered spending analysis ("You spent 20% more on Food this month")
- **Offline Support** - Works without internet, syncs when connected

### Bonus Features
- **Budget Limits** - Set monthly limits per category
- **Push Notifications** - Alerts when approaching/exceeding budget

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React Native (Expo SDK 54) |
| Navigation | React Navigation (Stack + Tabs) |
| State Management | React Context API |
| Backend | Node.js + Express |
| Database | MongoDB (Atlas) |
| Authentication | JWT |
| Local Storage | AsyncStorage |

## 📁 Project Structure

```
├── backend/
│   ├── config/         # Database configuration
│   ├── middleware/     # JWT authentication
│   ├── models/         # Mongoose schemas
│   ├── routes/         # API routes
│   └── server.js       # Express app
│
└── frontend/
    └── src/
        ├── api/        # Axios configuration
        ├── components/ # Reusable UI components
        ├── context/    # Auth & Expense state
        ├── navigation/ # App navigation
        ├── screens/    # App screens
        └── utils/      # Storage & notifications
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- MongoDB Atlas account (free)

### Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create .env file (copy from .env.example)
cp .env.example .env

# Update .env with your MongoDB URI and JWT secret
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

# Update API URL in src/api/axios.js with your computer's IP
# const API_URL = 'http://YOUR_IP:5000/api';

# Start Expo
npx expo start
```

### Running on Device
1. Install **Expo Go** app on your phone
2. Scan QR code from terminal
3. App will load on your device

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/expenses` | Get expenses |
| POST | `/api/expenses` | Add expense |
| PUT | `/api/expenses/:id` | Update expense |
| DELETE | `/api/expenses/:id` | Delete expense |
| GET | `/api/expenses/insights` | Get spending insights |
| GET | `/api/budgets` | Get budgets |
| POST | `/api/budgets` | Set budget |

## 📋 Expense Categories
- 🍔 Food
- 🚗 Transport
- 🛍️ Shopping
- 📄 Bills
- 🎬 Entertainment
- 💊 Health
- 📦 Other

## 🔔 Notifications
- ⚠️ **Warning** at 80% budget usage
- 🚨 **Alert** when budget exceeded
- ✅ **Confirmation** when expense added

## 👨‍💻 Author

Divyanshu
