'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building, Briefcase } from 'lucide-react';

export default function ChooseRolePage() {
  const router = useRouter();

  const handleRoleSelection = (role: 'founder' | 'investor') => {
    // In a real app, you would save this to the user's profile
    console.log('Selected role:', role);
    // Then navigate to the onboarding chatbot or dashboard
    // router.push('/onboarding');
  };

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl">One last step!</CardTitle>
          <CardDescription className="text-base">
            To help us tailor your experience, please tell us who you are.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row">
          <Button
            variant="outline"
            className="h-auto w-full flex-col gap-4 p-6 text-base"
            onClick={() => handleRoleSelection('founder')}
          >
            <Building className="h-10 w-10 text-primary" />
            <span>I am a Founder</span>
            <p className="text-xs font-normal text-muted-foreground">
              I am seeking funding and want to build a data room for investors.
            </p>
          </Button>
          <Button
            variant="outline"
            className="h-auto w-full flex-col gap-4 p-6 text-base"
            onClick={() => handleRoleSelection('investor')}
          >
            <Briefcase className="h-10 w-10 text-primary" />
            <span>I am an Investor</span>
            <p className="text-xs font-normal text-muted-foreground">
              I want to review startups and manage my deal flow.
            </p>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
