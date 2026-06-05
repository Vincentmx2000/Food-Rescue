# 🍱 Food Rescue

> Connecting surplus food donors with NGOs and volunteers to reduce food waste and feed communities.

![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=flat&logo=mongodb&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)
![License](https://img.shields.io/badge/License-Academic-blue?style=flat)

---

## 📌 Overview

Food Rescue is a full-stack web platform that bridges the gap between food surplus and food scarcity. Donors can post available food, NGOs can claim and coordinate pickups, and volunteers can accept delivery tasks — all managed through a role-based dashboard with real-time updates and location tracking.

---

## ✨ Features

- **Role-based access** for Donors, NGOs, Volunteers, and Admins
- **Donation listings** with multi-image upload (Cloudinary) and location data
- **NGO dashboard** for browsing, claiming, and managing donations
- **Volunteer system** with task broadcasting and acceptance flow
- **Proof of distribution** via image upload post-delivery
- **Feedback & ratings** for accountability and verification
- **Push notifications** for status updates and task assignments
- **Interactive maps** powered by Leaflet for location coordination

---

## 🛠 Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React, Vite, Tailwind CSS, React Router, Axios, Leaflet |
| Backend | Node.js, Express.js, MongoDB, Mongoose |
| Auth | JWT, Passport.js (Google/Facebook OAuth) |
| Storage | Cloudinary (image uploads) |
| Dev Tools | ESLint, PostCSS |

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- MongoDB (local or [Atlas](https://www.mongodb.com/cloud/atlas))
- Git

### Installation

```bash
# Clone the repo
git clone https://github.com/Vincentmx2000/Food-Rescue.git
cd Food-Rescue

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### Environment Setup

Create a `.env` file inside the `backend/` folder:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Optional: OAuth credentials
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
```

### Run Locally

```bash
# Start the backend (runs on http://localhost:5000)
cd backend && npm run dev

# Start the frontend (runs on http://localhost:5173)
cd ../frontend && npm run dev
```

---

## 👥 User Roles

| Role | Capabilities |
|---|---|
| **Donor** | Create donations, upload food images, track donation status |
| **NGO** | Browse donations, claim items, assign volunteers, upload proof of delivery |
| **Volunteer** | View available pickup tasks, accept assignments, assist with delivery |
| **Admin** | Manage and verify users, monitor platform operations |

---

## 📁 Project Structure

```
Food-Rescue/
├── backend/
│   └── src/
│       ├── controllers/    # Auth, donations, NGOs, volunteers, feedback, notifications
│       ├── models/         # User, Donation, Claim, VolunteerTask, Feedback, Notification
│       ├── routes/         # API route definitions
│       ├── middlewares/    # Auth, validation, error handling
│       ├── utils/          # Shared helpers
│       └── config/         # Passport, Cloudinary setup
│
└── frontend/
    └── src/
        ├── pages/          # Auth, dashboards, donation details, role-specific views
        ├── components/     # Navbar, Modal, DonationCard, ProtectedRoute
        ├── context/        # Auth and Notification providers
        └── services/       # API service layer
```

---

## ☁️ Deployment

| Service | Platform |
|---|---|
| Backend | Render, Heroku, or any Node.js VPS |
| Frontend | Vercel or Netlify (Vite static build) |
| Database | MongoDB Atlas |
| Images | Cloudinary |

---

## 📄 License

This project was built for academic and demonstration purposes as a final year MCA project.
