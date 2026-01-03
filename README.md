# Gradient_Guider
Dayflow - Human Resource Management System (Odoo Hackathon Virtual round)
## ✅ Commit 1: Login & Signup Module

---

### 🔐 Overview
A **secure, role-based authentication system** was implemented, enabling **Admin-only signup** and a **unified login flow** for both **Admin and Employees**.

---

### ✨ Key Highlights
- **Admin-only registration** with initial company setup  
- **Unified login** using **Login ID or Email**  
- **JWT-based authentication** for secure sessions  
- **Employee self-registration disabled**  
- **System-generated Login ID & temporary password** for employees  
- **Mandatory password change** on first login  
- **Role-based route protection** to restrict access  

---

### 🧠 Tech Implementation

#### 🎨 Frontend
- React + Vite + TypeScript  
- Tailwind CSS for responsive UI  

#### ⚙ Backend
- Node.js + Express  
- JWT authentication  
- Secure password hashing using bcrypt  

#### 🗄 Database
- MongoDB with Mongoose  
- Schemas:
  - Company  
  - User  
  - Serial Counter  

---

