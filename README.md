# Gradient_Guider
Dayflow - Human Resource Management System (Odoo Hackathon Virtual round)

✅ Commit 1: Login & Signup Module

Overview
Implemented a secure, role-based authentication system with Admin-only signup and Admin/Employee login.

Key Highlights

Admin-only registration with company setup

Unified login using Login ID or Email

JWT-based authentication

Employees cannot self-register

Admin generates employee Login ID + temporary password

Forced password change on first login

Role-based route protection

Tech Implementation

Frontend: React + Vite + TypeScript, Tailwind CSS

Backend: Node.js, Express, JWT, bcrypt

Database: MongoDB (Company, User, Serial Counter schemas)
