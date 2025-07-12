import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table (Admin and Doctor roles)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull(), // 'admin' or 'doctor'
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  isActive: boolean("is_active").default(true),
  // Subscription fields
  subscriptionStatus: text("subscription_status").default("inactive"), // 'active', 'inactive', 'cancelled'
  subscriptionStartDate: timestamp("subscription_start_date"),
  subscriptionEndDate: timestamp("subscription_end_date"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Staff table
export const staff = pgTable("staff", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id), // The doctor who owns this staff member
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  role: text("role").notNull(), // 'doctor', 'therapist', etc.
  isActive: boolean("is_active").default(true),
  availability: jsonb("availability"), // JSON object for weekly schedule
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Patients table
export const patients = pgTable("patients", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  dateOfBirth: timestamp("date_of_birth"),
  address: text("address"),
  insuranceInfo: jsonb("insurance_info"),
  medicalHistory: text("medical_history"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Service categories
export const serviceCategories = pgTable("service_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Services table
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  categoryId: integer("category_id").references(() => serviceCategories.id),
  duration: integer("duration").notNull(), // in minutes
  capacity: integer("capacity").default(1), // max customers per session
  price: decimal("price", { precision: 10, scale: 2 }),
  isGroup: boolean("is_group").default(false),
  isActive: boolean("is_active").default(true),
  rules: jsonb("rules"), // JSON object for service-specific rules
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Staff-Service assignments
export const staffServices = pgTable("staff_services", {
  id: serial("id").primaryKey(),
  staffId: integer("staff_id").references(() => staff.id),
  serviceId: integer("service_id").references(() => services.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Appointments table
export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").references(() => patients.id).notNull(),
  staffId: integer("staff_id").references(() => staff.id).notNull(),
  serviceId: integer("service_id").references(() => services.id).notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  status: text("status").notNull().default("scheduled"), // 'scheduled', 'completed', 'cancelled', 'no_show'
  notes: text("notes"),
  recurringRuleId: integer("recurring_rule_id").references(() => recurringAppointmentRules.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Recurring appointment rules
export const recurringAppointmentRules = pgTable("recurring_appointment_rules", {
  id: serial("id").primaryKey(),
  frequency: text("frequency").notNull(), // 'weekly', 'monthly'
  interval: integer("interval").default(1), // every N weeks/months
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  daysOfWeek: jsonb("days_of_week"), // for weekly recurring
  dayOfMonth: integer("day_of_month"), // for monthly recurring
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Patient service allowances
export const patientServiceAllowances = pgTable("patient_service_allowances", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").references(() => patients.id).notNull(),
  serviceId: integer("service_id").references(() => services.id).notNull(),
  allowedSessions: integer("allowed_sessions").notNull(),
  usedSessions: integer("used_sessions").default(0),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Billing records
export const billingRecords = pgTable("billing_records", {
  id: serial("id").primaryKey(),
  appointmentId: integer("appointment_id").references(() => appointments.id).notNull(),
  patientId: integer("patient_id").references(() => patients.id).notNull(),
  serviceId: integer("service_id").references(() => services.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  billingDate: timestamp("billing_date").notNull(),
  paymentDate: timestamp("payment_date"),
  paymentStatus: text("payment_status").default("pending"), // 'pending', 'paid', 'denied'
  insuranceClaim: text("insurance_claim"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Staff availability exclusions (for handling time off, etc.)
export const staffAvailabilityExclusions = pgTable("staff_availability_exclusions", {
  id: serial("id").primaryKey(),
  staffId: integer("staff_id").references(() => staff.id).notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  staff: many(staff),
}));

export const staffRelations = relations(staff, ({ one, many }) => ({
  user: one(users, { fields: [staff.userId], references: [users.id] }),
  appointments: many(appointments),
  staffServices: many(staffServices),
  availabilityExclusions: many(staffAvailabilityExclusions),
}));

export const patientsRelations = relations(patients, ({ many }) => ({
  appointments: many(appointments),
  serviceAllowances: many(patientServiceAllowances),
  billingRecords: many(billingRecords),
}));

export const serviceCategoriesRelations = relations(serviceCategories, ({ many }) => ({
  services: many(services),
}));

export const servicesRelations = relations(services, ({ one, many }) => ({
  category: one(serviceCategories, { fields: [services.categoryId], references: [serviceCategories.id] }),
  appointments: many(appointments),
  staffServices: many(staffServices),
  patientAllowances: many(patientServiceAllowances),
  billingRecords: many(billingRecords),
}));

export const staffServicesRelations = relations(staffServices, ({ one }) => ({
  staff: one(staff, { fields: [staffServices.staffId], references: [staff.id] }),
  service: one(services, { fields: [staffServices.serviceId], references: [services.id] }),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  patient: one(patients, { fields: [appointments.patientId], references: [patients.id] }),
  staff: one(staff, { fields: [appointments.staffId], references: [staff.id] }),
  service: one(services, { fields: [appointments.serviceId], references: [services.id] }),
  recurringRule: one(recurringAppointmentRules, { fields: [appointments.recurringRuleId], references: [recurringAppointmentRules.id] }),
  billingRecord: one(billingRecords, { fields: [appointments.id], references: [billingRecords.appointmentId] }),
}));

export const recurringAppointmentRulesRelations = relations(recurringAppointmentRules, ({ many }) => ({
  appointments: many(appointments),
}));

export const patientServiceAllowancesRelations = relations(patientServiceAllowances, ({ one }) => ({
  patient: one(patients, { fields: [patientServiceAllowances.patientId], references: [patients.id] }),
  service: one(services, { fields: [patientServiceAllowances.serviceId], references: [services.id] }),
}));

export const billingRecordsRelations = relations(billingRecords, ({ one }) => ({
  appointment: one(appointments, { fields: [billingRecords.appointmentId], references: [appointments.id] }),
  patient: one(patients, { fields: [billingRecords.patientId], references: [patients.id] }),
  service: one(services, { fields: [billingRecords.serviceId], references: [services.id] }),
}));

export const staffAvailabilityExclusionsRelations = relations(staffAvailabilityExclusions, ({ one }) => ({
  staff: one(staff, { fields: [staffAvailabilityExclusions.staffId], references: [staff.id] }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertStaffSchema = createInsertSchema(staff).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPatientSchema = createInsertSchema(patients).omit({ id: true, createdAt: true, updatedAt: true });
export const insertServiceCategorySchema = createInsertSchema(serviceCategories).omit({ id: true, createdAt: true });
export const insertServiceSchema = createInsertSchema(services).omit({ id: true, createdAt: true, updatedAt: true });
export const insertStaffServiceSchema = createInsertSchema(staffServices).omit({ id: true, createdAt: true });
export const insertAppointmentSchema = createInsertSchema(appointments).omit({ id: true, createdAt: true, updatedAt: true });
export const insertRecurringRuleSchema = createInsertSchema(recurringAppointmentRules).omit({ id: true, createdAt: true });
export const insertPatientAllowanceSchema = createInsertSchema(patientServiceAllowances).omit({ id: true, createdAt: true });
export const insertBillingRecordSchema = createInsertSchema(billingRecords).omit({ id: true, createdAt: true });
export const insertStaffExclusionSchema = createInsertSchema(staffAvailabilityExclusions).omit({ id: true, createdAt: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Staff = typeof staff.$inferSelect;
export type InsertStaff = z.infer<typeof insertStaffSchema>;
export type Patient = typeof patients.$inferSelect;
export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type ServiceCategory = typeof serviceCategories.$inferSelect;
export type InsertServiceCategory = z.infer<typeof insertServiceCategorySchema>;
export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type StaffService = typeof staffServices.$inferSelect;
export type InsertStaffService = z.infer<typeof insertStaffServiceSchema>;
export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type RecurringAppointmentRule = typeof recurringAppointmentRules.$inferSelect;
export type InsertRecurringRule = z.infer<typeof insertRecurringRuleSchema>;
export type PatientServiceAllowance = typeof patientServiceAllowances.$inferSelect;
export type InsertPatientAllowance = z.infer<typeof insertPatientAllowanceSchema>;
export type BillingRecord = typeof billingRecords.$inferSelect;
export type InsertBillingRecord = z.infer<typeof insertBillingRecordSchema>;
export type StaffAvailabilityExclusion = typeof staffAvailabilityExclusions.$inferSelect;
export type InsertStaffExclusion = z.infer<typeof insertStaffExclusionSchema>;
