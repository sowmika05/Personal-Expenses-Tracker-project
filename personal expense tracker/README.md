# 💰 SpendPulse — Personal Expense Tracker

A modern, full-stack web application designed to help users record, monitor, and manage their daily expenses. Built with Python Flask, SQLAlchemy, SQLite, and a vanilla HTML5/CSS3/JavaScript frontend with glassmorphism aesthetics.

---

## 🌟 Key Features

- **Full-Stack REST Architecture**: Complete communication flow from browser Fetch API to Flask routes, SQLAlchemy ORM, and persistent SQLite database.
- **Modern Glassmorphic UI**: High-aesthetic theme with ambient gradient glow, smooth micro-interactions, responsive card grids, and mobile-friendly layout.
- **Dynamic Financial Overview**:
  - **Total Outflow / Spent**: Real-time calculated expenditure.
  - **Transaction Count**: Total logged items.
  - **Top Spending Category**: Automatically identifies where the majority of funds are going with percentage breakdown.
  - **Average Transaction**: Mean cost per item.
  - **Category Distribution Bar**: Visual segmented progress bar showcasing spending proportions.
- **Search, Filter & Sort**:
  - Instant live search by expense title or category name.
  - Category filter pills (`Food`, `Travel`, `Shopping`, `Education`, `Utilities`, `Entertainment`, `Healthcare`, `Other`).
  - Sort by Newest, Oldest, Highest Amount, or Lowest Amount.
- **Multi-Currency Support**: Switch on-the-fly between USD (`$`), INR (`₹`), EUR (`€`), GBP (`£`), and JPY (`¥`).
- **Dark & Light Mode**: Seamless theme toggling with `localStorage` persistence.
- **Interactive Feedback**: Modal confirmation for safe deletion and animated toast notifications.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | HTML5, Vanilla CSS3 (Custom Glassmorphism Design System), Modern JavaScript (ES6+ Fetch API) |
| **Backend** | Python 3, Flask |
| **ORM** | Flask-SQLAlchemy |
| **Database** | SQLite (`expenses.db`) |
| **API Format** | RESTful JSON HTTP endpoints |

---

## 📁 Project Structure

```
personal expense tracker/
├── app.py                  # Flask server application & REST API endpoints
├── models.py               # SQLAlchemy Expense database model & schema
├── requirements.txt        # Python dependency manifest
├── README.md               # Project documentation & API guide
├── static/
│   ├── css/
│   │   └── style.css       # Design system, CSS variables, glassmorphism, animations
│   └── js/
│       └── app.js          # Client-side API caller, state management, statistics & filters
└── templates/
    └── index.html          # Semantic HTML dashboard template
```

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have **Python 3.8+** installed on your system.

### 2. Installation
Open a terminal in the project directory and install the required dependencies:

```bash
pip install -r requirements.txt
```

### 3. Run the Application
Start the Flask development server:

```bash
python app.py
```

### 4. Access the Dashboard
Open your web browser and navigate to:
```
http://127.0.0.1:5000
```

---

## 📡 API Endpoints

### 1. Get All Expenses
- **Endpoint**: `GET /api/expenses`
- **Response**: Array of expense objects (200 OK)
```json
[
  {
    "id": 1,
    "title": "Grocery Shopping",
    "amount": 45.5,
    "category": "Food",
    "date": "2026-09-24"
  }
]
```

### 2. Create an Expense
- **Endpoint**: `POST /api/expenses`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
```json
{
  "title": "Metro Pass",
  "amount": 20.0,
  "category": "Travel",
  "date": "2026-09-24"
}
```
- **Response**: Created expense object (201 Created)

### 3. Delete an Expense
- **Endpoint**: `DELETE /api/expenses/<id>`
- **Response**: Confirmation message (200 OK)
```json
{
  "message": "Expense deleted successfully.",
  "id": 1
}
```

---

## 📋 Database Schema

**Table name:** `expense`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | Integer | Primary Key, Auto-increment | Unique identifier |
| `title` | String(120) | NOT NULL | Expense title/description |
| `amount` | Float | NOT NULL | Monetary expense value |
| `category` | String(50) | NOT NULL | Expense category |
| `date` | String(20) | NOT NULL | Date of expenditure (YYYY-MM-DD) |

---

## 🧪 Acceptance Criteria Checklist

- [x] User can add a valid expense with Title, Amount, and Category.
- [x] Added expense instantly appears in the expense list.
- [x] Refreshing the page persists all saved expenses via SQLite.
- [x] User can delete an existing expense with confirmation.
- [x] Deleted expense no longer appears after page refresh.
- [x] Backend APIs return valid JSON responses with appropriate HTTP status codes (200, 201, 400, 404).
- [x] Application can be launched with `python app.py`.
