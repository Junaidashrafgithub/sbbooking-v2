/**
 * This file contains JSDoc type definitions for the application
 * These replace the TypeScript interfaces from the original codebase
 */

/**
 * @typedef {Object} User
 * @property {number} id - User ID
 * @property {string} email - User email address
 * @property {string} firstName - User first name
 * @property {string} lastName - User last name
 * @property {'admin' | 'doctor'} role - User role
 */

/**
 * @typedef {Object} AuthResponse
 * @property {string} token - Authentication token
 * @property {User} user - User information
 */

/**
 * @typedef {Object} Staff
 * @property {number} id - Staff ID
 * @property {number} [userId] - Associated user ID (optional)
 * @property {string} firstName - Staff first name
 * @property {string} lastName - Staff last name
 * @property {string} email - Staff email address
 * @property {string} [phone] - Staff phone number (optional)
 * @property {string} role - Staff role
 * @property {boolean} isActive - Whether staff is active
 * @property {Object} [availability] - Staff availability settings (optional)
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */

/**
 * @typedef {Object} Patient
 * @property {number} id - Patient ID
 * @property {string} firstName - Patient first name
 * @property {string} lastName - Patient last name
 * @property {string} [email] - Patient email address (optional)
 * @property {string} [phone] - Patient phone number (optional)
 * @property {Date} [dateOfBirth] - Patient date of birth (optional)
 * @property {string} [address] - Patient address (optional)
 * @property {Object} [insuranceInfo] - Patient insurance information (optional)
 * @property {string} [medicalHistory] - Patient medical history (optional)
 * @property {boolean} isActive - Whether patient is active
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */

/**
 * @typedef {Object} Service
 * @property {number} id - Service ID
 * @property {string} name - Service name
 * @property {string} [description] - Service description (optional)
 * @property {number} [categoryId] - Category ID (optional)
 * @property {number} duration - Service duration in minutes
 * @property {number} capacity - Maximum number of patients
 * @property {string} [price] - Service price (optional)
 * @property {boolean} isGroup - Whether this is a group service
 * @property {boolean} isActive - Whether service is active
 * @property {Object} [rules] - Service rules (optional)
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */

/**
 * @typedef {Object} Appointment
 * @property {number} id - Appointment ID
 * @property {number} patientId - Patient ID
 * @property {number} staffId - Staff ID
 * @property {number} serviceId - Service ID
 * @property {Date} startTime - Appointment start time
 * @property {Date} endTime - Appointment end time
 * @property {'scheduled' | 'completed' | 'cancelled' | 'no_show'} status - Appointment status
 * @property {string} [notes] - Appointment notes (optional)
 * @property {number} [recurringRuleId] - Recurring rule ID (optional)
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */

/**
 * @typedef {Object} AppointmentWithDetails
 * @property {number} id - Appointment ID
 * @property {number} patientId - Patient ID
 * @property {number} staffId - Staff ID
 * @property {number} serviceId - Service ID
 * @property {Date} startTime - Appointment start time
 * @property {Date} endTime - Appointment end time
 * @property {'scheduled' | 'completed' | 'cancelled' | 'no_show'} status - Appointment status
 * @property {string} [notes] - Appointment notes (optional)
 * @property {number} [recurringRuleId] - Recurring rule ID (optional)
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 * @property {Patient} [patient] - Patient details
 * @property {Staff} [staff] - Staff details
 * @property {Service} [service] - Service details
 */

/**
 * @typedef {Object} DashboardStats
 * @property {number} todayAppointments - Number of appointments today
 * @property {number} weekAppointments - Number of appointments this week
 * @property {number} activePatients - Number of active patients
 * @property {string} monthlyRevenue - Monthly revenue
 */

/**
 * @typedef {Object} TimeSlot
 * @property {string} time - Time slot string
 * @property {boolean} available - Whether the slot is available
 * @property {boolean} booked - Whether the slot is booked
 * @property {string} [reason] - Reason for unavailability (optional)
 */

/**
 * @typedef {Object} StaffAvailability
 * @property {Object} availability - Availability settings
 * @property {Array} exclusions - Exclusion dates/times
 * @property {Array<Appointment>} existingAppointments - Existing appointments
 */
