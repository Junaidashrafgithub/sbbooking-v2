import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import jwt from "jsonwebtoken";
import { insertUserSchema, insertStaffSchema, insertPatientSchema, insertServiceSchema, insertAppointmentSchema } from "@shared/schema";
import { z } from "zod";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Authentication middleware
const authenticateToken = async (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await storage.getUser(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

// Role-based middleware
const requireRole = (roles: string[]) => {
  return (req: any, res: any, next: any) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      const user = await storage.validatePassword(email, password);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/auth/register', async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(400).json({ message: 'Registration failed' });
    }
  });

  app.get('/api/auth/me', authenticateToken, (req: any, res) => {
    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        role: req.user.role
      }
    });
  });

  // Staff routes - Updated to allow doctors to manage their own staff
  app.get('/api/staff', authenticateToken, async (req: any, res) => {
    try {
      let staffList;
      
      if (req.user.role === 'admin') {
        // Admin can see all staff
        staffList = await storage.getAllStaff();
      } else if (req.user.role === 'doctor') {
        // Doctor can only see their own staff
        staffList = await storage.getAllStaff();
        staffList = staffList.filter(s => s.userId === req.user.id);
      } else {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }
      
      res.json(staffList);
    } catch (error) {
      console.error('Get staff error:', error);
      res.status(500).json({ message: 'Failed to fetch staff' });
    }
  });

  app.post('/api/staff', authenticateToken, requireRole(['admin', 'doctor']), async (req: any, res) => {
    try {
      const staffData = insertStaffSchema.parse(req.body);
      
      // If user is a doctor, set userId to their own ID
      if (req.user.role === 'doctor') {
        staffData.userId = req.user.id;
      }
      
      const staff = await storage.createStaff(staffData);
      res.status(201).json(staff);
    } catch (error) {
      console.error('Create staff error:', error);
      res.status(400).json({ message: 'Failed to create staff member' });
    }
  });

  app.put('/api/staff/:id', authenticateToken, requireRole(['admin', 'doctor']), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const staffData = req.body;
      
      // If user is a doctor, ensure they can only update their own staff
      if (req.user.role === 'doctor') {
        const existingStaff = await storage.getStaff(id);
        if (!existingStaff || existingStaff.userId !== req.user.id) {
          return res.status(403).json({ message: 'Can only update your own staff' });
        }
      }
      
      const staff = await storage.updateStaff(id, staffData);
      res.json(staff);
    } catch (error) {
      console.error('Update staff error:', error);
      res.status(400).json({ message: 'Failed to update staff member' });
    }
  });

  app.delete('/api/staff/:id', authenticateToken, requireRole(['admin', 'doctor']), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // If user is a doctor, ensure they can only delete their own staff
      if (req.user.role === 'doctor') {
        const existingStaff = await storage.getStaff(id);
        if (!existingStaff || existingStaff.userId !== req.user.id) {
          return res.status(403).json({ message: 'Can only delete your own staff' });
        }
      }
      
      await storage.deleteStaff(id);
      res.status(204).send();
    } catch (error) {
      console.error('Delete staff error:', error);
      res.status(400).json({ message: 'Failed to delete staff member' });
    }
  });

  // Patient routes
  app.get('/api/patients', authenticateToken, async (req, res) => {
    try {
      const patients = await storage.getAllPatients();
      res.json(patients);
    } catch (error) {
      console.error('Get patients error:', error);
      res.status(500).json({ message: 'Failed to fetch patients' });
    }
  });

  app.post('/api/patients', authenticateToken, async (req, res) => {
    try {
      const patientData = insertPatientSchema.parse(req.body);
      const patient = await storage.createPatient(patientData);
      res.status(201).json(patient);
    } catch (error) {
      console.error('Create patient error:', error);
      res.status(400).json({ message: 'Failed to create patient' });
    }
  });

  app.put('/api/patients/:id', authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const patientData = req.body;
      const patient = await storage.updatePatient(id, patientData);
      res.json(patient);
    } catch (error) {
      console.error('Update patient error:', error);
      res.status(400).json({ message: 'Failed to update patient' });
    }
  });

  app.delete('/api/patients/:id', authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deletePatient(id);
      res.status(204).send();
    } catch (error) {
      console.error('Delete patient error:', error);
      res.status(400).json({ message: 'Failed to delete patient' });
    }
  });

  // Service routes
  app.get('/api/services', authenticateToken, async (req, res) => {
    try {
      const services = await storage.getAllServices();
      res.json(services);
    } catch (error) {
      console.error('Get services error:', error);
      res.status(500).json({ message: 'Failed to fetch services' });
    }
  });

  app.post('/api/services', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const serviceData = insertServiceSchema.parse(req.body);
      const service = await storage.createService(serviceData);
      res.status(201).json(service);
    } catch (error) {
      console.error('Create service error:', error);
      res.status(400).json({ message: 'Failed to create service' });
    }
  });

  app.put('/api/services/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const serviceData = req.body;
      const service = await storage.updateService(id, serviceData);
      res.json(service);
    } catch (error) {
      console.error('Update service error:', error);
      res.status(400).json({ message: 'Failed to update service' });
    }
  });

  app.delete('/api/services/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteService(id);
      res.status(204).send();
    } catch (error) {
      console.error('Delete service error:', error);
      res.status(400).json({ message: 'Failed to delete service' });
    }
  });

  // Appointment routes
  app.get('/api/appointments', authenticateToken, async (req, res) => {
    try {
      const { startDate, endDate, staffId, patientId } = req.query;
      
      let appointments;
      if (startDate && endDate) {
        appointments = await storage.getAppointmentsByDateRange(new Date(startDate as string), new Date(endDate as string));
      } else if (staffId) {
        appointments = await storage.getAppointmentsByStaff(parseInt(staffId as string));
      } else if (patientId) {
        appointments = await storage.getAppointmentsByPatient(parseInt(patientId as string));
      } else {
        appointments = await storage.getAllAppointments();
      }
      
      res.json(appointments);
    } catch (error) {
      console.error('Get appointments error:', error);
      res.status(500).json({ message: 'Failed to fetch appointments' });
    }
  });

  app.post('/api/appointments', authenticateToken, async (req, res) => {
    try {
      const appointmentData = insertAppointmentSchema.parse(req.body);
      
      // Check for conflicts
      const hasConflict = await storage.checkAppointmentConflicts(
        appointmentData.staffId,
        appointmentData.patientId,
        appointmentData.startTime,
        appointmentData.endTime
      );
      
      if (hasConflict) {
        return res.status(409).json({ message: 'Appointment conflicts with existing booking' });
      }
      
      const appointment = await storage.createAppointment(appointmentData);
      res.status(201).json(appointment);
    } catch (error) {
      console.error('Create appointment error:', error);
      res.status(400).json({ message: 'Failed to create appointment' });
    }
  });

  app.put('/api/appointments/:id', authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const appointmentData = req.body;
      
      // Check for conflicts if time is being changed
      if (appointmentData.startTime || appointmentData.endTime || appointmentData.staffId || appointmentData.patientId) {
        const existing = await storage.getAppointment(id);
        if (existing) {
          const hasConflict = await storage.checkAppointmentConflicts(
            appointmentData.staffId || existing.staffId,
            appointmentData.patientId || existing.patientId,
            appointmentData.startTime || existing.startTime,
            appointmentData.endTime || existing.endTime,
            id
          );
          
          if (hasConflict) {
            return res.status(409).json({ message: 'Appointment conflicts with existing booking' });
          }
        }
      }
      
      const appointment = await storage.updateAppointment(id, appointmentData);
      res.json(appointment);
    } catch (error) {
      console.error('Update appointment error:', error);
      res.status(400).json({ message: 'Failed to update appointment' });
    }
  });

  app.delete('/api/appointments/:id', authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteAppointment(id);
      res.status(204).send();
    } catch (error) {
      console.error('Delete appointment error:', error);
      res.status(400).json({ message: 'Failed to delete appointment' });
    }
  });

  // Service categories
  app.get('/api/service-categories', authenticateToken, async (req, res) => {
    try {
      const categories = await storage.getAllServiceCategories();
      res.json(categories);
    } catch (error) {
      console.error('Get service categories error:', error);
      res.status(500).json({ message: 'Failed to fetch service categories' });
    }
  });

  // Reports
  app.get('/api/reports/dashboard', authenticateToken, async (req, res) => {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
      
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      const todayAppointments = await storage.getAppointmentsByDateRange(startOfDay, endOfDay);
      const weekAppointments = await storage.getAppointmentsByDateRange(startOfWeek, endOfWeek);
      const allPatients = await storage.getAllPatients();
      
      // Calculate revenue (simplified)
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      const billingRecords = await storage.getBillingRecords({ startDate: startOfMonth, endDate: endOfMonth });
      const monthlyRevenue = billingRecords.reduce((sum, record) => sum + parseFloat(record.amount), 0);
      
      res.json({
        todayAppointments: todayAppointments.length,
        weekAppointments: weekAppointments.length,
        activePatients: allPatients.length,
        monthlyRevenue: monthlyRevenue.toFixed(2)
      });
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      res.status(500).json({ message: 'Failed to fetch dashboard statistics' });
    }
  });

  // Staff availability
  app.get('/api/staff/:id/availability', authenticateToken, async (req, res) => {
    try {
      const staffId = parseInt(req.params.id);
      const { date } = req.query;
      
      const staff = await storage.getStaff(staffId);
      if (!staff) {
        return res.status(404).json({ message: 'Staff member not found' });
      }
      
      // Get exclusions for the date
      const exclusions = await storage.getStaffExclusions(staffId);
      
      // Get existing appointments for the date
      const startDate = new Date(date as string);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 1);
      
      const existingAppointments = await storage.getAppointmentsByDateRange(startDate, endDate);
      const staffAppointments = existingAppointments.filter(apt => apt.staffId === staffId);
      
      res.json({
        availability: staff.availability,
        exclusions,
        existingAppointments: staffAppointments
      });
    } catch (error) {
      console.error('Get staff availability error:', error);
      res.status(500).json({ message: 'Failed to fetch staff availability' });
    }
  });

  // Subscription routes
  app.post('/api/subscription/create', authenticateToken, requireRole(['doctor']), async (req: any, res) => {
    try {
      const { planId } = req.body;
      const userId = req.user.id;
      
      // Simulate Stripe subscription creation
      const fakeClientSecret = `pi_fake_${Math.random().toString(36).substr(2, 9)}`;
      
      // Update user subscription status
      await storage.updateUser(userId, {
        subscriptionStatus: 'active',
        subscriptionStartDate: new Date(),
        subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        stripeCustomerId: `cus_fake_${Math.random().toString(36).substr(2, 9)}`,
        stripeSubscriptionId: `sub_fake_${Math.random().toString(36).substr(2, 9)}`
      });
      
      res.json({ 
        clientSecret: fakeClientSecret,
        planId,
        message: 'Subscription created successfully (demo mode)'
      });
    } catch (error) {
      console.error('Create subscription error:', error);
      res.status(400).json({ message: 'Failed to create subscription' });
    }
  });

  app.get('/api/subscription/status', authenticateToken, requireRole(['doctor']), async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json({
        status: user.subscriptionStatus,
        startDate: user.subscriptionStartDate,
        endDate: user.subscriptionEndDate,
        planName: user.subscriptionStatus === 'active' ? 'Professional Plan' : 'No Plan',
        nextBilling: user.subscriptionEndDate
      });
    } catch (error) {
      console.error('Get subscription status error:', error);
      res.status(500).json({ message: 'Failed to fetch subscription status' });
    }
  });

  // Admin routes
  app.get('/api/admin/doctors', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const doctors = await storage.getAllDoctors();
      res.json(doctors);
    } catch (error) {
      console.error('Get doctors error:', error);
      res.status(500).json({ message: 'Failed to fetch doctors' });
    }
  });

  app.post('/api/admin/doctors', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const doctorData = {
        ...req.body,
        role: 'doctor'
      };
      const doctor = await storage.createUser(doctorData);
      res.status(201).json(doctor);
    } catch (error) {
      console.error('Create doctor error:', error);
      res.status(400).json({ message: 'Failed to create doctor' });
    }
  });

  app.patch('/api/admin/doctors/:id/subscription', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const doctorId = parseInt(req.params.id);
      const { status } = req.body;
      
      const updateData: any = { subscriptionStatus: status };
      
      if (status === 'active') {
        updateData.subscriptionStartDate = new Date();
        updateData.subscriptionEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      } else if (status === 'trial') {
        updateData.subscriptionStartDate = new Date();
        updateData.subscriptionEndDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
      }
      
      const doctor = await storage.updateUser(doctorId, updateData);
      res.json(doctor);
    } catch (error) {
      console.error('Update doctor subscription error:', error);
      res.status(400).json({ message: 'Failed to update subscription' });
    }
  });

  app.get('/api/admin/stats', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const doctors = await storage.getAllDoctors();
      const appointments = await storage.getAllAppointments();
      const billingRecords = await storage.getBillingRecords();
      
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const newDoctorsThisMonth = doctors.filter((d: any) => {
        const createdAt = new Date(d.createdAt);
        return createdAt.getMonth() === currentMonth && createdAt.getFullYear() === currentYear;
      }).length;
      
      const activeSubscriptions = doctors.filter((d: any) => d.subscriptionStatus === 'active').length;
      const monthlyRevenue = billingRecords.reduce((sum, record) => sum + parseFloat(record.amount), 0);
      
      res.json({
        totalDoctors: doctors.length,
        newDoctorsThisMonth,
        activeSubscriptions,
        subscriptionGrowth: Math.round((activeSubscriptions / doctors.length) * 100),
        totalAppointments: appointments.length,
        appointmentsThisMonth: appointments.filter((a: any) => {
          const createdAt = new Date(a.createdAt);
          return createdAt.getMonth() === currentMonth && createdAt.getFullYear() === currentYear;
        }).length,
        monthlyRevenue: monthlyRevenue.toFixed(2),
        revenueGrowth: 15 // Simulated growth percentage
      });
    } catch (error) {
      console.error('Get admin stats error:', error);
      res.status(500).json({ message: 'Failed to fetch admin statistics' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
