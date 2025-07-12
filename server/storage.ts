import { 
  users, staff, patients, services, serviceCategories, appointments, 
  recurringAppointmentRules, patientServiceAllowances, billingRecords, 
  staffServices, staffAvailabilityExclusions,
  type User, type InsertUser, type Staff, type InsertStaff, type Patient, type InsertPatient,
  type Service, type InsertService, type ServiceCategory, type InsertServiceCategory,
  type Appointment, type InsertAppointment, type RecurringAppointmentRule, type InsertRecurringRule,
  type PatientServiceAllowance, type InsertPatientAllowance, type BillingRecord, type InsertBillingRecord,
  type StaffService, type InsertStaffService, type StaffAvailabilityExclusion, type InsertStaffExclusion
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc, asc, sql } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;
  deleteUser(id: number): Promise<void>;
  
  // Staff management
  getStaff(id: number): Promise<Staff | undefined>;
  getAllStaff(): Promise<Staff[]>;
  createStaff(staff: InsertStaff): Promise<Staff>;
  updateStaff(id: number, staff: Partial<InsertStaff>): Promise<Staff>;
  deleteStaff(id: number): Promise<void>;
  getStaffByService(serviceId: number): Promise<Staff[]>;
  
  // Patient management
  getPatient(id: number): Promise<Patient | undefined>;
  getAllPatients(): Promise<Patient[]>;
  createPatient(patient: InsertPatient): Promise<Patient>;
  updatePatient(id: number, patient: Partial<InsertPatient>): Promise<Patient>;
  deletePatient(id: number): Promise<void>;
  
  // Service management
  getService(id: number): Promise<Service | undefined>;
  getAllServices(): Promise<Service[]>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: number, service: Partial<InsertService>): Promise<Service>;
  deleteService(id: number): Promise<void>;
  
  // Service categories
  getAllServiceCategories(): Promise<ServiceCategory[]>;
  createServiceCategory(category: InsertServiceCategory): Promise<ServiceCategory>;
  
  // Staff-Service assignments
  assignStaffToService(staffId: number, serviceId: number): Promise<StaffService>;
  removeStaffFromService(staffId: number, serviceId: number): Promise<void>;
  
  // Appointment management
  getAppointment(id: number): Promise<Appointment | undefined>;
  getAllAppointments(): Promise<Appointment[]>;
  getAppointmentsByDateRange(startDate: Date, endDate: Date): Promise<Appointment[]>;
  getAppointmentsByStaff(staffId: number): Promise<Appointment[]>;
  getAppointmentsByPatient(patientId: number): Promise<Appointment[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: number, appointment: Partial<InsertAppointment>): Promise<Appointment>;
  deleteAppointment(id: number): Promise<void>;
  checkAppointmentConflicts(staffId: number, patientId: number, startTime: Date, endTime: Date, excludeId?: number): Promise<boolean>;
  
  // Recurring appointments
  createRecurringRule(rule: InsertRecurringRule): Promise<RecurringAppointmentRule>;
  getRecurringRule(id: number): Promise<RecurringAppointmentRule | undefined>;
  
  // Patient allowances
  getPatientAllowances(patientId: number): Promise<PatientServiceAllowance[]>;
  createPatientAllowance(allowance: InsertPatientAllowance): Promise<PatientServiceAllowance>;
  updatePatientAllowance(id: number, allowance: Partial<InsertPatientAllowance>): Promise<PatientServiceAllowance>;
  
  // Billing
  createBillingRecord(record: InsertBillingRecord): Promise<BillingRecord>;
  getBillingRecords(filters?: { patientId?: number, serviceId?: number, startDate?: Date, endDate?: Date }): Promise<BillingRecord[]>;
  
  // Staff availability exclusions
  createStaffExclusion(exclusion: InsertStaffExclusion): Promise<StaffAvailabilityExclusion>;
  getStaffExclusions(staffId: number): Promise<StaffAvailabilityExclusion[]>;
  
  // Authentication
  validatePassword(email: string, password: string): Promise<User | null>;
}

export class DatabaseStorage implements IStorage {
  // User management
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const [user] = await db
      .insert(users)
      .values({ ...insertUser, password: hashedPassword })
      .returning();
    return user;
  }

  async updateUser(id: number, updateUser: Partial<InsertUser>): Promise<User> {
    const updateData = { ...updateUser, updatedAt: new Date() };
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }
    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // Staff management
  async getStaff(id: number): Promise<Staff | undefined> {
    const [staffMember] = await db.select().from(staff).where(eq(staff.id, id));
    return staffMember || undefined;
  }

  async getAllStaff(): Promise<Staff[]> {
    return await db.select().from(staff).where(eq(staff.isActive, true)).orderBy(asc(staff.firstName));
  }

  async createStaff(insertStaff: InsertStaff): Promise<Staff> {
    const [staffMember] = await db
      .insert(staff)
      .values(insertStaff)
      .returning();
    return staffMember;
  }

  async updateStaff(id: number, updateStaff: Partial<InsertStaff>): Promise<Staff> {
    const [staffMember] = await db
      .update(staff)
      .set({ ...updateStaff, updatedAt: new Date() })
      .where(eq(staff.id, id))
      .returning();
    return staffMember;
  }

  async deleteStaff(id: number): Promise<void> {
    await db.update(staff).set({ isActive: false }).where(eq(staff.id, id));
  }

  async getStaffByService(serviceId: number): Promise<Staff[]> {
    return await db
      .select({
        id: staff.id,
        userId: staff.userId,
        firstName: staff.firstName,
        lastName: staff.lastName,
        email: staff.email,
        phone: staff.phone,
        role: staff.role,
        isActive: staff.isActive,
        availability: staff.availability,
        createdAt: staff.createdAt,
        updatedAt: staff.updatedAt,
      })
      .from(staff)
      .innerJoin(staffServices, eq(staff.id, staffServices.staffId))
      .where(and(eq(staffServices.serviceId, serviceId), eq(staff.isActive, true)));
  }

  // Patient management
  async getPatient(id: number): Promise<Patient | undefined> {
    const [patient] = await db.select().from(patients).where(eq(patients.id, id));
    return patient || undefined;
  }

  async getAllPatients(): Promise<Patient[]> {
    return await db.select().from(patients).where(eq(patients.isActive, true)).orderBy(asc(patients.firstName));
  }

  async createPatient(insertPatient: InsertPatient): Promise<Patient> {
    const [patient] = await db
      .insert(patients)
      .values(insertPatient)
      .returning();
    return patient;
  }

  async updatePatient(id: number, updatePatient: Partial<InsertPatient>): Promise<Patient> {
    const [patient] = await db
      .update(patients)
      .set({ ...updatePatient, updatedAt: new Date() })
      .where(eq(patients.id, id))
      .returning();
    return patient;
  }

  async deletePatient(id: number): Promise<void> {
    await db.update(patients).set({ isActive: false }).where(eq(patients.id, id));
  }

  // Service management
  async getService(id: number): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(eq(services.id, id));
    return service || undefined;
  }

  async getAllServices(): Promise<Service[]> {
    return await db.select().from(services).where(eq(services.isActive, true)).orderBy(asc(services.name));
  }

  async createService(insertService: InsertService): Promise<Service> {
    const [service] = await db
      .insert(services)
      .values(insertService)
      .returning();
    return service;
  }

  async updateService(id: number, updateService: Partial<InsertService>): Promise<Service> {
    const [service] = await db
      .update(services)
      .set({ ...updateService, updatedAt: new Date() })
      .where(eq(services.id, id))
      .returning();
    return service;
  }

  async deleteService(id: number): Promise<void> {
    await db.update(services).set({ isActive: false }).where(eq(services.id, id));
  }

  // Service categories
  async getAllServiceCategories(): Promise<ServiceCategory[]> {
    return await db.select().from(serviceCategories).where(eq(serviceCategories.isActive, true));
  }

  async createServiceCategory(insertCategory: InsertServiceCategory): Promise<ServiceCategory> {
    const [category] = await db
      .insert(serviceCategories)
      .values(insertCategory)
      .returning();
    return category;
  }

  // Staff-Service assignments
  async assignStaffToService(staffId: number, serviceId: number): Promise<StaffService> {
    const [assignment] = await db
      .insert(staffServices)
      .values({ staffId, serviceId })
      .returning();
    return assignment;
  }

  async removeStaffFromService(staffId: number, serviceId: number): Promise<void> {
    await db.delete(staffServices).where(and(eq(staffServices.staffId, staffId), eq(staffServices.serviceId, serviceId)));
  }

  // Appointment management
  async getAppointment(id: number): Promise<Appointment | undefined> {
    const [appointment] = await db.select().from(appointments).where(eq(appointments.id, id));
    return appointment || undefined;
  }

  async getAllAppointments(): Promise<Appointment[]> {
    return await db.select().from(appointments).orderBy(desc(appointments.startTime));
  }

  async getAppointmentsByDateRange(startDate: Date, endDate: Date): Promise<Appointment[]> {
    return await db
      .select()
      .from(appointments)
      .where(and(gte(appointments.startTime, startDate), lte(appointments.startTime, endDate)))
      .orderBy(asc(appointments.startTime));
  }

  async getAppointmentsByStaff(staffId: number): Promise<Appointment[]> {
    return await db
      .select()
      .from(appointments)
      .where(eq(appointments.staffId, staffId))
      .orderBy(desc(appointments.startTime));
  }

  async getAppointmentsByPatient(patientId: number): Promise<Appointment[]> {
    return await db
      .select()
      .from(appointments)
      .where(eq(appointments.patientId, patientId))
      .orderBy(desc(appointments.startTime));
  }

  async createAppointment(insertAppointment: InsertAppointment): Promise<Appointment> {
    const [appointment] = await db
      .insert(appointments)
      .values(insertAppointment)
      .returning();
    return appointment;
  }

  async updateAppointment(id: number, updateAppointment: Partial<InsertAppointment>): Promise<Appointment> {
    const [appointment] = await db
      .update(appointments)
      .set({ ...updateAppointment, updatedAt: new Date() })
      .where(eq(appointments.id, id))
      .returning();
    return appointment;
  }

  async deleteAppointment(id: number): Promise<void> {
    await db.delete(appointments).where(eq(appointments.id, id));
  }

  async checkAppointmentConflicts(staffId: number, patientId: number, startTime: Date, endTime: Date, excludeId?: number): Promise<boolean> {
    const query = db
      .select({ id: appointments.id })
      .from(appointments)
      .where(
        and(
          sql`${appointments.staffId} = ${staffId} OR ${appointments.patientId} = ${patientId}`,
          sql`${appointments.startTime} < ${endTime} AND ${appointments.endTime} > ${startTime}`,
          excludeId ? sql`${appointments.id} != ${excludeId}` : undefined
        )
      );
    
    const conflicts = await query;
    return conflicts.length > 0;
  }

  // Recurring appointments
  async createRecurringRule(insertRule: InsertRecurringRule): Promise<RecurringAppointmentRule> {
    const [rule] = await db
      .insert(recurringAppointmentRules)
      .values(insertRule)
      .returning();
    return rule;
  }

  async getRecurringRule(id: number): Promise<RecurringAppointmentRule | undefined> {
    const [rule] = await db.select().from(recurringAppointmentRules).where(eq(recurringAppointmentRules.id, id));
    return rule || undefined;
  }

  // Patient allowances
  async getPatientAllowances(patientId: number): Promise<PatientServiceAllowance[]> {
    return await db
      .select()
      .from(patientServiceAllowances)
      .where(and(eq(patientServiceAllowances.patientId, patientId), eq(patientServiceAllowances.isActive, true)));
  }

  async createPatientAllowance(insertAllowance: InsertPatientAllowance): Promise<PatientServiceAllowance> {
    const [allowance] = await db
      .insert(patientServiceAllowances)
      .values(insertAllowance)
      .returning();
    return allowance;
  }

  async updatePatientAllowance(id: number, updateAllowance: Partial<InsertPatientAllowance>): Promise<PatientServiceAllowance> {
    const [allowance] = await db
      .update(patientServiceAllowances)
      .set(updateAllowance)
      .where(eq(patientServiceAllowances.id, id))
      .returning();
    return allowance;
  }

  // Billing
  async createBillingRecord(insertRecord: InsertBillingRecord): Promise<BillingRecord> {
    const [record] = await db
      .insert(billingRecords)
      .values(insertRecord)
      .returning();
    return record;
  }

  async getBillingRecords(filters?: { patientId?: number, serviceId?: number, startDate?: Date, endDate?: Date }): Promise<BillingRecord[]> {
    if (!filters) {
      return await db.select().from(billingRecords).orderBy(desc(billingRecords.billingDate));
    }
    
    const conditions = [];
    if (filters.patientId) conditions.push(eq(billingRecords.patientId, filters.patientId));
    if (filters.serviceId) conditions.push(eq(billingRecords.serviceId, filters.serviceId));
    if (filters.startDate) conditions.push(gte(billingRecords.billingDate, filters.startDate));
    if (filters.endDate) conditions.push(lte(billingRecords.billingDate, filters.endDate));
    
    if (conditions.length === 0) {
      return await db.select().from(billingRecords).orderBy(desc(billingRecords.billingDate));
    }
    
    return await db.select().from(billingRecords).where(and(...conditions)).orderBy(desc(billingRecords.billingDate));
  }

  // Staff availability exclusions
  async createStaffExclusion(insertExclusion: InsertStaffExclusion): Promise<StaffAvailabilityExclusion> {
    const [exclusion] = await db
      .insert(staffAvailabilityExclusions)
      .values(insertExclusion)
      .returning();
    return exclusion;
  }

  async getStaffExclusions(staffId: number): Promise<StaffAvailabilityExclusion[]> {
    return await db
      .select()
      .from(staffAvailabilityExclusions)
      .where(eq(staffAvailabilityExclusions.staffId, staffId))
      .orderBy(asc(staffAvailabilityExclusions.startTime));
  }

  // Authentication
  async validatePassword(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    if (!user) return null;
    
    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }
}

export const storage = new DatabaseStorage();
