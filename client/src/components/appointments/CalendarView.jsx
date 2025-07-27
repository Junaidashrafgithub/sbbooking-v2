import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { authService } from '@/lib/authService';

export function CalendarView({ selectedDate, onDateSelect }) {
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(selectedDate));

  const { data } = useQuery({
    queryKey: ['/api/appointments', 'week', currentWeek.toISOString()],
    queryFn: async () => {
      const startDate = currentWeek.toISOString();
      const endDate = addDays(currentWeek, 6).toISOString();
      const response = await fetch(`/api/appointments?startDate=${startDate}&endDate=${endDate}`, {
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
        },
      });
      return response.json();
    },
  });
  
  // Ensure appointments is always an array
  const appointments = Array.isArray(data?.appointments) ? data?.appointments : 
                      (Array.isArray(data) ? data : []);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i));

  const getAppointmentsForDay = (date) => {
    if (!appointments || !Array.isArray(appointments)) return [];
    return appointments.filter(apt => 
      apt && apt.startTime && isSameDay(new Date(apt.startTime), date)
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'no_show':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Weekly Schedule</CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentWeek(addDays(currentWeek, -7))}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Button>
            <span className="text-sm font-medium">
              {format(currentWeek, 'MMM dd')} - {format(addDays(currentWeek, 6), 'MMM dd, yyyy')}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentWeek(addDays(currentWeek, 7))}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map(day => {
            const dayAppointments = getAppointmentsForDay(day);
            const isSelected = isSameDay(day, selectedDate);
            const isToday = isSameDay(day, new Date());
            
            return (
              <div
                key={day.toISOString()}
                className={`
                  min-h-[120px] p-2 border rounded-lg cursor-pointer transition-colors
                  ${isSelected ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}
                  ${isToday ? 'ring-2 ring-blue-400' : ''}
                  hover:bg-gray-50
                `}
                onClick={() => onDateSelect(day)}
              >
                <div className="text-sm font-medium text-gray-900 mb-1">
                  {format(day, 'd')}
                </div>
                <div className="space-y-1">
                  {dayAppointments.slice(0, 3).map(appointment => (
                    <div
                      key={appointment.id}
                      className="text-xs p-1 rounded truncate bg-blue-100 text-blue-800"
                    >
                      {format(new Date(appointment.startTime), 'HH:mm')}
                      {appointment.patient && (
                        <span className="block truncate">
                          {appointment.patient.firstName} {appointment.patient.lastName}
                        </span>
                      )}
                    </div>
                  ))}
                  {dayAppointments.length > 3 && (
                    <div className="text-xs text-gray-500">
                      +{dayAppointments.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
