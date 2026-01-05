# PocketExpense+ Product Requirements Document (PRD)

> **Version:** 2.1
> **Last Updated:** January 22, 2026
> **Author:** Divyanshu
> **Status:** Released (v2.0 Feature Set Complete)

---

## 1. Executive Summary

**PocketExpense+** is a comprehensive personal finance management ecosystem designed to empower users with total control over their financial lives. Going beyond simple expense tracking, it integrates budgeting, intelligent insights, goal setting, and social finance features (bill splitting) into a unified, offline-first mobile experience.

### Vision Statement
*"To be the ultimate financial companion that seamlessly blends personal wealth building with social financial interactions, making money management effortless and collaborative."*

### Target Audience
- **Young Professionals:** Tracking salary, savings, and shared expenses.
- **students/Roommates:** Managing shared bills (rent, utilities, food) accurately.
- **Families:** Budgeting household expenses and saving for future goals.
- **Travelers:** Logging expenses on-the-go with offline support.

---

## 2. Product Overview

### 2.1 Core Value Proposition

| Problem | Solution |
|---------|----------|
| **Financial Blindness** | AI-powered insights showing exactly where money goes. |
| **Social Debt Chaos** | "Splitwise"-style group expense management and debt settlement. |
| **Goal Drift** | Dedicated savings goals with progress tracking to keep users focused. |
| **Data Silos** | Export data (CSV/PDF) for external analysis or sharing. |
| **Connectivity Issues** | seamless offline mode with automatic synchronization. |

### 2.2 Tech Stack

| Layer | Technology | Details |
|-------|------------|---------|
| **Frontend** | React Native | Expo SDK 54, Cross-platform (iOS/Android) |
| **Navigation** | React Navigation | Stack + Bottom Tabs complex flows |
| **State** | React Context API | Global management for Auth, Expenses, Groups |
| **Backend** | Node.js + Express | RESTful API architecture |
| **Database** | MongoDB Atlas | Cloud-hosted NoSQL document store |
| **Auth** | JWT | Secure stateless authentication |
| **Reporting** | PDFKit / JSON2CSV | Server-side document generation |
| **Storage** | AsyncStorage | Local persistence for offline capability |

---

## 3. Detailed Feature Specifications

### 3.1 🔐 User Authentication
**Status:** ✅ Implemented
Secure, token-based system ensuring user data privacy.
-   **Registration:** Email, Name, Password (validated & hashed).
-   **Login:** JWT issuance with secure storage.
-   **Session:** Persistent login with auto-token refresh.

### 3.2 💸 Core Expense Tracking
**Status:** ✅ Implemented
The fundamental CRUD engine of the application.
-   **Add Expense:** Amount, Category, Date, Note, Payment Method (Cash, Card, UPI).
-   **Edit/Delete:** Full control over historical data.
-   **Filtering:** View by Daily, Weekly, Monthly, or Custom Date Range.
-   **Search:** Real-time search through expense descriptions.

### 3.3 📊 Smart Insights & Analytics
**Status:** ✅ Implemented
-   **Category Breakdown:** Donut charts showing spending distribution.
-   **Trend Analysis:** "Spent 15% less than last month."
-   **Top Spenders:** Identify biggest cash flow drains.

### 3.4 💰 Budget Management
**Status:** ✅ Implemented
-   **Category Limits:** Set monthly caps (e.g., "Food: ₹5000").
-   **Visual Indicators:** Progress bars changing color (Green -> Yellow -> Red).
-   **Alerts:**
    -   ⚠️ Warning at 80% usage.
    -   🚨 Alert at 100% usage.

### 3.5 🎯 Financial Goals
**Status:** ✅ Implemented
Dedicated module for savings tracking.
-   **Goal Creation:** Target amount, Deadline, Icon (e.g., "Europe Trip").
-   **Contributions:** Log deposits towards the goal.
-   **Projections:** "Amount needed per month to hit target."
-   **Progress Visuals:** Completion percentage rings.

### 3.6 👥 Social Finance (Groups)
**Status:** ✅ Implemented
A full-featured bill splitting system similar to Splitwise.
-   **Group Management:** Create groups (Home, Trip, Couple) and invite members via code.
-   **Expense Splitting:**
    -   **Equal:** Split evenly among all/selected members.
    -   **Exact:** Specify exact amounts for each person.
    -   **Percentage:** Split by custom percentages.
-   **Balances:** Real-time "Who owes Who" calculation.
-   **Debt Simplification:** Algorithm to minimize number of transactions.
-   **Settlement:** Record payments to clear debts.
-   **Reminders:** Send push notifications for pending dues.

### 3.7 ⏱️ Smart Templates
**Status:** ✅ Implemented
-   **One-Tap Add:** Save frequent expenses (e.g., "Morning Coffee - ₹150").
-   **Quick Access:** Dashboard widget for top used templates.

### 3.8 📄 Data Export
**Status:** ✅ Implemented
-   **PDF Reports:** Formatted monthly statements with charts and summaries.
-   **CSV Dump:** Raw data export for Excel/Sheets analysis.
-   **Filtering:** Export specific categories or date ranges.

### 3.9 📶 Offline Architecture
**Status:** ✅ Implemented
-   **Local First:** All reads/writes happen locally first.
-   **Sync Queue:** Operations stored in queue when offline.
-   **Auto-Sync:** Background process flushes queue when internet restores.

---

## 4. API Specification

### 4.1 Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login & receive JWT |

### 4.2 Expenses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/expenses` | List expenses (supports filters) |
| POST | `/api/expenses` | Create expense |
| PUT | `/api/expenses/:id` | Update expense |
| DELETE | `/api/expenses/:id` | Delete expense |
| GET | `/api/expenses/insights`| Get analytics data |

### 4.3 Goals
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/goals` | List active goals |
| POST | `/api/goals` | Create new goal |
| POST | `/api/goals/:id/contribute` | Add funds to goal |
| DELETE | `/api/goals/:id` | Drop a goal |

### 4.4 Groups
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/groups` | List user's groups |
| POST | `/api/groups` | Create group |
| POST | `/api/groups/join/:code` | Join via invite code |
| GET | `/api/groups/:id/expenses` | List group activity |
| POST | `/api/groups/:id/expenses` | Add split expense |
| GET | `/api/groups/:id/balances` | Get debt calculations |
| POST | `/api/groups/:id/settle` | Record settlement |
| POST | `/api/groups/:id/remind/:uid`| Send payment reminder |

### 4.5 Utility
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/exports/pdf` | Generate PDF Stream |
| GET | `/api/exports/csv` | Generate CSV Download |
| GET | `/api/templates` | Get saved templates |
| POST | `/api/templates/:id/use` | Instantiate template |

---

## 5. Database Schema (MongoDB Mongoose)

### 5.1 User
```javascript
{
  name: String,
  email: { type: String, unique: true },
  password: String, // Hashed
}
```

### 5.2 Expense
```javascript
{
  user: ObjectId,
  amount: Number,
  category: String, // Indexed
  description: String,
  date: Date, // Indexed
  paymentMethod: String,
  createdAt: Date
}
```

### 5.3 Goal
```javascript
{
  user: ObjectId,
  name: String,
  targetAmount: Number,
  currentAmount: Number,
  deadline: Date,
  isCompleted: Boolean,
  contributions: [{ amount: Number, date: Date, note: String }]
}
```

### 5.4 Group
```javascript
{
  name: String,
  members: [{ user: ObjectId, role: 'admin'|'member', joinedAt: Date }],
  creator: ObjectId,
  inviteCode: String, // Unique
  isActive: Boolean
}
```

### 5.5 GroupExpense
```javascript
{
  group: ObjectId,
  paidBy: ObjectId,
  amount: Number,
  description: String,
  splitType: 'equal'|'exact'|'percentage',
  splits: [{
    user: ObjectId,
    amount: Number,
    isPaid: Boolean
  }]
}
```

### 5.6 Template
```javascript
{
  user: ObjectId,
  name: String,
  amount: Number,
  category: String,
  usageCount: Number // For sorting frequent items
}
```

### 5.7 Notification
```javascript
{
  user: ObjectId,
  type: 'payment-reminder'|'budget-alert'|...,
  title: String,
  message: String,
  read: Boolean
}
```

---

## 6. Future Roadmap (v3.0+) 🚀

### 6.1 AI Financial Advisor
-   **Concept:** Chat interface to query financial data ("How much did I spend on Uber last month?").
-   **Tech:** Integration with LLMs (OpenAI/Gemini).

### 6.2 Recurring Subscriptions
-   **Concept:** Dedicated tracker for Netflix, Spotify, AWS bills.
-   **Feature:** Auto-renewal reminders 3 days before expiry.

### 6.3 Receipt Scanning (OCR)
-   **Concept:** Take a photo of a receipt to auto-fill expense fields.
-   **Tech:** Google Cloud Vision API or Tesseract.js.

### 6.4 Multi-Currency Support
-   **Concept:** Auto-convert foreign transactions to base currency for travelers.
-   **Tech:** Integration with OpenExchangeRates API.

---

## 7. Non-Functional Requirements

-   **Performance:** App load time < 1.5s (Splash screen).
-   **Reliability:** Sync success rate > 99.9%.
-   **Security:**
    -   All API communications over HTTPS.
    -   Passwords hashed with bcrypt.
    -   Input validation (Joi/Validator) on all endpoints.
-   **Scalability:** Database indexed for queries on `user` and `date` fields to support millions of records.

---

> **Document Approval**
> **Product Owner:** Divyanshu
> **Technical Lead:** Divyanshu
