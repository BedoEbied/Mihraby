# Mihraby - Tutor Booking Platform

A tutor booking platform for Egypt. Instructors publish courses with time slots; students book and pay per session (Paymob + InstaPay); meetings are auto-created on Zoom.

> Repo name is `Tahbeer` (historical). Product is **Mihraby**. The platform is a Next.js 16 monolith (no separate Express backend — ignore the "backend/frontend" structure described below, it's outdated and will be rewritten).

## 🚀 Features

- **🔐 Authentication & Authorization**
  - JWT-based authentication
  - Role-based access control (Admin, Instructor, Student)
  - Secure password hashing with bcrypt
  
- **👥 Three User Roles**
  - **Students**: Browse and enroll in courses
  - **Instructors**: Create and manage courses, view enrollments
  - **Admins**: Manage users, courses, and platform settings

- **📚 Course Management**
  - Create, update, and delete courses
  - Course enrollment system
  - Track student progress

- **💻 Modern Tech Stack**
  - Full TypeScript implementation
  - Next.js 15 with App Router
  - Express.js backend
  - MySQL database
  - Tailwind CSS for styling

## 📁 Project Structure

```
Tahbeer/
├── backend/                  # Express TypeScript API
│   ├── src/
│   │   ├── config/          # Database configuration
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/      # Auth & role check middleware
│   │   ├── models/          # Database models
│   │   ├── routes/          # API routes
│   │   ├── types/           # TypeScript interfaces
│   │   ├── utils/           # Helper functions
│   │   └── server.ts        # Main server file
│   ├── migrations/          # Database migrations (TypeScript)
│   ├── tsconfig.json
│   └── package.json
│
└── frontend/                # Next.js TypeScript frontend
    ├── app/                 # Next.js app directory
    │   ├── admin/          # Admin dashboard
    │   ├── instructor/     # Instructor dashboard
    │   ├── student/        # Student dashboard
    │   ├── login/          # Login page
    │   └── register/       # Registration page
    ├── lib/
    │   ├── api/            # API client & functions
    │   └── context/        # React contexts (Auth)
    ├── types/              # Shared TypeScript types
    └── package.json

```

## 🛠️ Setup Instructions

### Prerequisites

- Node.js 18+ and Yarn
- MySQL 8.0+

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   yarn install
   ```

3. **Configure environment variables**
   Create a `.env` file in the backend directory:
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=courses_db
   JWT_SECRET=your_strong_secret_key_change_this
   NODE_ENV=development
   ```

4. **Create database**
   ```bash
   mysql -u root -p
   CREATE DATABASE courses_db;
   EXIT;
   ```

5. **Run migrations (Knex)**
   ```bash
   yarn migrate:up
   ```

6. **Start development server**
   ```bash
   yarn dev
   ```
   Backend will run on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   yarn install
   ```

3. **Configure environment variables**
   Create a `.env.local` file:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000
   ```

4. **Start development server**
   ```bash
   yarn dev
   ```
   Frontend will run on `http://localhost:3000`

## 📝 API Endpoints

### Authentication Routes (`/api/auth`)
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Student Routes (`/api/student`)
- `GET /api/student/courses` - Browse all published courses
- `POST /api/student/enroll/:courseId` - Enroll in a course
- `GET /api/student/my-courses` - Get enrolled courses

### Instructor Routes (`/api/instructor`)
- `GET /api/instructor/courses` - Get instructor's courses
- `POST /api/instructor/courses` - Create new course
- `PUT /api/instructor/courses/:id` - Update course
- `DELETE /api/instructor/courses/:id` - Delete course
- `GET /api/instructor/courses/:id/enrollments` - View course enrollments

### Admin Routes (`/api/admin`)
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id/role` - Update user role
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/courses` - Get all courses

## 🗄️ Database Schema

### Users Table
```sql
- id (INT, PRIMARY KEY, AUTO_INCREMENT)
- email (VARCHAR, UNIQUE)
- password (VARCHAR, HASHED)
- name (VARCHAR)
- role (ENUM: 'admin', 'student', 'instructor')
- created_at (TIMESTAMP)
```

### Courses Table
```sql
- id (INT, PRIMARY KEY, AUTO_INCREMENT)
- title (VARCHAR)
- description (TEXT)
- instructor_id (INT, FOREIGN KEY -> users.id)
- price (DECIMAL)
- image_url (VARCHAR)
- status (ENUM: 'draft', 'published', 'archived')
- created_at (TIMESTAMP)
```

### Enrollments Table
```sql
- id (INT, PRIMARY KEY, AUTO_INCREMENT)
- user_id (INT, FOREIGN KEY -> users.id)
- course_id (INT, FOREIGN KEY -> courses.id)
- enrolled_at (TIMESTAMP)
```

## 🔧 Available Scripts

### Backend
- `yarn dev` - Start development server with hot reload
- `yarn build` - Compile TypeScript to JavaScript
- `yarn start` - Run production server
- `yarn migrate:up` - Run database migrations
- `yarn migrate:down` - Rollback migrations
- `yarn migrate:create <name>` - Create new Knex migration (uses `backend/migrations/template.ts` stub)

### Frontend
- `yarn dev` - Start Next.js development server
- `yarn build` - Build for production
- `yarn start` - Run production build
- `yarn lint` - Run ESLint

## 🔐 Authentication Flow

1. User registers/logs in → Receives JWT token
2. Token stored in localStorage
3. Token sent in `Authorization: Bearer <token>` header
4. Backend middleware verifies token
5. Role-based middleware checks permissions
6. Access granted/denied based on role

## 👤 User Roles & Permissions

| Feature | Student | Instructor | Admin |
|---------|---------|------------|-------|
| Browse Courses | ✅ | ✅ | ✅ |
| Enroll in Courses | ✅ | ❌ | ❌ |
| Create Courses | ❌ | ✅ | ✅ |
| Manage Own Courses | ❌ | ✅ | ✅ |
| Manage All Courses | ❌ | ❌ | ✅ |
| Manage Users | ❌ | ❌ | ✅ |
| Change User Roles | ❌ | ❌ | ✅ |

## 🚧 MVP Status

This is an MVP (Minimum Viable Product) implementation. Current features:

✅ User registration and authentication  
✅ Role-based access control  
✅ Basic course CRUD operations  
✅ Enrollment system  
✅ Responsive UI with Tailwind CSS  
✅ Full TypeScript implementation  

## 🎯 Future Enhancements

- Course content management (videos, files, quizzes)
- Student progress tracking
- Payment integration
- Email notifications
- Course reviews and ratings
- Search and filtering
- User profile management
- Course categories and tags
- Dashboard analytics

## 📄 License

ISC

## 👥 Contributing

This is a learning project. Feel free to fork and experiment!

## 🐛 Known Issues

- Logout currently redirects client-side only
- No email verification system
- No password reset functionality
- No file upload for course images (coming soon with multer)

---

Built with ❤️ using TypeScript, Next.js, and Express
