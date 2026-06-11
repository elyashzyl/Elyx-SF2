# BPHS Attendance Checker

> Part of the Baguio Patriotic High School LMS — this is only the **attendance module**. (WIP)

A web-based daily attendance recording system for BPHS. Teachers can mark student attendance per period (AM 1–6, PM 1–4) with codes for Entered, Tardy, Absent, NIPU variants, and more.

## Features

- **Role-based access** — Admin and Teacher accounts
- **Daily attendance sheets** — Date, grade, section, adviser header
- **Inline period marking** — Dropdown selects directly in table cells (E, T, A, E/T, A/S, NIPS, NIPHC, NIPU with subtypes)
- **Auto half-day detection** — Marks HD when 2+ AM periods are Absent
- **Excused / Unexcused** checkboxes + reason field per student
- **Student & User management** — Admin CRUD
- **Print-friendly** sheet layout
- **Glassmorphism UI** — Inter font, gradient orbs, frosted glass cards
- **SQLite backend** via sql.js — no external database server needed

## Stack

- **Frontend:** Vue 3, Pinia, Vue Router, Vite
- **Backend:** Express, sql.js (SQLite)
- **Single project root** — frontend + backend run together

## Quick Start

```
npm install
npm run dev
```

Frontend: http://localhost:5173  
Backend API: http://localhost:3001  

Default admin login: `admin` / `admin123`

## Project Structure

```
routes/          — Express API routes (auth, attendance, students, users)
src/
  stores/        — Pinia stores (auth, attendance)
  views/         — Vue pages (Login, AttendanceSheet, Admin/Teacher Dashboard, etc.)
  router/        — Vue Router config
  style.css      — Global glassmorphism styles
server.js        — Express entry point
db.js            — SQLite schema & helpers
```

## Note

This is **not the full LMS**. It is the attendance recording component being developed first. Other LMS modules (assignments, grades, etc.) to follow.
