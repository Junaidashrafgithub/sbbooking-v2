export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'doctor';
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Staff {
  id: number;
  userId?: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  isActive: boolean;
  availability?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: Date;
  address?: string;
  insuranceInfo?: any;
  medicalHistory?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Service {
  id: number;
  name: string;
  description?: string;
  categoryId?: number;
  duration: number;
  capacity: number;
  price?: string;
  isGroup: boolean;
  isActive: boolean;
  rules?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface Appointment {
  id: number;
  patientId: number;
  staffId: number;
  serviceId: number;
  startTime: Date;
  endTime: Date;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  recurringRuleId?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AppointmentWithDetails extends Appointment {
  patient?: Patient;
  staff?: Staff;
  service?: Service;
}

export interface DashboardStats {
  todayAppointments: number;
  weekAppointments: number;
  activePatients: number;
  monthlyRevenue: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
  booked: boolean;
  reason?: string;
}

export interface StaffAvailability {
  availability: any;
  exclusions: any[];
  existingAppointments: Appointment[];
}
