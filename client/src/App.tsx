import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "./hooks/useAuth";
import { AppLayout } from "./components/layout/AppLayout";
import NotFound from "@/pages/not-found";
import Login from "./pages/auth/Login";
import Dashboard from "./pages/dashboard/Dashboard";
import Appointments from "./pages/appointments/Appointments";
import Staff from "./pages/staff/Staff";
import Patients from "./pages/patients/Patients";
import Services from "./pages/services/Services";
import Reports from "./pages/reports/Reports";
import Subscribe from "./pages/subscription/Subscribe";
import DoctorManagement from "./pages/admin/DoctorManagement";

function ProtectedRoute({ component: Component, ...props }: any) {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }
  
  return (
    <AppLayout>
      <Component {...props} />
    </AppLayout>
  );
}

function Router() {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/" component={() => isAuthenticated ? <Redirect to="/dashboard" /> : <Redirect to="/login" />} />
      <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/appointments" component={() => <ProtectedRoute component={Appointments} />} />
      <Route path="/staff" component={() => <ProtectedRoute component={Staff} />} />
      <Route path="/patients" component={() => <ProtectedRoute component={Patients} />} />
      <Route path="/services" component={() => <ProtectedRoute component={Services} />} />
      <Route path="/reports" component={() => <ProtectedRoute component={Reports} />} />
      <Route path="/subscribe" component={() => <ProtectedRoute component={Subscribe} />} />
      <Route path="/admin/doctors" component={() => <ProtectedRoute component={DoctorManagement} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
