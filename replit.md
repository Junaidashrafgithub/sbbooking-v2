# Appointment Scheduler System

## Overview

This is a full-stack appointment scheduling system built with React, Node.js/Express, and PostgreSQL. The application provides role-based access control for administrators and doctors, with comprehensive appointment management capabilities including recurring appointments, staff management, patient records, and billing functionality.

## User Preferences

Preferred communication style: Simple, everyday language.

## Login Credentials
- Admin: admin@example.com / admin123
- Doctor: doctor@example.com / doctor123

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state management
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Form Handling**: React Hook Form with Zod validation
- **UI Components**: Radix UI primitives wrapped in custom components

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: JWT token-based authentication with bcrypt password hashing
- **API Design**: RESTful endpoints with middleware-based authentication and authorization

### Database Design
- **Database**: PostgreSQL with Neon serverless hosting
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Connection**: Connection pooling with @neondatabase/serverless

## Key Components

### Authentication System
- JWT-based authentication with role-based access control
- Secure password hashing using bcrypt
- Middleware for protecting routes based on user roles (admin, doctor)
- Token storage in localStorage with automatic refresh handling

### User Management
- Two primary roles: Admin and Doctor
- User registration and login functionality
- Profile management capabilities
- Role-based dashboard views

### Appointment Management
- Calendar view for visualizing appointments
- Appointment booking with conflict detection
- Recurring appointment support (weekly, monthly patterns)
- Status tracking (scheduled, completed, cancelled, no_show)
- Time slot management with staff availability

### Staff Management
- Staff profile creation and management
- Availability scheduling with JSON-based weekly schedules
- Service assignments (many-to-many relationship)
- Role-based staff categorization

### Patient Management
- Patient registration and profile management
- Medical history tracking
- Insurance information storage
- Contact information management

### Service Management
- Service catalog with categories
- Duration and capacity management
- Pricing information
- Staff-service assignments

### Billing System
- Billing record creation and tracking
- Payment status management
- Service allowance tracking for patients

## Data Flow

### Authentication Flow
1. User submits credentials via login form
2. Backend validates credentials and generates JWT token
3. Token stored in localStorage and attached to subsequent requests
4. Middleware validates tokens and populates user context

### Appointment Booking Flow
1. User selects service and staff member
2. System checks availability and capacity constraints
3. Appointment created with conflict detection
4. Calendar updated with new appointment
5. Notifications sent to relevant parties

### Data Synchronization
- React Query handles caching and synchronization of server state
- Optimistic updates for better user experience
- Automatic background refetching for data consistency

## External Dependencies

### Frontend Dependencies
- **React Ecosystem**: React 18, React DOM, React Hook Form
- **UI Framework**: Radix UI components, Tailwind CSS
- **State Management**: TanStack Query
- **Form Validation**: Zod with @hookform/resolvers
- **Date Handling**: date-fns
- **Icons**: Lucide React

### Backend Dependencies
- **Web Framework**: Express.js
- **Database**: Drizzle ORM, @neondatabase/serverless
- **Authentication**: jsonwebtoken, bcrypt
- **Validation**: Zod with drizzle-zod
- **Development**: tsx, esbuild

### Database
- **Provider**: Neon (serverless PostgreSQL)
- **Connection**: WebSocket-based connection pooling
- **Migrations**: Drizzle Kit for schema management

## Deployment Strategy

### Development Environment
- **Frontend**: Vite dev server with HMR
- **Backend**: tsx for TypeScript execution
- **Database**: Neon development database

### Production Build
- **Frontend**: Vite build with static file generation
- **Backend**: esbuild bundling for Node.js deployment
- **Database**: Drizzle migrations for schema deployment

### Build Commands
- `npm run dev`: Start development servers
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run db:push`: Push database schema changes

### Environment Configuration
- Database connection via `DATABASE_URL` environment variable
- JWT secret configuration
- Development vs production environment detection

The application is designed as a monorepo with clear separation between client and server code, shared type definitions, and a comprehensive database schema supporting complex appointment scheduling scenarios.

## Recent Changes
- **2025-07-12**: Fixed authentication system with proper password hashing
- **2025-07-12**: Resolved navigation issues using wouter routing
- **2025-07-12**: Successfully implemented login redirect to dashboard
- **2025-07-12**: Created sample data for users, staff, patients, and services
- **2025-07-12**: Both admin and doctor login credentials working properly