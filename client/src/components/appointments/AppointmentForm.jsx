import { useState, useEffect, useMemo } from 'react';
import { store } from "../../store/index";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

const appointmentSchema = z.object({
  patientId: z.number().min(1, 'Patient is required'),
  serviceId: z.number().min(1, 'Service is required'),
  staffId: z.number().min(1, 'Staff is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  notes: z.string().optional(),
  status: z.enum(['scheduled', 'completed', 'cancelled', 'no_show']).default('scheduled'),
});

export function AppointmentForm({ appointment, onSuccess, onCancel }) {
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(appointmentSchema),
    defaultValues: appointment ? {
      patientId: appointment.patientId,
      serviceId: appointment.serviceId,
      staffId: appointment.staffId,
      startTime: new Date(appointment.startTime).toISOString().slice(0, 16),
      endTime: new Date(appointment.endTime).toISOString().slice(0, 16),
      notes: appointment.notes || '',
      status: appointment.status,
    } : {
      status: 'scheduled',
    },
  });

  const watchedServiceId = watch('serviceId');

  // Fetch data
  const { data: patients } = useQuery({
    queryKey: ['/api/patients'],
  });

  const { data: services } = useQuery({
    queryKey: ['/api/services'],
  });

  // Direct fetch for staff data to bypass any React Query caching issues
  const [staffData, setStaffData] = useState([]);
  const [staffLoading, setStaffLoading] = useState(true);
  const [staffError, setStaffError] = useState(null);

  // Fetch staff data directly
  useEffect(() => {
    const fetchStaffData = async () => {
      debugger;
      try {
        setStaffLoading(true);
        // Get token from the Redux store instead of localStorage
        const token = store.getState().auth.token;
        console.log('Using auth token:', token ? 'Token exists' : 'No token');
        
        const response = await fetch('/api/staff', {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include' // Include credentials for cookies
        });
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Staff data fetched directly:', data);
        
        if (Array.isArray(data)) {
          console.log(`Found ${data.length} staff members`);
          setStaffData(data);
        } else {
          console.warn('Staff data is not an array:', data);
          setStaffData([]);
        }
      } catch (error) {
        console.error('Error fetching staff:', error);
        setStaffError(error);
      } finally {
        setStaffLoading(false);
      }
    };
    
    fetchStaffData();
  }, []);
  
  // Use the directly fetched staff data
  const staff = useMemo(() => {
    console.log('Processing staff data for dropdown:', staffData);
    return staffData;
  }, [staffData]);


  // Create/Update appointment mutation
  const saveAppointmentMutation = useMutation({
    mutationFn: async (data) => {
      const url = appointment ? `/api/appointments/${appointment.id}` : '/api/appointments';
      const method = appointment ? 'PUT' : 'POST';
      
      const response = await apiRequest(method, url, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: appointment ? 'Appointment updated successfully' : 'Appointment created successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save appointment',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data) => {
    saveAppointmentMutation.mutate(data);
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>
          {appointment ? 'Edit Appointment' : 'New Appointment'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="patientId">Patient</Label>
              <Select
                value={watch('patientId')?.toString()}
                onValueChange={(value) => setValue('patientId', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients?.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id.toString()}>
                      {patient.firstName} {patient.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.patientId && (
                <p className="text-sm text-red-500">{errors.patientId.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="serviceId">Service</Label>
              <Select
                value={watch('serviceId')?.toString()}
                onValueChange={(value) => {
                  const serviceId = parseInt(value);
                  setValue('serviceId', serviceId);
                  setSelectedServiceId(serviceId);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent>
                  {services?.map((service) => (
                    <SelectItem key={service.id} value={service.id.toString()}>
                      {service.name} ({service.duration} min)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.serviceId && (
                <p className="text-sm text-red-500">{errors.serviceId.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="staffId">Staff</Label>
            <Select
              value={watch('staffId') ? watch('staffId').toString() : ''}
              onValueChange={(value) => {
                console.log('Staff selected:', value);
                setValue('staffId', parseInt(value, 10));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select staff member" />
              </SelectTrigger>
              <SelectContent>
                {console.log('Rendering staff dropdown with data:', staff)}
                {/* Always render a default option */}
                <SelectItem value="" disabled>
                  {staffLoading ? 'Loading staff...' : 'Select a staff member'}
                </SelectItem>
                
                {/* Map through staff if available */}
                {Array.isArray(staff) && staff.length > 0 ? (
                  staff.map((staffMember) => (
                    <SelectItem key={staffMember.id} value={staffMember.id.toString()}>
                      {staffMember.firstName} {staffMember.lastName} ({staffMember.role})
                    </SelectItem>
                  ))
                ) : !staffLoading ? (
                  <SelectItem value="no-staff" disabled>
                    No staff members available
                  </SelectItem>
                ) : null}
              </SelectContent>
            </Select>
            {errors.staffId && (
              <p className="text-sm text-red-500">{errors.staffId.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="datetime-local"
                {...register('startTime')}
              />
              {errors.startTime && (
                <p className="text-sm text-red-500">{errors.startTime.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="datetime-local"
                {...register('endTime')}
              />
              {errors.endTime && (
                <p className="text-sm text-red-500">{errors.endTime.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              value={watch('status')}
              onValueChange={(value) => setValue('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="no_show">No Show</SelectItem>
              </SelectContent>
            </Select>
            {errors.status && (
              <p className="text-sm text-red-500">{errors.status.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes for the appointment"
              {...register('notes')}
            />
          </div>

          <div className="flex justify-end space-x-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={saveAppointmentMutation.isPending}
            >
              {saveAppointmentMutation.isPending
                ? 'Saving...'
                : appointment
                ? 'Update Appointment'
                : 'Create Appointment'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
