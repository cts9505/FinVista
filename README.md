# 💸 FinVista – Personal Finance Tracker (MERN + OCR + AI)

**FinVista** is a modern MERN stack-based personal finance app that helps users manage, track, and visualize their income, expenses, budgets, and bills. Integrated with OCR for transaction scanning and AI-powered insights via Gemini API.

---

## 📦 Tech Stack & Versions

### 🧑‍🎨 Frontend
- **React**: `18.2.0`
- **Tailwind CSS**: `3.3.2`
- **Vite**: `4.5.0`
- **Axios**: `1.6.0`
- **Lucide-react**: `0.276.0`

### ⚙️ Backend
- **Node.js**: `18.x` or `LTS`
- **Express**: `4.18.2`
- **Mongoose**: `7.2.2`
- **Bcrypt**: `5.1.0`
- **Nodemailer**: `6.9.8`
- **Multer**: `1.4.5-lts.1`
- **Useragent**: `1.0.0`
- **Geoip-lite**: `1.4.2`
- **dotenv**: `16.3.1`

### 🐍 Python AI Backend
- **FastAPI**: `0.95.0`
- **Uvicorn**: `0.18.3`
- **google-generativeai**: `0.1.0`
- **pydantic**: `1.10.7`
- **python-dotenv**: `0.21.0`

---

## ⚙️ Environment Variables

Create a `.env` file in `/backend` and `/python-backend` using the template below:

### `.env.example`

```dotenv
# Backend (.env)
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password

# Python backend (.env)
API_KEY=your_gemini_api_key

# Frontend backend (.env)
VITE_BACKEND_URL=
VITE_GOOGLE_CLIENT_ID=
VITE_RAZORPAY_KEY_ID=
```

---

## 🛠️ Setup Instructions (Step-by-step)

### 📁 1. Clone the Repository

```bash
git clone https://github.com/cts9505/FinVista.git
cd FinVista
```

---

### 🧑‍🎨 2. Setup Frontend

```bash
cd frontend
npm install react@18.2.0 react-dom@18.2.0 axios@1.6.0 lucide-react@0.276.0 tesseract.js@2.1.5
npm install -D tailwindcss@3.3.2 postcss autoprefixer vite@4.5.0
npx tailwindcss init -p
```

#### ✅ Start Frontend
```bash
npm run dev
```

---

### ⚙️ 3. Setup Backend

```bash
cd ../backend
npm install express@4.18.2 mongoose@7.2.2 dotenv@16.3.1 bcrypt@5.1.0 cookie-parser nodemailer@6.9.8 cors helmet multer@1.4.5-lts.1 express-useragent geoip-lite jsonwebtoken
```

#### ✅ Start Backend
```bash
node server.js
```

---

### 🐍 4. Setup Python AI Backend

```bash
cd ../python-backend
pip install -r requirements.txt
```

> Or manually:
```bash
pip install fastapi==0.95.0 uvicorn==0.18.3 google-generativeai==0.1.0 python-dotenv==0.21.0 pydantic==1.10.7
```

#### ✅ Start Python Server
```bash
uvicorn main:app --reload
```

---

## ✅ Final Steps

🔁 Ensure:
- MongoDB server is running.
- `.env` is correctly configured in both backend folders.
- All three servers are running:
  - `Frontend` at `http://localhost:5173`
  - `Node Backend` at `http://localhost:5000`
  - `Python Backend` (FastAPI) at `http://127.0.0.1:5050`

---

## 📁 Project Structure

```
FinVista/
├── frontend/           # React + Vite + Tailwind Frontend
│   ├── public/
│   └── src/
│       ├── assets/
│       ├── components/
│       ├── pages/
│       ├── utils/
│       └── main.jsx
├── backend/            # Node.js + Express + MongoDB Backend
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   └── server.js
├── python-backend/     # Python FastAPI AI microservice
│   ├── main.py
│   └── .env
└── README.md
```

---

## 🔒 Security Features
- Login alerts from new devices (IP + User Agent)
- Encrypted JWT tokens
- Secure password hashing with bcrypt

---
