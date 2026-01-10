'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, User, Users, FileText, Lock, FileSignature, BarChart2, Zap, Shield, Sparkles, Folder, Mail, EyeOff, FolderLock, FileCheck, FileSearch, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

const plans = [
  {
    name: 'Free',
    price: { monthly: '$0', annually: '$0' },
    description: 'For secure sharing.',
    features: [
      { icon: User, text: '1 user included' },
      { icon: Lock, text: 'Basic sharing controls' },
      { icon: BarChart2, text: 'Document level analytics' },
      { icon: Users, text: 'Unlimited visitors' },
    ],
    buttonText: 'Get Started',
    variant: 'outline' as const,
  },
  {
    name: 'Pro',
    price: { monthly: '$49', annually: '$45' },
    description: 'For multi-file secure sharing.',
    features: [
      { text: 'All Free features, plus:' },
      { icon: Folder, text: 'Create & share unlimited data rooms' },
      { icon: FileText, text: 'Advanced analytics' },
      { icon: Mail, text: 'Invite and manage investors' },
      { icon: HelpCircle, text: 'Email support' },
    ],
    buttonText: 'Choose Pro',
    popular: true,
    variant: 'default' as const,
  },
  {
    name: 'Pro + AI',
    price: { monthly: '$79', annually: '$70' },
    description: 'For advanced security & insights.',
    features: [
        { text: 'All Pro features, plus:' },
        { icon: Sparkles, text: 'AI-powered document analysis' },
        { icon: FileSearch, text: 'Identify risks and red flags' },
        { icon: Shield, text: 'Priority support' },
    ],
    buttonText: 'Choose Pro+AI',
    variant: 'default' as const,
    featured: true,
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('annually');

  const handlePlanSelection = (planName: string) => {
    // In a real app, you would handle the subscription logic here
    console.log('Selected plan:', planName, 'Cycle:', billingCycle);
    // Then navigate to the dashboard or next onboarding step
    // router.push('/dashboard');
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-6xl">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            There's a plan for everyone
          </h1>
          <div className="mt-6 flex justify-center items-center gap-4">
            <Label htmlFor="billing-cycle" className={cn(billingCycle === 'monthly' ? 'text-foreground' : 'text-muted-foreground')}>
              Billed monthly
            </Label>
            <Switch
              id="billing-cycle"
              checked={billingCycle === 'annually'}
              onCheckedChange={(checked) => setBillingCycle(checked ? 'annually' : 'monthly')}
              aria-label="Toggle billing cycle"
            />
            <Label htmlFor="billing-cycle" className={cn(billingCycle === 'annually' ? 'text-foreground' : 'text-muted-foreground')}>
              Billed annually <span className="text-accent">(Save up to 10%)</span>
            </Label>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={cn(
                'flex flex-col relative border-2',
                plan.featured ? 'border-primary' : 'border-border',
                plan.popular ? 'shadow-lg' : 'shadow-sm'
              )}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-sm font-semibold text-primary-foreground shadow-md">
                  Most Popular
                </div>
              )}
              <CardHeader className="pt-10">
                <CardTitle className="text-2xl font-semibold">
                  {plan.name}
                </CardTitle>
                <p className="text-muted-foreground h-10">{plan.description}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tight">{plan.price[billingCycle]}</span>
                  <span className="text-muted-foreground">/user/month</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <Button
                  className="w-full"
                  variant={plan.variant}
                  size="lg"
                  onClick={() => handlePlanSelection(plan.name)}
                >
                  {plan.buttonText}
                </Button>
                <p className='font-semibold mt-6 mb-4'>Key Features:</p>
                <ul className="space-y-4">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      {feature.icon ? (
                        <feature.icon className="h-5 w-5 flex-shrink-0 text-muted-foreground mt-1" />
                      ) : (
                        <div className='w-5 h-5 flex-shrink-0'></div>
                      )}
                      <span className={cn("text-sm", feature.icon ? 'text-foreground' : 'text-muted-foreground font-semibold')}>{feature.text}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
