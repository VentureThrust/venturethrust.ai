'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Star, Folder, FolderOpen, FolderPlus, Database, CheckCircle, Search, FileSearch } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Logo } from '@/components/layout/logo';

const vdrPlans: any[] = [];
const aiPlans: any[] = [];
const comboPlans: any[] = [];


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
                  <p className="text-sm text-muted-foreground">billed annually (${plan.price.annually}/month)</p>
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
            <Tabs defaultValue="vdr">
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
