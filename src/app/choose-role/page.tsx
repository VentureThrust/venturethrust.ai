'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, FileCog } from 'lucide-react';
import { cn } from '@/lib/utils';

const plans = [
  {
    name: 'Free',
    price: '$0',
    priceDescription: 'For investors and startups getting started.',
    features: [
      'Access shared data rooms',
      'Basic analytics',
    ],
    buttonText: 'Get Started',
    variant: 'outline' as const,
  },
  {
    name: 'Pro',
    price: '$49/mo',
    priceDescription: 'Billed annually',
    features: [
      'Create and share unlimited data rooms',
      'Advanced analytics',
      'Invite and manage investors',
      'Email support',
    ],
    buttonText: 'Choose Pro',
    popular: true,
    variant: 'default' as const,
  },
  {
    name: 'Pro + AI Due Diligence',
    price: '$79/mo',
    priceDescription: 'Billed annually',
    features: [
      'All Pro plan features',
      'AI-powered document analysis',
      'Identify risks and red flags',
      'Priority support',
    ],
    buttonText: 'Choose Pro+AI',
    variant: 'default' as const,
    featured: true,
  },
];

export default function PricingPage() {
  const router = useRouter();

  const handlePlanSelection = (planName: string) => {
    // In a real app, you would handle the subscription logic here
    console.log('Selected plan:', planName);
    // Then navigate to the dashboard or next onboarding step
    // router.push('/dashboard');
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-6xl">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Choose the plan that's right for you.
          </h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={cn(
                'flex flex-col relative',
                plan.featured ? 'border-primary shadow-lg' : ''
              )}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-yellow-400 px-4 py-1 text-sm font-semibold text-yellow-900 shadow-md">
                  MOST POPULAR
                </div>
              )}
               {plan.name === 'Free' && (
                <div className="absolute -top-4 left-8 rounded-full bg-gray-200 px-4 py-1 text-sm font-semibold text-gray-700 shadow-md">
                  FREE
                </div>
              )}
              <CardHeader className="pt-10">
                <CardTitle className="flex items-center gap-3 text-2xl font-semibold">
                  {plan.featured && <FileCog className="h-8 w-8 text-primary" />}
                  {plan.name}
                </CardTitle>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold tracking-tight">{plan.price}</span>
                </div>
                <CardDescription>{plan.priceDescription}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="h-5 w-5 flex-shrink-0 text-green-500 mt-1" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  variant={plan.variant}
                  size="lg"
                  onClick={() => handlePlanSelection(plan.name)}
                >
                  {plan.buttonText}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
