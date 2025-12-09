import { pgTable, uuid, varchar, text, timestamp, boolean, pgEnum, real, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'professor', 'student']);
export const attendanceStatusEnum = pgEnum('attendance_status', ['present', 'absent', 'late', 'excused']);

// Users
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  passwordHash: text('password_hash'),
  role: userRoleEnum('role').notNull().default('student'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Courses
export const courses = pgTable('courses', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 20 }).notNull().unique(),
  description: text('description'),
  professorId: uuid('professor_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  schedule: text('schedule'),
  location: text('location'),
  latitude: real('latitude'),
  longitude: real('longitude'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Enrollments
export const enrollments = pgTable('enrollments', {
  id: uuid('id').defaultRandom().primaryKey(),
  studentId: uuid('student_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  courseId: uuid('course_id').references(() => courses.id, { onDelete: 'cascade' }).notNull(),
  enrolledAt: timestamp('enrolled_at').defaultNow().notNull(),
  active: boolean('active').default(true),
}, (table) => ({
  uniqueEnrollment: uniqueIndex('unique_enrollment').on(table.studentId, table.courseId),
}));

// Class Sessions
export const classSessions = pgTable('class_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  courseId: uuid('course_id').references(() => courses.id, { onDelete: 'cascade' }).notNull(),
  professorId: uuid('professor_id').references(() => users.id).notNull(),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  endedAt: timestamp('ended_at'),
  qrSecret: varchar('qr_secret', { length: 64 }).notNull(),
  isActive: boolean('is_active').default(true),
  latitude: real('latitude'),
  longitude: real('longitude'),
});

// Attendance Records
export const attendanceRecords = pgTable('attendance_records', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id').references(() => classSessions.id, { onDelete: 'cascade' }).notNull(),
  studentId: uuid('student_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  status: attendanceStatusEnum('status').notNull().default('present'),
  markedAt: timestamp('marked_at').defaultNow().notNull(),
  markedBy: uuid('marked_by').references(() => users.id),
  latitude: real('latitude'),
  longitude: real('longitude'),
  deviceInfo: text('device_info'),
}, (table) => ({
  uniqueAttendance: uniqueIndex('unique_attendance').on(table.sessionId, table.studentId),
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  taughtCourses: many(courses),
  enrollments: many(enrollments),
  attendanceRecords: many(attendanceRecords),
  sessions: many(classSessions),
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
  professor: one(users, { fields: [courses.professorId], references: [users.id] }),
  enrollments: many(enrollments),
  sessions: many(classSessions),
}));

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
  student: one(users, { fields: [enrollments.studentId], references: [users.id] }),
  course: one(courses, { fields: [enrollments.courseId], references: [courses.id] }),
}));

export const classSessionsRelations = relations(classSessions, ({ one, many }) => ({
  course: one(courses, { fields: [classSessions.courseId], references: [courses.id] }),
  professor: one(users, { fields: [classSessions.professorId], references: [users.id] }),
  attendanceRecords: many(attendanceRecords),
}));

export const attendanceRecordsRelations = relations(attendanceRecords, ({ one }) => ({
  session: one(classSessions, { fields: [attendanceRecords.sessionId], references: [classSessions.id] }),
  student: one(users, { fields: [attendanceRecords.studentId], references: [users.id] }),
  markedByUser: one(users, { fields: [attendanceRecords.markedBy], references: [users.id] }),
}));

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Course = typeof courses.$inferSelect;
export type NewCourse = typeof courses.$inferInsert;
export type Enrollment = typeof enrollments.$inferSelect;
export type ClassSession = typeof classSessions.$inferSelect;
export type AttendanceRecord = typeof attendanceRecords.$inferSelect;
