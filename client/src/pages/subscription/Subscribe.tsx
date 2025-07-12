import { useState } from 'react';
import { Link } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Star, Crown, CreditCard, Calendar, Users, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';

const pricingPlans = [
  {
    id: 'basic',
    name: 'Basic Plan',
    price: 29.99,
    period: 'month',
    description: 'Perfect for small practices',
    features: [
      'Up to 5 staff members',
      'Basic appointment scheduling',
      'Patient management',
      'Email notifications',
      'Basic reporting',
      'Customer support'
    ],
    popular: false
  },
  {
    id: 'professional',
    name: 'Professional Plan',
    price: 59.99,
    period: 'month',
    description: 'For growing practices',
    features: [
      'Up to 20 staff members',
      'Advanced scheduling with recurring appointments',
      'Patient management with medical history',
      'SMS & Email notifications',
      'Advanced reporting and analytics',
      'Priority customer support',
      'Custom service categories',
      'Staff availability management'
    ],
    popular: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise Plan',
    price: 99.99,
    period: 'month',
    description: 'For large healthcare organizations',
    features: [
      'Unlimited staff members',
      'Full appointment scheduling suite',
      'Complete patient management',
      'Advanced billing and invoicing',
      'Custom integrations',
      'White-label solution',
      'Dedicated account manager',
      'Advanced analytics and reporting',
      'API access'
    ],
    popular: false
  }
];

export default function Subscribe() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<string>('professional');
  const [isLoading, setIsLoading] = useState(false);

  const handleGetStarted = (planId: string) => {
    setSelectedPlan(planId);
    toast({
      title: "Getting Started",
      description: "To complete your subscription, you'll need to create an account and login.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Calendar className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">SBBookings</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="outline">Sign In</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Professional Appointment Scheduling
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Transform your practice with SBBookings - the complete appointment scheduling system 
            designed for healthcare professionals. Manage appointments, staff, and patients with ease.
          </p>
          <div className="flex flex-wrap justify-center gap-8 mb-12">
            <div className="flex items-center gap-2">
              <Calendar className="h-6 w-6 text-blue-600" />
              <span className="text-lg text-gray-700">Smart Scheduling</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-6 w-6 text-blue-600" />
              <span className="text-lg text-gray-700">Staff Management</span>
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-blue-600" />
              <span className="text-lg text-gray-700">Advanced Analytics</span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Choose Your Plan
            </h2>
            <p className="text-lg text-gray-600">
              Start managing your practice today. All plans include a 30-day free trial.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan) => (
              <Card key={plan.id} className={`relative ${plan.popular ? 'border-blue-500 border-2 shadow-lg' : ''} bg-white`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-500 text-white px-4 py-1 flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                    <span className="text-gray-600 text-lg">/{plan.period}</span>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    onClick={() => handleGetStarted(plan.id)}
                    className={`w-full ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                    variant={plan.popular ? 'default' : 'outline'}
                    disabled={isLoading}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything You Need to Manage Your Practice
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              SBBookings provides all the tools you need to streamline your healthcare practice
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Smart Scheduling</h3>
              <p className="text-gray-600">Intelligent appointment booking with conflict detection and automated reminders</p>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Staff Management</h3>
              <p className="text-gray-600">Manage your team, assign services, and track availability effortlessly</p>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Advanced Analytics</h3>
              <p className="text-gray-600">Detailed reports and insights to help grow your practice</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Calendar className="h-6 w-6" />
            <span className="text-xl font-semibold">SBBookings</span>
          </div>
          <p className="text-gray-400 mb-6">
            Professional appointment scheduling for healthcare providers
          </p>
          <div className="flex justify-center gap-8">
            <Link href="/login">
              <span className="text-gray-400 hover:text-white cursor-pointer">Sign In</span>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}