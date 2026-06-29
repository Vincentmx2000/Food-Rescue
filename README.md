# 🍱 Food Rescue

> Bridging the gap between surplus food and hunger — connecting Donors, NGOs, and Volunteers through a transparent, real-time logistics platform.

![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=flat&logo=mongodb&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)
![License](https://img.shields.io/badge/License-Academic-blue?style=flat)

---

## 📸 Screenshots

<img width="940" height="448" alt="image" src="https://github.com/user-attachments/assets/083a9afa-87af-4edc-a386-cbbf1175258d" />
<img width="940" height="448" alt="image" src="https://github.com/user-attachments/assets/b29294c5-eca4-4ddd-adb5-e4d88e6b48d5" />

**SIGN IN PAGE**

<img width="940" height="444" alt="image" src="https://github.com/user-attachments/assets/02a0629c-ad0c-40b7-b5ce-c9744cfa6395" />
<img width="940" height="450" alt="image" src="https://github.com/user-attachments/assets/74d3707c-71dd-461d-be54-5c8617732903" />

**Donor**

<img width="940" height="447" alt="image" src="https://github.com/user-attachments/assets/04c0f212-e3df-4215-b1c1-2c28e968a23f" />
<img width="940" height="447" alt="image" src="https://github.com/user-attachments/assets/36020edb-2564-462c-9560-364b551a40df" />
<img width="940" height="447" alt="image" src="https://github.com/user-attachments/assets/516ebc45-57bb-42ef-bd78-407bfbac63f4" />

**NGO**

<img width="940" height="449" alt="image" src="https://github.com/user-attachments/assets/7183af8f-ade3-4bec-9ce8-6d13b04a5075" />
<img width="940" height="449" alt="image" src="https://github.com/user-attachments/assets/bcaa7612-3532-41af-bcf6-78959c8f5bb5" />
<img width="940" height="449" alt="image" src="https://github.com/user-attachments/assets/32dc31e5-16f4-4f96-abdc-3623befbdf43" />

**Volunteer**

<img width="940" height="446" alt="image" src="https://github.com/user-attachments/assets/cd343d99-9d14-4eaa-a215-767726f618ab" />
<img width="940" height="449" alt="image" src="https://github.com/user-attachments/assets/95987b01-b597-45fa-83cc-2bbcd847c4e7" />
<img width="940" height="449" alt="image" src="https://github.com/user-attachments/assets/a13ba2af-0872-4f99-a97f-e1947b6a6420" />

**Admin**

<img width="940" height="448" alt="image" src="https://github.com/user-attachments/assets/3a2ce61e-84bf-4916-a30d-68517fda72a2" />
<img width="940" height="445" alt="image" src="https://github.com/user-attachments/assets/6ca6c829-962c-4ab9-aba3-15107577b379" />
<img width="940" height="445" alt="image" src="https://github.com/user-attachments/assets/232b238d-b5e0-4e95-b89e-87d7727c9365" />

---

## 📌 Overview

One-third of all food produced globally is wasted, yet one in nine people go to bed hungry. Food Rescue solves this by providing a centralized digital platform where:

- **Donors** (restaurants, hotels, households) post surplus food with photos and location
- **NGOs** browse, claim, and coordinate food pickups in real time
- **Volunteers** accept last-mile delivery tasks and upload proof of distribution
- **Admins** verify accounts and oversee platform operations

The result is a fully transparent pipeline — from surplus to distribution — with accountability built in at every step.

---

## ✨ Features

- **Role-based dashboards** for Donors, NGOs, Volunteers, and Admins
- **Donation listings** with multi-image upload (Cloudinary) and GPS location pin
- **NGO Mission Control** for browsing, claiming, and managing active donations
- **Volunteer broadcasting system** for last-mile pickup task coordination
- **Live status timeline** tracking donations from Posted → Claimed → Picked Up → Distributed
- **Proof of Distribution** — mandatory image upload post-delivery for accountability
- **Feedback & ratings** (1–5 stars) between Donors and NGOs after mission completion
- **Real-time notification center** for status changes, assignments, and alerts
- **Interactive maps** via Leaflet + OpenStreetMap for pickup and drop-off coordination
- **Public profiles** showing impact metrics and verification status for NGOs and Donors

---

## 🛠 Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React, Vite, Tailwind CSS, React Router, Axios, Leaflet |
| Backend | Node.js, Express.js |
| Language | JavaScript (ES6+), JSX |
| Database | MongoDB, Mongoose |
| Auth | JWT, Passport.js (Google/Facebook OAuth) |
| Storage | Cloudinary (food images, proof of distribution) |
| Dev Tools | ESLint, PostCSS |

---

## 🗂 Data Models

The platform uses six core MongoDB collections:

| Collection | Purpose |
|---|---|
| `users` | Stores all roles — Donor, NGO, Volunteer, Admin |
| `donations` | Food listings with status, location (GeoJSON), and images |
| `claims` | Links an NGO to a specific donation with pickup mode |
| `volunteertasks` | Tracks volunteer assignments for last-mile delivery |
| `notifications` | Real-time alerts tied to mission events |
| `feedbacks` | Post-distribution ratings (1–5) with comments; one per donation |

**Donation status lifecycle:**
```
AVAILABLE → CLAIMED_BY_NGO → ASSIGNED → PICKED_UP → DISTRIBUTED
```

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

Create a `.env` file inside `backend/`:

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
# Start the backend (http://localhost:5000)
cd backend && npm run dev

# Start the frontend (http://localhost:5173)
cd ../frontend && npm run dev
```

---

## 👥 User Roles & Workflows

| Role | Key Actions |
|---|---|
| **Donor** | Post food with images & GPS → track status → leave feedback after distribution |
| **NGO** | Browse available food → claim → choose self-pickup or assign a volunteer → upload distribution proof |
| **Volunteer** | Find nearby tasks → accept → mark picked up → mark delivered + upload photo |
| **Admin** | Verify/block users → view platform-wide stats → override mission status if needed |

---

## 📁 Project Structure

```
Food-Rescue/
├── backend/
│   └── src/
│       ├── controllers/    # Auth, donations, NGOs, volunteers, feedback, notifications
│       ├── models/         # User, Donation, Claim, VolunteerTask, Feedback, Notification
│       ├── routes/         # API route definitions
│       ├── middlewares/    # JWT auth, validation, error handling
│       ├── utils/          # Shared helpers and response utilities
│       └── config/         # Passport, Cloudinary, DB configuration
│
└── frontend/
    └── src/
        ├── pages/          # Auth, dashboards, donation details, role-specific views
        ├── components/     # Navbar, Modal, DonationCard, ProtectedRoute
        ├── context/        # Auth and Notification providers
        └── services/       # Axios-based API service layer
```

---

## ☁️ Deployment

| Service | Recommended Platform |
|---|---|
| Backend | Render, Heroku, or any Node.js VPS |
| Frontend | Vercel or Netlify (Vite static build) |
| Database | MongoDB Atlas |
| Images | Cloudinary |

---

## 🔮 Future Enhancements

- **AI Expiration Prediction** — ML model to estimate food shelf-life from uploaded photos
- **In-app Chat** — Real-time messaging between NGOs and Volunteers during active missions
- **Mobile App** — React Native version for volunteers managing deliveries on the go

---

## 📄 License

Built as a final year MCA project for academic and demonstration purposes.
