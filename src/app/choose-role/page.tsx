'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Users, FileText, Lock, FileSignature, BarChart2, Shield, Sparkles, Folder, Mail, EyeOff, FolderLock, FileCheck, FileSearch, HelpCircle, Video, TrendingUp, Paintbrush, FileUp, LockKeyhole, FileStack, ShieldCheck, List, FileKey2, GanttChartSquare, Bot, Milestone, Files, CalendarClock, ListTodo, ClipboardCheck, Zap, Settings, BarChart, File, VideoIcon, Link as LinkIcon, Edit, FilePlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

const plans = [
    {
        name: 'Personal',
        description: 'For secure sharing',
        price: { monthly: '$15', annually: '$10' },
        buttonText: 'Select Plan',
        featuresHeader: 'Key Features:',
        features: [
            { icon: User, text: '1 user included' },
            { icon: Settings, text: 'Basic sharing controls' },
            { icon: BarChart, text: 'Document level analytics' },
            { icon: Edit, text: '4 eSignatures per month' },
            { icon: Users, text: 'Unlimited visitors' },
        ],
    },
    {
        name: 'Standard',
        description: 'For multi-file secure sharing',
        price: { monthly: '$60', annually: '$45' },
        buttonText: 'Select Plan',
        popular: true,
        featuresHeader: 'All Personal features, plus:',
        features: [
            { icon: User, text: '1 user included' },
            { icon: Files, text: 'Multi-file sharing' },
            { icon: VideoIcon, text: 'Video and rich media analytics' },
            { icon: FileUp, text: 'File requests' },
            { icon: Paintbrush, text: 'Customizable branding' },
            { icon: Edit, text: 'Unlimited eSignature' },
        ],
    },
    {
        name: 'Advanced',
        description: 'For advanced security',
        price: { monthly: '$200', annually: '$150' },
        buttonText: 'Select Plan',
        featuresHeader: 'All Standard features, plus:',
        features: [
            { icon: Users, text: '3 users included' },
            { icon: Folder, text: 'Lightweight data rooms (Spaces)' },
            { icon: Mail, text: 'Email authentication for visitors' },
            { icon: EyeOff, text: 'Allow/block visitors lists' },
            { icon: FolderLock, text: 'Folder and file level security' },
            { icon: Shield, text: 'Dynamic watermarking' },
            { icon: FileKey2, text: 'NDAs and gating agreements' },
        ],
    },
    {
        name: 'Advanced Data Rooms',
        description: 'For complete deal control',
        price: { monthly: '$240', annually: '$180' },
        buttonText: 'Select Plan',
        featuresHeader: 'All Advanced features, plus:',
        features: [
            { icon: Users, text: '3 users included' },
            { icon: Folder, text: 'Enhanced data rooms (Spaces)' },
            { icon: UserCheck, text: 'Group visitor permissions' },
            { icon: List, text: 'Data room audit log' },
            { icon: FileSearch, text: 'Automatic file indexing' },
            { icon: BarChart2, text: 'Data room analytics' },
            { icon: HelpCircle, text: 'Priority email support' },
            { icon: Zap, text: '2X capacity per data room' },
        ],
    },
];

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
                <Label htmlFor="annually">Billed annually <span className="text-muted-foreground">(Save up to 40%)</span></Label>
              </div>
            </RadioGroup>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={cn(
                'flex flex-col relative border rounded-lg bg-card',
                plan.popular ? 'border-primary' : 'border-border'
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-blue-100 text-primary px-3 py-1 text-xs font-semibold">
                  ~ Most Popular
                </div>
              )}
              <CardHeader className="pt-10">
                <CardTitle className="text-xl font-bold">
                  {plan.name}
                </CardTitle>
                <p className="text-muted-foreground text-sm h-5">{plan.description}</p>
                <div className="flex items-baseline gap-1 pt-4">
                  <span className="text-3xl font-bold tracking-tight">{plan.price[billingCycle]}</span>
                   { (plan.name === 'Personal' || plan.name === 'Standard') && <span className="text-muted-foreground text-sm">/user/month</span>}
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
                
                <p className='font-semibold text-sm mt-6 mb-4'>{plan.featuresHeader}</p>
                
                <ul className="space-y-4 text-sm">
                  {plan.features.map((feature: any, index: number) => {
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
      </div>
    </div>
  );
}
