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
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl text-center">
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl">One last step!</CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            To help us tailor your experience, please tell us who you are.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-stretch gap-4 sm:flex-row">
            <Button
              variant="outline"
              className="flex h-auto w-full flex-1 flex-col justify-start gap-4 p-6 text-left"
              onClick={() => handleRoleSelection('founder')}
            >
              <Building className="h-10 w-10 text-primary" />
              <div className="text-base font-semibold">I am a Founder</div>
              <p className="text-sm font-normal text-muted-foreground">
                I am seeking funding and want to build a data room for investors.
              </p>
            </Button>
            <Button
              variant="outline"
              className="flex h-auto w-full flex-1 flex-col justify-start gap-4 p-6 text-left"
              onClick={() => handleRoleSelection('investor')}
            >
              <Briefcase className="h-10 w-10 text-primary" />
              <div className="text-base font-semibold">I am an Investor</div>
              <p className="text-sm font-normal text-muted-foreground">
                I want to review startups and manage my deal flow.
              </p>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
