# Mihraby Phase 2 - Implementation Foundation Complete ✅

> **📌 Historical reference.** This document records the scaffolding work
> (time slots/bookings migrations, types, validators, React Query hooks)
> that shipped on `develop` as the groundwork for the booking system.
> **Phase 0 of the canonical [`ROADMAP.md`](./ROADMAP.md) is a hard
> prerequisite** — it reconciles types, fixes the `bookings.status` enum,
> adds the `slot_hold` unique index, and wires the connection-aware models
> that Phase 2 (Booking hold & concurrency) depends on. Read `ROADMAP.md`
> first; come back here only for historical context on what was already
> scaffolded.

## Project: Mihraby (Course Booking & Scheduling System)
**Repository:** https://github.com/BedoEbied/Tahbeer  
**Branch:** develop-next-fullstack  
**Date:** January 4, 2026  
**Status:** Ready for Development  

---

## 📋 What Was Created

### 1. Technical Requirements Document ✅
**File:** `/docs/TECHNICAL_REQUIREMENTS.md`

Complete specification including:
- **6 Core Epics:**
  1. Time Slot Management
  2. Booking Flow
  3. PayMob Payment Integration
  4. Meeting Management
  5. Notifications & Confirmations
  6. Dashboards & UI

- **13 User Stories** with acceptance criteria
- **31+ Technical Tasks** across all stories
- **Complete API Endpoint Specification**
  - 12 booking endpoints
  - 5 time slot endpoints
  - 2 payment endpoints
- **6-Week Implementation Timeline** (30 working days)
- **Testing Requirements** with 80%+ coverage targets
- **Success Metrics** (technical, business, code quality)

### 2. Database Schema ✅
**Migrations Created:**

#### `20260104-create-time-slots-table.ts`
```sql
Columns: id, course_id, start_time, end_time, is_available, booked_by, created_at
Indexes: (course_id, is_available), (start_time)
Relations: FK to courses, FK to users
```

#### `20260104-create-bookings-table.ts`
```sql
Columns: id, user_id, course_id, slot_id, payment_status, payment_method, 
         payment_id, transaction_id, amount, meeting_link, meeting_id, 
         meeting_platform, status, booked_at, cancelled_at
Indexes: (user_id, status), (payment_status)
Relations: FK to users, courses, time_slots
```

#### `20260104-update-courses-table.ts`
```sql
Added columns: slot_duration, price_per_slot, meeting_platform, meeting_link, currency
```

### 3. TypeScript Types ✅
**File:** `lib/types.ts` (Updated)

**New Interfaces:**
- `ITimeSlot` - Time slot entity
- `IBooking` - Booking entity
- `CreateTimeSlotDTO` - Create time slot input
- `UpdateTimeSlotDTO` - Update time slot input
- `CreateBookingDTO` - Create booking input
- `CreatePaymentDTO` - Payment initiation input

**Updated Interfaces:**
- `ICourse` - Added slot_duration, price_per_slot, meeting_platform, meeting_link, currency

### 4. Validators (Zod Schemas) ✅

#### `lib/validators/time-slot.ts`
- `createTimeSlotSchema` - Validate time slot creation
- `updateTimeSlotSchema` - Validate time slot updates
- Type-safe TypeScript types exported

#### `lib/validators/booking.ts`
- `createBookingSchema` - Validate booking creation
- `createPaymentSchema` - Validate payment details
- `updateBookingStatusSchema` - Validate status updates
- Type-safe TypeScript types exported

### 5. Feature Modules ✅

#### `/features/bookings/`
**API Hooks** (`api/use-bookings.ts`):
- `useMyBookings()` - Get student's bookings
- `useInstructorBookings()` - Get instructor's bookings
- `useAdminBookings()` - Get all bookings (admin)
- `useInitiateBooking()` - Create pending booking
- `useCancelBooking()` - Cancel booking
- `useUpdateBookingStatus()` - Update status

**Components** (Structure ready):
- `BookingCart` - Display selected slots
- `MyBookings` - Student dashboard
- `InstructorBookings` - Instructor dashboard
- `AdminBookings` - Admin overview

**Files:**
- `features/bookings/api/use-bookings.ts` - React Query hooks
- `features/bookings/api/index.ts` - Barrel export
- `features/bookings/components/index.ts` - Component exports
- `features/bookings/index.ts` - Feature module export

#### `/features/time-slots/`
**API Hooks** (`api/use-time-slots.ts`):
- `useTimeSlots()` - Get all slots for course (instructor)
- `useAvailableSlots()` - Get available slots (public)
- `useCreateTimeSlot()` - Create new time slot
- `useUpdateTimeSlot()` - Update time slot
- `useDeleteTimeSlot()` - Delete time slot

**Components** (Structure ready):
- `TimeSlotForm` - Create/edit slots
- `TimeSlotCalendar` - Calendar view
- `SlotPicker` - Student time picker

**Files:**
- `features/time-slots/api/use-time-slots.ts` - React Query hooks
- `features/time-slots/api/index.ts` - Barrel export
- `features/time-slots/components/index.ts` - Component exports
- `features/time-slots/index.ts` - Feature module export

---

## 📅 Implementation Timeline

### Week 1: Time Slot Management (Days 1-5)
- Story 1.1: Create Time Slots (3 days)
- Story 1.2: View Available Slots (2 days)
- **Deliverable:** Instructors create slots, students view them

### Week 2: Booking Flow (Days 6-10)
- Story 2.1: Initiate Booking (3 days)
- Story 2.2: Lock Slot After Payment (2 days)
- **Deliverable:** Complete booking creation flow

### Week 3: PayMob Integration (Days 11-16)
- Story 3.1: Generate Payment Link (3 days)
- Story 3.2: Handle Payment Webhook (3 days)
- **Deliverable:** End-to-end payment flow

### Week 4: Meeting & Notifications (Days 17-21)
- Story 4.1: Manual Meeting Links (2 days)
- Story 5.1: Student Confirmation Email (2 days)
- Story 5.2: Instructor Notification (1 day)
- **Deliverable:** Automated confirmations

### Week 5: Dashboards (Days 22-27)
- Story 6.1: Student Dashboard (2 days)
- Story 6.2: Instructor Dashboard (2 days)
- Story 6.3: Admin Dashboard (2 days)
- **Deliverable:** Complete dashboard UIs

### Week 6: Testing & Polish (Days 28-30)
- Comprehensive testing
- Performance optimization
- Bug fixes
- Documentation
- **Deliverable:** 80%+ test coverage

**Total Duration:** 6 weeks (30 working days)

---

## 🎯 Next Steps

### Immediate (This Week)
1. **Review Technical Requirements** - Ensure alignment with vision
2. **Set up GitHub Issues** - Create issues for each epic/story (optional, can be manual)
3. **Database Preparation** - Test migrations locally
4. **Team Kickoff** - Discuss timeline and expectations

### Week 1 Start
1. **Begin Story 1.1** - Create Time Slots API
2. **Develop TimeSlot Model** - CRUD operations
3. **Build TimeSlotForm Component** - Form UI
4. **Write Unit Tests** - For TimeSlot model

### Dependencies to Install
```bash
# Payment handling
npm install paymob-lib  # or use REST API

# Email service
npm install nodemailer  # or resend

# Calendar .ics generation
npm install ics

# Already installed
zod, vitest, @tanstack/react-query, zustand
```

### Environment Variables Needed
```
PAYMOB_API_KEY=
PAYMOB_INTEGRATION_ID=
PAYMOB_HMAC_SECRET=
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=noreply@mihraby.com
```

---

## 📊 Project Scope Summary

### What Mihraby IS:
✅ Course booking and scheduling platform  
✅ Time slot management system  
✅ PayMob payment processing  
✅ Email confirmation system  
✅ Role-based dashboards  
✅ RBAC authorization  

### What Mihraby is NOT:
❌ Video hosting platform  
❌ Content management system  
❌ Lesson progress tracking  
❌ Live class hosting  

---

## 🏗️ Architecture Overview

```
Mihraby Monolith (Next.js 16)
├── Features
│   ├── bookings/
│   │   ├── api/ - React Query hooks
│   │   └── components/ - UI components
│   ├── time-slots/
│   │   ├── api/ - React Query hooks
│   │   └── components/ - UI components
│   ├── auth/ (existing)
│   └── courses/ (existing)
├── Services
│   ├── paymobService.ts (NEW)
│   ├── emailService.ts (NEW)
│   ├── bookingService.ts (NEW)
│   └── courseService.ts (existing)
├── Database
│   ├── migrations/ (3 new)
│   ├── time_slots table
│   ├── bookings table
│   └── courses table (updated)
├── Types
│   ├── ITimeSlot (NEW)
│   ├── IBooking (NEW)
│   └── DTOs (NEW)
└── Validators
    ├── time-slot.ts (NEW)
    └── booking.ts (NEW)
```

---

## ✅ Success Criteria Checklist

### Phase 2 Completion
- [ ] All 31 technical tasks completed
- [ ] 80%+ test coverage achieved
- [ ] All tests passing (unit + E2E)
- [ ] Zero TypeScript errors
- [ ] API response times < 300ms
- [ ] PayMob webhook handling < 5s
- [ ] Email delivery > 98% success rate
- [ ] Zero double bookings in production
- [ ] Complete documentation written

---

## 📝 Files Created/Modified

**Created (15 files):**
- `docs/TECHNICAL_REQUIREMENTS.md`
- `migrations/20260104-create-time-slots-table.ts`
- `migrations/20260104-create-bookings-table.ts`
- `migrations/20260104-update-courses-table.ts`
- `lib/validators/time-slot.ts`
- `lib/validators/booking.ts`
- `features/bookings/api/use-bookings.ts`
- `features/bookings/api/index.ts`
- `features/bookings/components/index.ts`
- `features/bookings/index.ts`
- `features/time-slots/api/use-time-slots.ts`
- `features/time-slots/api/index.ts`
- `features/time-slots/components/index.ts`
- `features/time-slots/index.ts`

**Modified (1 file):**
- `lib/types.ts` - Added ITimeSlot, IBooking, DTOs

---

## 🚀 Ready to Start Development

All foundation files are in place. The project is ready for:
1. **Week 1 Sprint** - Time Slot Management
2. **Team Collaboration** - Clear specs and structure
3. **Testing** - Full test coverage from day one
4. **Production Launch** - 6-week timeline

---

**Status:** ✅ **READY FOR IMPLEMENTATION**  
**Last Updated:** January 4, 2026  
**Committed to:** develop-next-fullstack branch  
**Repository:** https://github.com/BedoEbied/Tahbeer  

---

For detailed specifications, see `/docs/TECHNICAL_REQUIREMENTS.md`
