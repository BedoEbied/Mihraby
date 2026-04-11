# Mihraby - Technical Requirements Document
## Course Booking & Scheduling System with PayMob Integration

**Project Name:** Mihraby (formerly Tahbeer)  
**Version:** 2.0 - Phase 2 Implementation  
**Last Updated:** January 4, 2026  

---

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Database Schema Changes](#database-schema-changes)
3. [Epics & User Stories](#epics--user-stories)
4. [API Endpoints](#api-endpoints)
5. [Testing Requirements](#testing-requirements)
6. [Phase 2 Timeline](#phase-2-timeline)
7. [Success Metrics](#success-metrics)

---

## 1. Project Overview

### What is Mihraby?
Mihraby is a **course booking and scheduling platform** where:
- **Instructors** create courses and define available time slots
- **Students** browse courses, book time slots, and pay via PayMob
- **System** auto-creates meeting links and sends confirmations

### What Mihraby is NOT:
- ❌ NOT a video hosting platform
- ❌ NOT a content management system
- ❌ NOT tracking lesson progress
- ✅ **ONLY** managing bookings, payments, and scheduling

### Core User Flow
```
Student → Browse Courses → View Details → Select Time Slot(s) → 
Pay (PayMob) → Lock Slot → Auto-create Meeting → Confirmation Email
```

### Tech Stack
- **Frontend:** Next.js 16, React 19, TypeScript, TailwindCSS
- **Backend:** Next.js API Routes, TypeScript
- **Database:** MySQL (Knex migrations)
- **State Management:** React Query, Zustand
- **Payments:** PayMob
- **Authentication:** JWT + HTTP-only Cookies
- **Authorization:** RBAC (Role-Based Access Control)

---

## 2. Database Schema Changes

### New Table: `time_slots`
```sql
CREATE TABLE time_slots (
  id INT PRIMARY KEY AUTO_INCREMENT,
  course_id INT NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  booked_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (booked_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_course_available (course_id, is_available),
  INDEX idx_start_time (start_time)
);
```

### New Table: `bookings`
```sql
CREATE TABLE bookings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  course_id INT NOT NULL,
  slot_id INT NOT NULL,
  payment_status ENUM('pending', 'paid', 'refunded', 'failed') DEFAULT 'pending',
  payment_method VARCHAR(50) DEFAULT 'paymob',
  payment_id VARCHAR(255) NULL,
  transaction_id VARCHAR(255) NULL,
  amount DECIMAL(10, 2) NOT NULL,
  meeting_link VARCHAR(500) NULL,
  meeting_id VARCHAR(255) NULL,
  meeting_platform ENUM('zoom', 'google_meet', 'manual') DEFAULT 'manual',
  status ENUM('confirmed', 'cancelled', 'completed', 'no_show') DEFAULT 'confirmed',
  booked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  cancelled_at TIMESTAMP NULL,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (slot_id) REFERENCES time_slots(id) ON DELETE CASCADE,
  INDEX idx_user_bookings (user_id, status),
  INDEX idx_payment_status (payment_status)
);
```

### Update: `courses` Table
```sql
ALTER TABLE courses
  ADD COLUMN slot_duration INT DEFAULT 60 COMMENT 'Duration in minutes',
  ADD COLUMN price_per_slot DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  ADD COLUMN meeting_platform ENUM('zoom', 'google_meet', 'manual') DEFAULT 'manual',
  ADD COLUMN meeting_link VARCHAR(500) NULL,
  ADD COLUMN currency VARCHAR(3) DEFAULT 'EGP';
```

---

## 3. Epics & User Stories

### Epic 1: Time Slot Management
**Goal:** Instructors can create and manage available time slots for their courses

#### Story 1.1: Create Time Slots
**As an** Instructor  
**I want to** create available time slots for my course  
**So that** students can book sessions with me

**Acceptance Criteria:**
- ✅ Can create single or multiple slots
- ✅ Slot duration based on course settings
- ✅ Cannot create overlapping slots
- ✅ Slots default to "available"
- ✅ Can view all slots in calendar format

**Technical Tasks:**
- Create migration for `time_slots` table
- Create `TimeSlot` model with CRUD methods
- Create `CreateTimeSlotDTO` validator (Zod)
- Create API route `POST /api/instructor/courses/[id]/slots`
- Create API route `GET /api/instructor/courses/[id]/slots`
- Create `<TimeSlotForm>` component
- Create `<TimeSlotCalendar>` component
- Create React Query hooks: `useCreateTimeSlot`, `useTimeSlots`
- Write unit and integration tests

**Estimated Effort:** 3-4 days

---

#### Story 1.2: View Available Slots (Student)
**As a** Student  
**I want to** view all available time slots for a course  
**So that** I can choose a convenient time to book

**Acceptance Criteria:**
- ✅ Shows calendar view of available slots
- ✅ Displays slot date, time, duration, price
- ✅ Booked slots are hidden or grayed out
- ✅ Timezone handling (user's local time)

**Technical Tasks:**
- Create API route `GET /api/courses/[id]/slots/available`
- Create `<SlotPicker>` component with calendar UI
- Add timezone conversion logic
- Create React Query hook: `useAvailableSlots`
- Write tests

**Estimated Effort:** 2 days

---

### Epic 2: Booking Flow
**Goal:** Students can book time slots and lock them upon payment

#### Story 2.1: Initiate Booking
**As a** Student  
**I want to** select one or more time slots to book  
**So that** I can proceed to payment

**Acceptance Criteria:**
- ✅ Can select single or multiple slots
- ✅ Shows total price calculation
- ✅ Validates slot availability before payment
- ✅ Creates booking record with `pending` status

**Technical Tasks:**
- Create migration for `bookings` table
- Create `Booking` model with CRUD methods
- Create `CreateBookingDTO` validator (Zod)
- Create API route `POST /api/bookings/initiate`
- Create `<BookingCart>` component
- Create React Query hook: `useInitiateBooking`
- Write tests

**Estimated Effort:** 3 days

---

#### Story 2.2: Lock Slot After Payment
**As the** System  
**I want to** lock booked slots after successful payment  
**So that** no other student can book the same slot

**Acceptance Criteria:**
- ✅ Slot locked only on payment success
- ✅ Updates `time_slots.is_available = false`
- ✅ Updates `time_slots.booked_by = user_id`
- ✅ Updates `bookings.payment_status = 'paid'`
- ✅ Atomic transaction (all or nothing)

**Technical Tasks:**
- Create service method `BookingService.confirmPayment()`
- Add transaction handling in service layer
- Handle PayMob webhook callback
- Write tests for locking logic

**Estimated Effort:** 2 days

---

### Epic 3: PayMob Payment Integration
**Goal:** Students can pay for bookings using PayMob (cards, wallets)

#### Story 3.1: Generate Payment Link
**As the** System  
**I want to** generate a PayMob payment link for a booking  
**So that** the student can complete payment

**Acceptance Criteria:**
- ✅ Creates PayMob order with booking details
- ✅ Returns payment URL to frontend
- ✅ Stores PayMob order ID in `bookings.payment_id`
- ✅ Supports cards and mobile wallets

**Technical Tasks:**
- Install PayMob SDK or use REST API
- Create `/lib/services/paymobService.ts`
- Add PayMob credentials to `.env`
- Create API route `POST /api/payments/paymob/create`
- Create `<PaymentButton>` component
- Create React Query hook: `useCreatePayment`
- Write tests with mocked PayMob responses

**Estimated Effort:** 3 days

---

#### Story 3.2: Handle Payment Webhook
**As the** System  
**I want to** receive payment confirmation from PayMob  
**So that** I can update booking status automatically

**Acceptance Criteria:**
- ✅ Webhook endpoint verifies PayMob signature
- ✅ Updates `bookings.payment_status = 'paid'`
- ✅ Locks the time slot
- ✅ Triggers meeting creation
- ✅ Triggers confirmation email
- ✅ Handles failed payments gracefully

**Technical Tasks:**
- Create API route `POST /api/webhooks/paymob`
- Add HMAC signature verification
- Call `BookingService.confirmPayment()` on success
- Handle edge cases (duplicate webhooks, late arrivals)
- Add logging for webhook events
- Write tests for webhook handling

**Estimated Effort:** 3 days

---

### Epic 4: Meeting Management
**Goal:** Provide meeting links to students for booked sessions

#### Story 4.1: Manual Meeting Links (MVP)
**As an** Instructor  
**I want to** manually add a meeting link when creating a course  
**So that** students receive it after booking

**Acceptance Criteria:**
- ✅ Instructor adds meeting link (Zoom/Google Meet URL) to course
- ✅ Link automatically included in booking confirmation
- ✅ Student sees meeting link in dashboard

**Technical Tasks:**
- Update `courses` migration to add `meeting_link` column
- Update `CreateCourseDTO` validator
- Update course creation form to include meeting link input
- Copy meeting link to `bookings.meeting_link` on confirmation
- Display meeting link in student dashboard
- Write tests

**Estimated Effort:** 1-2 days

---

### Epic 5: Notifications & Confirmations
**Goal:** Send email confirmations to students and instructors

#### Story 5.1: Booking Confirmation Email (Student)
**As a** Student  
**I want to** receive an email after successful booking  
**So that** I have all the details for my session

**Acceptance Criteria:**
- ✅ Email includes: course title, date/time, meeting link, instructor name
- ✅ Includes calendar invite (.ics file)
- ✅ Sent immediately after payment confirmation

**Technical Tasks:**
- Install email library (Nodemailer or Resend)
- Create `/lib/services/emailService.ts`
- Design email template with booking details
- Generate `.ics` calendar file
- Call email service from webhook handler
- Add email config to `.env`
- Write tests with email mocking

**Estimated Effort:** 2 days

---

#### Story 5.2: New Booking Notification (Instructor)
**As an** Instructor  
**I want to** receive an email when a student books my course  
**So that** I'm aware of upcoming sessions

**Acceptance Criteria:**
- ✅ Email includes: student name, booked slot details, payment confirmation
- ✅ Sent immediately after payment confirmation

**Technical Tasks:**
- Add method `emailService.sendInstructorNotification()`
- Design instructor email template
- Call method from webhook handler
- Write tests

**Estimated Effort:** 1 day

---

### Epic 6: Dashboards & UI
**Goal:** Complete student and instructor dashboards with booking management

#### Story 6.1: Student Booking Dashboard
**As a** Student  
**I want to** see all my bookings in one place  
**So that** I can track upcoming and past sessions

**Acceptance Criteria:**
- ✅ Lists all bookings (upcoming, completed, cancelled)
- ✅ Shows course name, date/time, status, meeting link
- ✅ Can click to join meeting
- ✅ Can cancel booking (if allowed)

**Technical Tasks:**
- Create API route `GET /api/student/bookings`
- Create `<MyBookings>` component
- Add filters (upcoming/past/all)
- Create React Query hook: `useMyBookings`
- Write tests

**Estimated Effort:** 2 days

---

#### Story 6.2: Instructor Upcoming Sessions
**As an** Instructor  
**I want to** see all my upcoming booked sessions  
**So that** I can prepare and manage my schedule

**Acceptance Criteria:**
- ✅ Lists all confirmed bookings for instructor's courses
- ✅ Shows student name, course, date/time, payment status
- ✅ Can mark as completed or no-show

**Technical Tasks:**
- Create API route `GET /api/instructor/bookings`
- Create `<InstructorBookings>` component
- Add status update functionality
- Create React Query hook: `useInstructorBookings`
- Write tests

**Estimated Effort:** 2 days

---

#### Story 6.3: Admin Bookings Overview
**As an** Admin  
**I want to** see all bookings across the platform  
**So that** I can monitor activity and handle issues

**Acceptance Criteria:**
- ✅ Lists all bookings with filters (user, course, status, date range)
- ✅ Can view payment details
- ✅ Can cancel/refund bookings

**Technical Tasks:**
- Create API route `GET /api/admin/bookings` with pagination
- Create `<AdminBookings>` component with filters
- Create React Query hook: `useAdminBookings`
- Write tests

**Estimated Effort:** 2 days

---

## 4. API Endpoints

### Time Slots
```
POST   /api/instructor/courses/[id]/slots        Create time slot(s)
GET    /api/instructor/courses/[id]/slots        Get all slots (instructor)
PUT    /api/instructor/slots/[id]                Update slot
DELETE /api/instructor/slots/[id]                Delete slot
GET    /api/courses/[id]/slots/available         Get available slots (public)
```

### Bookings
```
POST   /api/bookings/initiate                    Create pending booking
GET    /api/student/bookings                     Get student's bookings
GET    /api/instructor/bookings                  Get instructor's bookings
GET    /api/admin/bookings                       Get all bookings (admin)
PUT    /api/bookings/[id]/cancel                 Cancel booking
PUT    /api/bookings/[id]/status                 Update booking status (instructor/admin)
```

### Payments
```
POST   /api/payments/paymob/create               Generate PayMob payment link
POST   /api/webhooks/paymob                      Handle PayMob webhook
```

### Courses (Updates)
```
POST   /api/instructor/courses               Updated to include meeting_link, slot_duration
PUT    /api/instructor/courses/[id]          Updated to include meeting_link, slot_duration
```

---

## 5. Testing Requirements

### Phase 2 Testing Goals
- ✅ **80%+ code coverage** (unit + integration)
- ✅ **E2E smoke tests** for critical flows
- ✅ **Payment webhook testing** with mocked PayMob

### Test Coverage Breakdown
1. **Models** (time_slots, bookings): CRUD operations, locking logic
2. **Services** (paymobService, emailService, bookingService): All methods
3. **API Routes**: All endpoints with auth/RBAC checks
4. **React Query Hooks**: Success, error, loading states
5. **Components**: User interactions, form submissions
6. **E2E**: Full booking flow (browse → select → pay → confirm)

### Test Tools
- **Unit/Integration:** Vitest + Testing Library + MSW
- **E2E:** Playwright
- **Coverage:** Vitest coverage with 80% threshold

---

## 6. Phase 2 Timeline

### Week 1: Time Slot Management
- Story 1.1: Create Time Slots (3 days)
- Story 1.2: View Available Slots (2 days)
- **Deliverable:** Instructors can create slots, students can view them

### Week 2: Booking Flow
- Story 2.1: Initiate Booking (3 days)
- Story 2.2: Lock Slot After Payment (2 days)
- **Deliverable:** Complete booking creation flow

### Week 3: PayMob Integration
- Story 3.1: Generate Payment Link (3 days)
- Story 3.2: Handle Payment Webhook (3 days)
- **Deliverable:** End-to-end payment flow working

### Week 4: Meeting & Notifications
- Story 4.1: Manual Meeting Links (2 days)
- Story 5.1: Booking Confirmation Email (2 days)
- Story 5.2: Instructor Notification Email (1 day)
- **Deliverable:** Automated confirmations and notifications

### Week 5: Dashboards
- Story 6.1: Student Booking Dashboard (2 days)
- Story 6.2: Instructor Upcoming Sessions (2 days)
- Story 6.3: Admin Bookings Overview (2 days)
- **Deliverable:** Complete dashboard UIs for all roles

### Week 6: Testing & Polish
- Write comprehensive tests for all features
- Performance optimization
- Bug fixes and edge case handling
- Documentation
- **Deliverable:** 80%+ test coverage, production-ready code

**Total Duration:** 6 weeks (30 working days)

---

## 7. Success Metrics

### Technical Metrics
- ✅ All tests passing (80%+ coverage)
- ✅ Zero TypeScript errors
- ✅ API response times < 300ms
- ✅ PayMob webhook handling < 5s
- ✅ Email delivery < 10s
- ✅ Zero database deadlocks

### Business Metrics
- ✅ Students can complete full booking flow in < 3 minutes
- ✅ Payment success rate > 95%
- ✅ Zero double bookings
- ✅ Email delivery rate > 98%
- ✅ Instructor notification delivery > 99%

### Code Quality
- ✅ ESLint passes with no warnings
- ✅ TypeScript strict mode enabled
- ✅ No critical security vulnerabilities
- ✅ Code review approved by team lead

---

## 8. Phase 3 (Future Enhancements)

Deferred features for post-Phase 2:
- Recurring time slots (weekly classes)
- Zoom API auto-meeting creation
- Stripe integration (international payments)
- Mobile app (React Native)
- Refund handling with admin approval
- Booking cancellation policies
- SMS notifications
- Advanced analytics and reporting
- Multi-language support (i18n)
- Rating and review system

---

## 9. Environment Variables Required

Add to `.env.local`:
```
# PayMob Configuration
PAYMOB_API_KEY=your_api_key
PAYMOB_INTEGRATION_ID=your_integration_id
PAYMOB_HMAC_SECRET=your_hmac_secret

# Email Configuration
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASSWORD=your_password
SMTP_FROM=noreply@mihraby.com

# Database (already existing)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=mihraby_db
```

---

## 10. Dependencies to Install

```bash
# Payment
npm install paymob-lib  # or use REST API

# Email
npm install nodemailer  # or resend

# Calendar
npm install ics  # for .ics file generation

# Validation (already installed)
npm install zod

# Testing (already installed)
npm install vitest @testing-library/react msw @playwright/test
```

---

## 11. Rollout Strategy

### Pre-Launch
- [ ] All tests passing locally
- [ ] PayMob sandbox testing complete
- [ ] Email templates reviewed and approved
- [ ] Database migrations tested

### Launch (Production)
- [ ] Run migrations in production
- [ ] Enable PayMob production mode
- [ ] Monitor webhook delivery
- [ ] Monitor email delivery
- [ ] Have rollback plan ready

### Post-Launch
- [ ] Daily monitoring of bookings and payments
- [ ] Weekly review of failed payments
- [ ] Monthly performance analysis
- [ ] Gather user feedback

---

**Document Version:** 2.0  
**Last Updated:** January 4, 2026  
**Status:** Ready for Implementation  
