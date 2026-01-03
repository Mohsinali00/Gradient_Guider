# Gradient_Guider
Dayflow - Human Resource Management System (Odoo Hackathon Virtual round)
## ✅ Commit 1: Login & Signup Module

preview :- dayFlow.render.com

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
## ✅ Commit 2: Employee Management Dashboard

---

### 🧩 Overview
Implemented the **Employee Management Dashboard**, which serves as the **post-login landing page** for users. This module provides a centralized view of all employees along with their real-time work and attendance status.

---

### ✨ Key Highlights
- Employees dashboard set as **default landing page after login**
- Card-based employee listing with profile picture and basic details
- Clickable employee cards opening **view-only profile pages**
- Real-time employee work status indicators:
  - 🟢 Present (checked in)
  - ✈️ On Leave (approved time off)
  - 🟡 Absent (no check-in, no leave)
- Search functionality to quickly find employees
- Profile avatar dropdown with **My Profile** and **Log Out**

---

### 🧠 Tech Implementation
- Card grid UI built with React + Tailwind CSS
- Backend logic to compute employee status using attendance & leave data
- Role-based access to employee data
- Optimized APIs for fetching employee list with computed status

---

## ✅ Commit 3: Attendance & Time Off Management

---

### 🧩 Overview
Implemented the **Attendance and Time Off modules**, allowing employees to mark daily attendance and manage leave requests, while enabling Admins to monitor and approve records.

---

### ✨ Key Highlights
- Employee **Check-In / Check-Out** functionality
- Automatic attendance status updates
- Attendance records stored date-wise with timestamps
- Time Off (Leave) management:
  - Apply for leave with date range
  - Leave status: Pending / Approved / Rejected
- Leave status overrides attendance where applicable
- Dedicated pages for:
  - Attendance history
  - Time Off requests and approvals

---

### 🧠 Tech Implementation
- MongoDB schemas for Attendance and Leave records
- Backend APIs for check-in, check-out, and leave handling
- Business logic to resolve attendance vs leave priority
- Secure role-based access for approvals and visibility

---
## ✅ Final Commit: UI Polish, Fixes & Deployment

---

### 🧩 Overview
Finalized the application with **UI refinements, bug fixes, performance improvements**, and successfully deployed the project to **Render**.

---

### ✨ Key Highlights
- UI/UX refinements across all pages
- Improved spacing, typography, and component consistency
- Fixed edge-case bugs and validation issues
- Improved error handling and loading states
- Environment configuration for production
- Successfully deployed full-stack application on **Render**

---

### 🚀 Deployment
- Frontend & Backend deployed on Render
- Production-ready environment variables configured
- Application accessible via live URL

---

### 🧠 Final Outcome
A fully functional, secure, and scalable **HRMS web application** with authentication, employee management, attendance tracking, and leave management — ready for real-world usage.

---

