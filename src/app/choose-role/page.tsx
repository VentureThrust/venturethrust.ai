'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Star, Folder, FolderOpen, FolderPlus, Database, CheckCircle, Search, FileSearch, Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Logo } from '@/components/layout/logo';

const vdrPlans = [
  {
    name: 'Basic VDR',
    description: 'For early-stage startups',
    price: { monthly: '$25', annually: '20' },
    icon: Folder,
    features: [
      { text: '1 Secure Data Room' },
      { text: '5 GB Storage' },
      { text: 'Basic Document Analytics' },
      { text: 'Standard Support' },
    ],
    buttonText: 'Choose Basic VDR',
  },
  {
    name: 'Pro VDR',
    description: 'For growing companies',
    price: { monthly: '$75', annually: '60' },
    icon: FolderOpen,
    primary: true,
    popular: true,
    features: [
      { text: '5 Secure Data Rooms' },
      { text: '25 GB Storage' },
      { text: 'Advanced Document Analytics' },
      { text: 'Priority Support' },
      { text: 'User-level Permissions' },
    ],
    buttonText: 'Choose Pro VDR',
  },
  {
    name: 'Enterprise VDR',
    description: 'For large-scale operations',
    price: { monthly: 'Custom', annually: 'Custom' },
    icon: FolderPlus,
    features: [
      { text: 'Unlimited Data Rooms' },
      { text: 'Unlimited Storage' },
      { text: 'Full Audit Logs' },
      { text: 'Dedicated Account Manager' },
      { text: 'API Access' },
    ],
    buttonText: 'Contact Sales',
  },
];

const aiPlans = [
  {
    name: 'AI Essentials',
    description: 'For individual investors',
    price: { monthly: '$49', annually: '40' },
    icon: Search,
    features: [
      { text: '5 AI Risk Scans / month' },
      { text: 'Standard Red Flag Detection' },
      { text: 'Email & Chat Support' },
      { text: 'Limited to 1 User' },
    ],
    buttonText: 'Choose AI Essentials',
  },
  {
    name: 'AI Professional',
    description: 'For venture capitalists',
    price: { monthly: '$149', annually: '120' },
    icon: FileSearch,
    primary: true,
    popular: true,
    features: [
      { text: '50 AI Risk Scans / month' },
      { text: 'Advanced Red Flag Detection' },
      { text: 'In-depth Clause Analysis' },
      { text: 'Priority Support' },
      { text: 'Up to 5 Users' },
    ],
    buttonText: 'Choose AI Professional',
  },
  {
    name: 'AI for Teams',
    description: 'For investment firms',
    price: { monthly: 'Custom', annually: 'Custom' },
    icon: Cpu,
    features: [
      { text: 'Unlimited AI Risk Scans' },
      { text: 'Customizable AI Models' },
      { text: 'Team Collaboration Features' },
      { text: 'Dedicated AI Specialist' },
      { text: 'Full API Access' },
    ],
    buttonText: 'Contact Sales',
  },
];

const comboPlans = [
  {
    name: 'Starter Combo',
    description: 'Best for new ventures',
    price: { monthly: '$65', annually: '55' },
    icon: Folder,
    badge: 'Save 15%',
    features: [
      { text: 'Includes Basic VDR plan' },
      { text: 'Includes AI Essentials plan' },
      { text: '10 GB Shared Storage' },
      { text: 'Unified Dashboard' },
    ],
    buttonText: 'Choose Starter Combo',
  },
  {
    name: 'Growth Combo',
    description: 'The complete solution',
    price: { monthly: '$199', annually: '160' },
    icon: Database,
    primary: true,
    bestValue: true,
    features: [
      { text: 'Includes Pro VDR plan' },
      { text: 'Includes AI Professional plan' },
      { text: '50 GB Shared Storage' },
      { text: 'Advanced Integrations' },
      { text: 'Dedicated Onboarding' },
    ],
    buttonText: 'Choose Growth Combo',
  },
  {
    name: 'Full Platform',
    description: 'For maximum impact',
    price: { monthly: 'Custom', annually: 'Custom' },
    icon: Check,
    features: [
      { text: 'Includes Enterprise VDR plan' },
      { text: 'Includes AI for Teams plan' },
      { text: 'Custom Storage Solutions' },
      { text: 'White-glove Service' },
      { text: 'Custom SLAs' },
    ],
    buttonText: 'Contact Sales',
  },
];


const PlanCard = ({ plan }: { plan: any }) => {
    const router = useRouter();
    const handlePlanSelection = (planName: string) => {
        console.log('Selected plan:', planName);
        router.push('/dashboard');
      };

    return (
        <Card className={cn(
            'flex flex-col relative rounded-xl shadow-lg border w-[360px]',
            plan.primary ? 'border-primary/50 bg-card' : 'border-border bg-card/60'
        )}>
             {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-yellow-100 text-yellow-800 px-4 py-1 text-sm font-semibold flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-yellow-600" /> Most Popular
                </div>
              )}
               {plan.bestValue && (
                <div className="absolute -top-3 right-6 rounded-full bg-primary text-primary-foreground px-4 py-1 text-sm font-semibold shadow-md">
                  BEST VALUE
                </div>
              )}
               {plan.badge && (
                 <div className="absolute top-4 right-4 rounded-md bg-gray-200 text-gray-600 px-3 py-1 text-xs font-semibold">
                    {plan.badge}
                 </div>
              )}

            <CardHeader className="pt-8">
                 <div className="flex items-center gap-3">
                    <plan.icon className={cn("w-8 h-8", plan.primary ? 'text-primary' : 'text-muted-foreground')} />
                    <div>
                        <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                        {plan.description && <p className="text-muted-foreground">{plan.description}</p>}
                    </div>
                </div>

                <div className="pt-4">
                  <span className="text-4xl font-extrabold">{plan.price.monthly}</span>
                  <span className="text-muted-foreground">/mo</span>
                  {plan.price.annually !== 'Custom' && <p className="text-sm text-muted-foreground">billed annually (${plan.price.annually}/month)</p>}
                </div>
            </CardHeader>
            <CardContent className="flex-1">
                <div className='mt-6'>
                    <p className="font-semibold mb-4">Key Features:</p>
                    <ul className="space-y-3 text-sm">
                    {plan.features.map((feature: any, index: number) => (
                        <li key={index} className="flex items-start gap-3">
                         {feature.included === false ? <Database className="h-5 w-5 flex-shrink-0 text-muted-foreground" /> : <CheckCircle className="h-5 w-5 flex-shrink-0 text-primary" />}
                          <span>{feature.text}</span>
                        </li>
                    ))}
                    </ul>
                </div>
            </CardContent>
            <CardFooter>
            <Button
                    className={cn("w-full text-lg h-12", plan.primary ? 'bg-primary hover:bg-primary/90' : 'bg-primary/80 hover:bg-primary/90')}
                    onClick={() => handlePlanSelection(plan.name)}
                 >
                    {plan.buttonText}
                 </Button>
            </CardFooter>
        </Card>
    )
}

export default function PricingPage() {

  return (
    <div className="flex min-h-screen w-full flex-col items-center bg-background p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-7xl">
        <header className="flex flex-col items-center justify-center my-10 space-y-8">
            <Logo isPen={true} />
            <Tabs defaultValue="combo">
                <TabsList className="grid grid-cols-3 gap-2 bg-muted p-1.5 rounded-lg">
                    <TabsTrigger value="vdr" className="text-base px-6">VDR Plans</TabsTrigger>
                    <TabsTrigger value="ai" className="text-base px-6">AI Due Diligence Plans</TabsTrigger>
                    <TabsTrigger value="combo" className="text-base px-6">Combo Plans</TabsTrigger>
                </TabsList>
                 <TabsContent value="vdr" className="mt-12">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 justify-center">
                        {vdrPlans.map((plan) => (
                            <PlanCard key={plan.name} plan={plan} />
                        ))}
                    </div>
                 </TabsContent>
                 <TabsContent value="ai" className="mt-12">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 justify-center">
                        {aiPlans.map((plan) => (
                            <PlanCard key={plan.name} plan={plan} />
                        ))}
                    </div>
                 </TabsContent>
                 <TabsContent value="combo" className="mt-12">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 justify-center">
                        {comboPlans.map((plan) => (
                            <PlanCard key={plan.name} plan={plan} />
                        ))}
                    </div>
                 </TabsContent>
            </Tabs>
        </header>
      </div>
    </div>
  );
}
