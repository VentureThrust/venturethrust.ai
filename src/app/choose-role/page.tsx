'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Users, FileText, Lock, FileSignature, BarChart2, Shield, Sparkles, Folder, Mail, EyeOff, FolderLock, FileCheck, FileSearch, HelpCircle, Video, TrendingUp, Paintbrush, FileUp, LockKeyhole, FileStack, ShieldCheck, List, FileKey2, GanttChartSquare, Bot, Milestone, Files, CalendarClock, ListTodo, ClipboardCheck, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

const plans: any[] = [];

export default function PricingPage() {
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('annually');

  const handlePlanSelection = (planName: string) => {
    // In a real app, you would handle the subscription logic here
    console.log('Selected plan:', planName, 'Cycle:', billingCycle);
    // Then navigate to the dashboard or next onboarding step
    router.push('/dashboard');
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center bg-background p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-7xl">
        <header className="text-center my-10">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            There's a plan for everyone
          </h1>
          <div className="mt-6 flex justify-center items-center gap-4">
            <RadioGroup
              defaultValue="annually"
              onValueChange={(value) => setBillingCycle(value as 'monthly' | 'annually')}
              className="flex items-center space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="monthly" id="monthly" />
                <Label htmlFor="monthly">Billed monthly</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="annually" id="annually" />
                <Label htmlFor="annually">Billed annually <span className="text-accent">(Save up to 40%)</span></Label>
              </div>
            </RadioGroup>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={cn(
                'flex flex-col relative border rounded-lg',
                plan.popular ? 'border-primary shadow-lg' : 'border-border shadow-sm'
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-blue-100 text-primary px-3 py-1 text-xs font-semibold">
                  ~ Most Popular
                </div>
              )}
              <CardHeader className="pt-10">
                <CardTitle className="text-xl font-semibold">
                  {plan.name}
                </CardTitle>
                <p className="text-muted-foreground text-sm h-10">{plan.description}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold tracking-tight">{plan.price[billingCycle]}</span>
                   { plan.name !== 'Advanced' && plan.name !== 'Advanced Data Rooms' && <span className="text-muted-foreground text-sm">/user/month</span>}
                   { (plan.name === 'Advanced' || plan.name === 'Advanced Data Rooms') && <span className="text-muted-foreground text-sm">/month</span>}
                </div>
              </CardHeader>
              <CardContent className="flex-1 mt-4">
                <Button
                  className="w-full bg-foreground text-background hover:bg-foreground/90"
                  size="lg"
                  onClick={() => handlePlanSelection(plan.name)}
                  suppressHydrationWarning
                >
                  {plan.buttonText}
                </Button>
                <p className='font-semibold text-sm mt-6 mb-4'>{plan.features[0].text ? 'Key Features:' : 'All Personal features, plus:'}</p>
                { plan.name === 'Personal' && <p className='font-semibold text-sm mt-6 mb-4'>Key Features:</p> }
                { plan.name !== 'Personal' && <p className='font-semibold text-sm mt-6 mb-4'>All {plan.name === 'Standard' ? 'Personal' : (plan.name === 'Advanced' ? 'Standard' : 'Advanced')} features, plus:</p>}
                
                <ul className="space-y-4 text-sm">
                  {plan.features.map((feature: any, index: number) => {
                     if (feature.text.startsWith('All ')) return null;
                     return (
                        <li key={index} className="flex items-start gap-3">
                          {feature.icon && (
                            <feature.icon className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                          )}
                          <span>{feature.text}</span>
                        </li>
                     )
                  })}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
        <footer className='text-center mt-12'>
            <p className='text-xs text-muted-foreground'>Relevant taxes will be automatically included for jurisdictions where Dropbox Inc. and Dropbox International are registered. For more information, visit our <a href="#" className="underline">Help Center</a>.</p>
        </footer>
      </div>
    </div>
  );
}
