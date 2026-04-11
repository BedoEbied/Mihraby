# GitHub Issues Template - Create Manually

## How to Create Issues in Your GitHub Project

Since automated issue creation requires GitHub CLI setup, here's the complete template you can use to manually create all issues in GitHub.

---

## 🎯 EPICS (6 Total)

### Epic 1: Time Slot Management
**Title:** Epic 1: Time Slot Management  
**Labels:** epic, time-slots, p0  
**Milestone:** Phase 2  
**Description:**
```
## Epic Goal
Instructors can create and manage available time slots for their courses

## Acceptance Criteria
- Instructors can create single or multiple time slots
- Slot duration based on course settings
- Cannot create overlapping slots
- Slots default to "available"
- Calendar view of all slots

## Linked Stories
- #Story 1.1: Create Time Slots
- #Story 1.2: View Available Slots (Student)

## Status
Ready for implementation
```

---

### Epic 2: Booking Flow
**Title:** Epic 2: Booking Flow  
**Labels:** epic, bookings, p0  
**Milestone:** Phase 2  
**Description:**
```
## Epic Goal
Students can book time slots and lock them upon payment

## Acceptance Criteria
- Students can select one or more slots
- Shows total price calculation
- Validates slot availability before payment
- Slots locked only on payment success
- Atomic transactions (all or nothing)

## Linked Stories
- #Story 2.1: Initiate Booking
- #Story 2.2: Lock Slot After Payment

## Status
Ready for implementation
```

---

### Epic 3: PayMob Payment Integration
**Title:** Epic 3: PayMob Payment Integration  
**Labels:** epic, paymob, payment, p0  
**Milestone:** Phase 2  
**Description:**
```
## Epic Goal
Students can pay for bookings using PayMob (cards, wallets)

## Acceptance Criteria
- Creates PayMob order with booking details
- Returns payment URL to frontend
- Stores PayMob order ID in bookings
- Supports cards and mobile wallets
- Webhook endpoint verifies PayMob signature
- Updates booking status automatically
- Handles failed payments gracefully

## Linked Stories
- #Story 3.1: Generate Payment Link
- #Story 3.2: Handle Payment Webhook

## Status
Ready for implementation
```

---

### Epic 4: Meeting Management
**Title:** Epic 4: Meeting Management  
**Labels:** epic, meetings, p1  
**Milestone:** Phase 2  
**Description:**
```
## Epic Goal
Provide meeting links to students for booked sessions

## Acceptance Criteria
- Instructor adds meeting link when creating course
- Link automatically included in booking confirmation
- Student sees meeting link in dashboard
- Supports Zoom, Google Meet, or manual links

## Linked Stories
- #Story 4.1: Manual Meeting Links (MVP)

## Status
Ready for implementation
```

---

### Epic 5: Notifications & Confirmations
**Title:** Epic 5: Notifications & Confirmations  
**Labels:** epic, notifications, email, p0  
**Milestone:** Phase 2  
**Description:**
```
## Epic Goal
Send email confirmations to students and instructors

## Acceptance Criteria
- Email includes course title, date/time, meeting link
- Calendar invite (.ics file) included
- Sent immediately after payment confirmation
- Instructor receives new booking notification

## Linked Stories
- #Story 5.1: Booking Confirmation Email (Student)
- #Story 5.2: New Booking Notification (Instructor)

## Status
Ready for implementation
```

---

### Epic 6: Dashboards & UI
**Title:** Epic 6: Dashboards & UI  
**Labels:** epic, dashboard, ui, p0  
**Milestone:** Phase 2  
**Description:**
```
## Epic Goal
Complete student and instructor dashboards with booking management

## Acceptance Criteria
- Student dashboard shows all bookings
- Instructor dashboard shows upcoming sessions
- Admin dashboard shows all bookings with filters
- Can manage booking status
- Can cancel bookings (if allowed)

## Linked Stories
- #Story 6.1: Student Booking Dashboard
- #Story 6.2: Instructor Upcoming Sessions
- #Story 6.3: Admin Bookings Overview

## Status
Ready for implementation
```

---

## 📖 USER STORIES (13 Total)

### Story 1.1: Create Time Slots
**Title:** Story 1.1: Create Time Slots  
**Labels:** story, time-slots, week1, p0  
**Milestone:** Phase 2 - Week 1  
**Estimate:** 3-4 days  
**Description:**
```
## As an
Instructor

## I want to
Create available time slots for my course

## So that
Students can book sessions with me

## Acceptance Criteria
- [ ] Can create single or multiple slots
- [ ] Slot duration based on course settings
- [ ] Cannot create overlapping slots
- [ ] Slots default to "available"
- [ ] Can view all slots in calendar format

## Technical Tasks
- [ ] Create migration for time_slots table
- [ ] Create TimeSlot model with CRUD methods
- [ ] Create CreateTimeSlotDTO validator
- [ ] Create API route POST /api/instructor/courses/[id]/slots
- [ ] Create API route GET /api/instructor/courses/[id]/slots
- [ ] Create TimeSlotForm component
- [ ] Create TimeSlotCalendar component
- [ ] Create React Query hooks
- [ ] Write unit and integration tests

## Definition of Done
- All tests passing
- Code reviewed
- Documentation updated
```

---

### Story 1.2: View Available Slots (Student)
**Title:** Story 1.2: View Available Slots (Student)  
**Labels:** story, time-slots, week1, p0  
**Milestone:** Phase 2 - Week 1  
**Estimate:** 2 days  
**Description:**
```
## As a
Student

## I want to
View all available time slots for a course

## So that
I can choose a convenient time to book

## Acceptance Criteria
- [ ] Shows calendar view of available slots
- [ ] Displays slot date, time, duration, price
- [ ] Booked slots are hidden or grayed out
- [ ] Timezone handling (user's local time)

## Technical Tasks
- [ ] Create API route GET /api/courses/[id]/slots/available
- [ ] Create SlotPicker component with calendar UI
- [ ] Add timezone conversion logic
- [ ] Create React Query hook: useAvailableSlots
- [ ] Write tests

## Definition of Done
- All tests passing
- Code reviewed
- Documentation updated
```

---

### Story 2.1: Initiate Booking
**Title:** Story 2.1: Initiate Booking  
**Labels:** story, bookings, week2, p0  
**Milestone:** Phase 2 - Week 2  
**Estimate:** 3 days  
**Description:**
```
## As a
Student

## I want to
Select one or more time slots to book

## So that
I can proceed to payment

## Acceptance Criteria
- [ ] Can select single or multiple slots
- [ ] Shows total price calculation
- [ ] Validates slot availability before payment
- [ ] Creates booking record with pending status

## Technical Tasks
- [ ] Create migration for bookings table
- [ ] Create Booking model with CRUD methods
- [ ] Create CreateBookingDTO validator
- [ ] Create API route POST /api/bookings/initiate
- [ ] Create BookingCart component
- [ ] Create React Query hook: useInitiateBooking
- [ ] Write tests

## Definition of Done
- All tests passing
- Code reviewed
- Documentation updated
```

---

### Story 2.2: Lock Slot After Payment
**Title:** Story 2.2: Lock Slot After Payment  
**Labels:** story, bookings, week2, p0  
**Milestone:** Phase 2 - Week 2  
**Estimate:** 2 days  
**Description:**
```
## As the
System

## I want to
Lock booked slots after successful payment

## So that
No other student can book the same slot

## Acceptance Criteria
- [ ] Slot locked only on payment success
- [ ] Updates time_slots.is_available = false
- [ ] Updates time_slots.booked_by = user_id
- [ ] Updates bookings.payment_status = paid
- [ ] Atomic transaction (all or nothing)

## Technical Tasks
- [ ] Create service method BookingService.confirmPayment()
- [ ] Add transaction handling in service layer
- [ ] Handle PayMob webhook callback
- [ ] Write tests for locking logic

## Definition of Done
- All tests passing
- Code reviewed
- Documentation updated
```

---

### Story 3.1: Generate Payment Link
**Title:** Story 3.1: Generate Payment Link  
**Labels:** story, paymob, payment, week3, p0  
**Milestone:** Phase 2 - Week 3  
**Estimate:** 3 days  
**Description:**
```
## As the
System

## I want to
Generate a PayMob payment link for a booking

## So that
The student can complete payment

## Acceptance Criteria
- [ ] Creates PayMob order with booking details
- [ ] Returns payment URL to frontend
- [ ] Stores PayMob order ID in bookings.payment_id
- [ ] Supports cards and mobile wallets

## Technical Tasks
- [ ] Install PayMob SDK or use REST API
- [ ] Create lib/services/paymobService.ts
- [ ] Add PayMob credentials to .env
- [ ] Create API route POST /api/payments/paymob/create
- [ ] Create PaymentButton component
- [ ] Create React Query hook: useCreatePayment
- [ ] Write tests with mocked PayMob responses

## Definition of Done
- All tests passing
- Code reviewed
- Documentation updated
```

---

### Story 3.2: Handle Payment Webhook
**Title:** Story 3.2: Handle Payment Webhook  
**Labels:** story, paymob, payment, week3, p0  
**Milestone:** Phase 2 - Week 3  
**Estimate:** 3 days  
**Description:**
```
## As the
System

## I want to
Receive payment confirmation from PayMob

## So that
I can update booking status automatically

## Acceptance Criteria
- [ ] Webhook endpoint verifies PayMob signature
- [ ] Updates bookings.payment_status = paid
- [ ] Locks the time slot
- [ ] Triggers meeting creation
- [ ] Triggers confirmation email
- [ ] Handles failed payments gracefully

## Technical Tasks
- [ ] Create API route POST /api/webhooks/paymob
- [ ] Add HMAC signature verification
- [ ] Call BookingService.confirmPayment() on success
- [ ] Handle edge cases (duplicate webhooks, late arrivals)
- [ ] Add logging for webhook events
- [ ] Write tests for webhook handling

## Definition of Done
- All tests passing
- Code reviewed
- Documentation updated
```

---

### Story 4.1: Manual Meeting Links (MVP)
**Title:** Story 4.1: Manual Meeting Links (MVP)  
**Labels:** story, meetings, week4, p1  
**Milestone:** Phase 2 - Week 4  
**Estimate:** 1-2 days  
**Description:**
```
## As an
Instructor

## I want to
Manually add a meeting link when creating a course

## So that
Students receive it after booking

## Acceptance Criteria
- [ ] Instructor adds meeting link (Zoom/Google Meet URL) to course
- [ ] Link automatically included in booking confirmation
- [ ] Student sees meeting link in dashboard

## Technical Tasks
- [ ] Update courses migration to add meeting_link column
- [ ] Update CreateCourseDTO validator
- [ ] Update course creation form
- [ ] Copy meeting link to bookings.meeting_link on confirmation
- [ ] Display meeting link in student dashboard
- [ ] Write tests

## Definition of Done
- All tests passing
- Code reviewed
- Documentation updated
```

---

### Story 5.1: Booking Confirmation Email (Student)
**Title:** Story 5.1: Booking Confirmation Email (Student)  
**Labels:** story, notifications, email, week4, p0  
**Milestone:** Phase 2 - Week 4  
**Estimate:** 2 days  
**Description:**
```
## As a
Student

## I want to
Receive an email after successful booking

## So that
I have all the details for my session

## Acceptance Criteria
- [ ] Email includes: course title, date/time, meeting link, instructor name
- [ ] Includes calendar invite (.ics file)
- [ ] Sent immediately after payment confirmation

## Technical Tasks
- [ ] Install email library (Nodemailer or Resend)
- [ ] Create lib/services/emailService.ts
- [ ] Design email template
- [ ] Generate .ics calendar file
- [ ] Call email service from webhook handler
- [ ] Add email config to .env
- [ ] Write tests with email mocking

## Definition of Done
- All tests passing
- Code reviewed
- Documentation updated
```

---

### Story 5.2: New Booking Notification (Instructor)
**Title:** Story 5.2: New Booking Notification (Instructor)  
**Labels:** story, notifications, email, week4, p0  
**Milestone:** Phase 2 - Week 4  
**Estimate:** 1 day  
**Description:**
```
## As an
Instructor

## I want to
Receive an email when a student books my course

## So that
I'm aware of upcoming sessions

## Acceptance Criteria
- [ ] Email includes: student name, booked slot details, payment confirmation
- [ ] Sent immediately after payment confirmation

## Technical Tasks
- [ ] Add method emailService.sendInstructorNotification()
- [ ] Design instructor email template
- [ ] Call method from webhook handler
- [ ] Write tests

## Definition of Done
- All tests passing
- Code reviewed
- Documentation updated
```

---

### Story 6.1: Student Booking Dashboard
**Title:** Story 6.1: Student Booking Dashboard  
**Labels:** story, dashboard, ui, week5, p0  
**Milestone:** Phase 2 - Week 5  
**Estimate:** 2 days  
**Description:**
```
## As a
Student

## I want to
See all my bookings in one place

## So that
I can track upcoming and past sessions

## Acceptance Criteria
- [ ] Lists all bookings (upcoming, completed, cancelled)
- [ ] Shows course name, date/time, status, meeting link
- [ ] Can click to join meeting
- [ ] Can cancel booking (if allowed)

## Technical Tasks
- [ ] Create API route GET /api/student/bookings
- [ ] Create MyBookings component
- [ ] Add filters (upcoming/past/all)
- [ ] Create React Query hook: useMyBookings
- [ ] Write tests

## Definition of Done
- All tests passing
- Code reviewed
- Documentation updated
```

---

### Story 6.2: Instructor Upcoming Sessions
**Title:** Story 6.2: Instructor Upcoming Sessions  
**Labels:** story, dashboard, ui, week5, p0  
**Milestone:** Phase 2 - Week 5  
**Estimate:** 2 days  
**Description:**
```
## As an
Instructor

## I want to
See all my upcoming booked sessions

## So that
I can prepare and manage my schedule

## Acceptance Criteria
- [ ] Lists all confirmed bookings for instructor's courses
- [ ] Shows student name, course, date/time, payment status
- [ ] Can mark as completed or no-show

## Technical Tasks
- [ ] Create API route GET /api/instructor/bookings
- [ ] Create InstructorBookings component
- [ ] Add status update functionality
- [ ] Create React Query hook: useInstructorBookings
- [ ] Write tests

## Definition of Done
- All tests passing
- Code reviewed
- Documentation updated
```

---

### Story 6.3: Admin Bookings Overview
**Title:** Story 6.3: Admin Bookings Overview  
**Labels:** story, dashboard, ui, week5, p0  
**Milestone:** Phase 2 - Week 5  
**Estimate:** 2 days  
**Description:**
```
## As an
Admin

## I want to
See all bookings across the platform

## So that
I can monitor activity and handle issues

## Acceptance Criteria
- [ ] Lists all bookings with filters (user, course, status, date range)
- [ ] Can view payment details
- [ ] Can cancel/refund bookings

## Technical Tasks
- [ ] Create API route GET /api/admin/bookings with pagination
- [ ] Create AdminBookings component with filters
- [ ] Create React Query hook: useAdminBookings
- [ ] Write tests

## Definition of Done
- All tests passing
- Code reviewed
- Documentation updated
```

---

## 📌 LABELS TO CREATE

Create these labels in your GitHub project:

### Category Labels
- `epic` - Epic-level initiatives
- `story` - User story
- `task` - Individual task
- `bug` - Bug fix
- `feature` - New feature

### Feature Labels
- `time-slots` - Time slot management
- `bookings` - Booking management
- `paymob` - PayMob payment
- `payment` - Payment-related
- `notifications` - Notification system
- `email` - Email functionality
- `meetings` - Meeting management
- `dashboard` - Dashboard features
- `ui` - UI/UX component
- `testing` - Testing task

### Priority Labels
- `p0` - Critical path (Phase 2 MVP)
- `p1` - Important (can be Phase 3)
- `p2` - Nice to have

### Timeline Labels
- `week1` - Week 1 implementation
- `week2` - Week 2 implementation
- `week3` - Week 3 implementation
- `week4` - Week 4 implementation
- `week5` - Week 5 implementation
- `week6` - Week 6 implementation

---

## 🎯 MILESTONES TO CREATE

### Milestone: Phase 2
**Description:** Core feature development for booking system  
**Due Date:** February 14, 2026 (6 weeks from Jan 4)  
**Issues:** All 19 issues

### Milestone: Phase 2 - Week 1
**Description:** Time Slot Management (Stories 1.1, 1.2)  
**Due Date:** January 11, 2026  
**Issues:** 2 stories

### Milestone: Phase 2 - Week 2
**Description:** Booking Flow (Stories 2.1, 2.2)  
**Due Date:** January 18, 2026  
**Issues:** 2 stories

### Milestone: Phase 2 - Week 3
**Description:** PayMob Integration (Stories 3.1, 3.2)  
**Due Date:** January 25, 2026  
**Issues:** 2 stories

### Milestone: Phase 2 - Week 4
**Description:** Meetings & Notifications (Stories 4.1, 5.1, 5.2)  
**Due Date:** February 1, 2026  
**Issues:** 3 stories

### Milestone: Phase 2 - Week 5
**Description:** Dashboards & UI (Stories 6.1, 6.2, 6.3)  
**Due Date:** February 8, 2026  
**Issues:** 3 stories

### Milestone: Phase 2 - Week 6
**Description:** Testing & Production Polish  
**Due Date:** February 14, 2026  
**Issues:** All issues (with focus on testing and QA)

---

## 📋 STEPS TO ADD TO YOUR PROJECT

1. **Go to:** https://github.com/users/BedoEbied/projects/3
2. **Create Labels** (Settings → Labels)
3. **Create Milestones** (Repo Settings → Milestones)
4. **Create Issues** using templates above
5. **Add to Project** (click "Add to project" on each issue)
6. **Link Issues** (use references like #Issue123 in descriptions)

---

**Total Issues to Create:** 6 Epics + 13 Stories = **19 GitHub Issues**

---
