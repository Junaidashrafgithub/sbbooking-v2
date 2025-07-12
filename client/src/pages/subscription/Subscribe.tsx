import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Star, Crown, CreditCard } from 'lucide-react';
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

  const { data: subscriptionStatus } = useQuery({
    queryKey: ['/api/subscription/status'],
    enabled: !!user && user.role === 'doctor'
  });

  const subscribeMutation = useMutation({
    mutationFn: async (planId: string) => {
      const response = await apiRequest('POST', '/api/subscription/create', { planId });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.clientSecret) {
        // In a real implementation, this would redirect to Stripe Checkout
        toast({
          title: "Subscription Created",
          description: "Redirecting to payment page...",
        });
        // Simulate payment success for demo
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ['/api/subscription/status'] });
          toast({
            title: "Payment Successful!",
            description: "Your subscription is now active. Welcome to the platform!",
          });
        }, 2000);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Subscription Error",
        description: error.message || "Failed to create subscription",
        variant: "destructive",
      });
    }
  });

  const handleSubscribe = async (planId: string) => {
    if (!user || user.role !== 'doctor') {
      toast({
        title: "Access Denied",
        description: "Only doctors can subscribe to plans",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await subscribeMutation.mutateAsync(planId);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Login Required</CardTitle>
            <CardDescription>
              Please log in to view subscription options
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (user.role !== 'doctor') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Doctor Account Required</CardTitle>
            <CardDescription>
              Only doctors can subscribe to our appointment scheduling platform
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (subscriptionStatus?.status === 'active') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-6 w-6 text-yellow-500" />
              Active Subscription
            </CardTitle>
            <CardDescription>
              Your subscription is active and ready to use
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Plan:</strong> {subscriptionStatus.planName}</p>
              <p><strong>Status:</strong> <Badge variant="secondary">Active</Badge></p>
              <p><strong>Next Billing:</strong> {new Date(subscriptionStatus.nextBilling).toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600">
            Start managing your practice with our comprehensive appointment scheduling system
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pricingPlans.map((plan) => (
            <Card key={plan.id} className={`relative ${plan.popular ? 'border-blue-500 border-2' : ''}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-500 text-white px-3 py-1 flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  <span className="text-gray-600">/{plan.period}</span>
                </div>
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className="w-full" 
                  variant={plan.popular ? "default" : "outline"}
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={isLoading || subscribeMutation.isPending}
                >
                  {isLoading || subscribeMutation.isPending ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Subscribe Now
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">
            All plans include a 14-day free trial. No credit card required.
          </p>
          <p className="text-sm text-gray-500">
            Need help choosing? Contact our sales team for personalized recommendations.
          </p>
        </div>
      </div>
    </div>
  );
}