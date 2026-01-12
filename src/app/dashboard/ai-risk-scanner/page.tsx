'use client';
import { useState } from 'react';
import { MoreVertical, Users } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

type Startup = {
  id: string;
  icon: string;
  name: string;
  owner: string;
  status: string;
  lastActive: string;
};

const startups: Startup[] = [
  {
    id: 'atlas-logistics',
    icon: 'https://placehold.co/32x32/4285F4/FFFFFF/png?text=A',
    name: 'Atlas Logistics',
    owner: 'John Doe',
    status: 'In Review',
    lastActive: '10 min ago',
  },
  {
    id: 'energi-grid',
    icon: 'https://placehold.co/32x32/34A853/FFFFFF/png?text=E',
    name: 'EnergiGrid',
    owner: 'Sophia Patel',
    status: 'In Review',
    lastActive: 'Yesterday',
  },
  {
    id: 'health-hub',
    icon: 'https://placehold.co/32x32/A076F9/FFFFFF/png?text=H',
    name: 'HealthHub',
    owner: 'MJ Williams',
    status: 'In Review',
    lastActive: '3 days ago',
  },
  {
    id: 'retail-pulse',
    icon: 'https://placehold.co/32x32/FBBC05/FFFFFF/png?text=R',
    name: 'RetailPulse',
    owner: 'James Singh',
    status: 'Completed',
    lastActive: '5 days ago',
  },
  {
    id: 'edu-nex',
    icon: 'https://placehold.co/32x32/F28B82/FFFFFF/png?text=E',
    name: 'EduNex',
    owner: 'Sara Taylor',
    status: 'Completed',
    lastActive: '1 week ago',
  },
];


const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
        case 'New':
            return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">{status}</Badge>;
        case 'In Review':
            return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">{status}</Badge>;
        case 'Completed':
            return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">{status}</Badge>;
        default:
            return <Badge variant="secondary">{status}</Badge>;
    }
};

export default function AiRiskScannerPage() {
  const router = useRouter();

  const handleStartupClick = (startupId: string) => {
    router.push(`/dashboard/due-diligence/${startupId}`);
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold">Startups Shared With Me</h1>
        <p className="text-muted-foreground mt-1">
          Analyze startup data rooms securely. Track documents. Make faster decisions.
        </p>
      </div>
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Startups Shared With Me</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Startup</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead className="text-right w-[50px]"> </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {startups.map((startup) => (
                  <TableRow key={startup.name} onClick={() => handleStartupClick(startup.id)} className="cursor-pointer">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Image
                          src={startup.icon}
                          width={32}
                          height={32}
                          alt={startup.name}
                          className="rounded-md"
                        />
                        <div>
                          <div className="font-medium">{startup.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {startup.owner}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={startup.status} />
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground text-sm">
                        {startup.lastActive}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                  <Users className="h-6 w-6 text-muted-foreground"/>
                  <CardTitle className="text-xl">Invite Founders</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                  <Button>Invite Founders</Button>
                  <Button variant="outline">View Demo Data Room</Button>
              </div>
          </CardHeader>
          <CardContent>
              <p className="text-muted-foreground text-sm">No startups have shared a data room with you yet.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
