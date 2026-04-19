<<<<<<< HEAD
# Shree Classes - Class Management System

Full-stack role-based class management web app with Admin, Teacher and Student dashboards.

## Tech Stack
- Frontend: HTML, CSS, Vanilla JS
- Backend: Node.js + Express
- Database/Auth/Storage: Firebase (Firestore + Authentication + Storage)

## Features Included
- Public website: Home, About, Courses, Announcements, Contact + Google Maps
- Enquiry form saved to Firestore (`enquiries`)
- 3 roles: `admin`, `teacher`, `student`
- Signup request flow for student/faculty with admin approval
- Login blocked until status is `approved`
- Role-based redirection to dashboard
- Admin request approval/rejection APIs
- Dashboard layout with sidebar, topbar, cards and tables

## Folder Structure
```txt
public/
  css/styles.css
  js/
    firebaseClient.js
    auth.js
    dashboard.js
    main.js
  pages/
    about.html
    announcements.html
    contact.html
    courses.html
    login.html
    signup.html
  dashboard/
    admin/
    teacher/
    student/
server/
  app.js
  firebaseAdmin.js
  middlewareAuth.js
.env.example
package.json
```

## Firestore Collections (Suggested Schema)

### `users`
- `uid`
- `name`
- `email`
- `role` (`admin` / `teacher` / `student`)
- `status` (`pending` / `approved` / `rejected`)
- `class`
- `medium`
- `subjects` (teacher)
- `standards` (teacher)

### `lectures`
- `subject`
- `class`
- `date`
- `teacher`

### `homework`
- `title`
- `class`
- `file_url`

### `materials`
- `title`
- `file_url`

### `attendance`
- `student_id`
- `date`
- `status`

### `notices`
- `title`
- `content`

### `announcements`
- `title`
- `content`

### `enquiries`
- `name`
- `standard`
- `medium`
- `message`

## Setup Instructions

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env` from `.env.example` and fill Firebase Admin credentials.

3. Configure frontend Firebase values in:
   - `public/js/firebaseClient.js`
   Replace all `REPLACE_WITH_*` fields.

4. Create the admin user:
   - Sign up once using Firebase Auth (or Firebase Console).
   - In Firestore `users/{uid}`, set:
     - `role: "admin"`
     - `status: "approved"`
     - `name`, `email`

5. Run app:
   ```bash
   npm run dev
   ```

6. Open:
   - `http://localhost:5000`

## Auth Flow
1. Student/Teacher signs up -> user document saved with `status: pending`
2. Admin logs in -> opens requests page -> approves/rejects
3. Only approved users can access dashboards

## Notes
- This project gives full structure and clean UI screens as requested.
- CRUD actions for lectures/homework/notices/material upload can be connected to dedicated APIs/Firestore writes using same token-based middleware.
- For production, add stronger validation, route guards, and file upload limits.
=======
# Shree Classes - Class Management System

Full-stack role-based class management web app with Admin, Teacher and Student dashboards.

## Tech Stack
- Frontend: HTML, CSS, Vanilla JS
- Backend: Node.js + Express
- Database/Auth/Storage: Firebase (Firestore + Authentication + Storage)

## Features Included
- Public website: Home, About, Courses, Announcements, Contact + Google Maps
- Enquiry form saved to Firestore (`enquiries`)
- 3 roles: `admin`, `teacher`, `student`
- Signup request flow for student/faculty with admin approval
- Login blocked until status is `approved`
- Role-based redirection to dashboard
- Admin request approval/rejection APIs
- Dashboard layout with sidebar, topbar, cards and tables

## Folder Structure
```txt
public/
  css/styles.css
  js/
    firebaseClient.js
    auth.js
    dashboard.js
    main.js
  pages/
    about.html
    announcements.html
    contact.html
    courses.html
    login.html
    signup.html
  dashboard/
    admin/
    teacher/
    student/
server/
  app.js
  firebaseAdmin.js
  middlewareAuth.js
.env.example
package.json
```

## Firestore Collections (Suggested Schema)

### `users`
- `uid`
- `name`
- `email`
- `role` (`admin` / `teacher` / `student`)
- `status` (`pending` / `approved` / `rejected`)
- `class`
- `medium`
- `subjects` (teacher)
- `standards` (teacher)

### `lectures`
- `subject`
- `class`
- `date`
- `teacher`

### `homework`
- `title`
- `class`
- `file_url`

### `materials`
- `title`
- `file_url`

### `attendance`
- `student_id`
- `date`
- `status`

### `notices`
- `title`
- `content`

### `announcements`
- `title`
- `content`

### `enquiries`
- `name`
- `standard`
- `medium`
- `message`

## Setup Instructions

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env` from `.env.example` and fill Firebase Admin credentials.

3. Configure frontend Firebase values in:
   - `public/js/firebaseClient.js`
   Replace all `REPLACE_WITH_*` fields.

4. Create the admin user:
   - Sign up once using Firebase Auth (or Firebase Console).
   - In Firestore `users/{uid}`, set:
     - `role: "admin"`
     - `status: "approved"`
     - `name`, `email`

5. Run app:
   ```bash
   npm run dev
   ```

6. Open:
   - `http://localhost:5000`

## Auth Flow
1. Student/Teacher signs up -> user document saved with `status: pending`
2. Admin logs in -> opens requests page -> approves/rejects
3. Only approved users can access dashboards

## Notes
- This project gives full structure and clean UI screens as requested.
- CRUD actions for lectures/homework/notices/material upload can be connected to dedicated APIs/Firestore writes using same token-based middleware.
- For production, add stronger validation, route guards, and file upload limits.
>>>>>>> 2334ae2eaa12245373b572f6a541bf9c11dec475
