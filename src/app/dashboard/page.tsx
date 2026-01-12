'use client';
import { useState } from 'react';
import {
  ChevronDown,
  UploadCloud,
  File,
  Users,
  Share2,
  BarChart2,
  ChevronRight,
  MoreVertical,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
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
import Link from 'next/link';

type PlanType = 'vdr' | 'ai' | 'combo';

const dataRooms = [
  {
    icon: 'https://placehold.co/32x32/4285F4/FFFFFF/png?text=S',
    name: 'SeedRound Docs',
    owner: 'Gan Chen',
    lastActive: 'In Review',
  },
  {
    icon: 'https://placehold.co/32x32/34A853/FFFFFF/png?text=S',
    name: 'Series-A Room',
    owner: 'Seef Arche',
    lastActive: 'Yesterday',
  },
  {
    icon: 'https://placehold.co/32x32/A076F9/FFFFFF/png?text=M',
    name: 'MVP Pitch Deck',
    owner: 'MJ Williams',
    lastActive: '2 days ago',
  },
  {
    icon: 'https://placehold.co/32x32/FBBC05/FFFFFF/png?text=R',
    name: 'RetailPulse',
    owner: 'James Singh',
    lastActive: '5 days ago',
  },
    {
    icon: 'https://placehold.co/32x32/F28B82/FFFFFF/png?text=E',
    name: 'EduNex',
    owner: 'Sara Taylor',
    lastActive: '1 week ago',
  },
];

const quickActions = [
  {
    icon: 'https://placehold.co/32x32/4285F4/FFFFFF/png?text=P',
    name: 'PayFlow Pitch Deck',
    status: 'No Major Isues',
    statusType: 'success',
    lastAnalyzed: ''
  },
  {
    icon: 'https://placehold.co/32x32/34A853/FFFFFF/png?text=F',
    name: 'FinTechCo Financials',
    status: '4 Red Flags',
    statusType: 'error',
    lastAnalyzed: 'Analyzed 2 days ago'
  },
  {
    icon: 'https://placehold.co/32x32/A076F9/FFFFFF/png?text=S',
    name: 'Sample NDA',
    status: '4 Red Flags',
    statusType: 'error',
    lastAnalyzed: 'Analyzed 4 days ago'
  },
];


const VDRContent = ({ hasVDRPlan }: { hasVDRPlan: boolean }) => (
  <Card>
    <CardHeader>
      <CardTitle>My Data Rooms</CardTitle>
    </CardHeader>
    {hasVDRPlan ? (
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data Room</TableHead>
              <TableHead>Last Active</TableHead>
              <TableHead className="text-right"> </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dataRooms.map((room) => (
              <TableRow key={room.name}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Image src={room.icon} width={32} height={32} alt={room.name} className='rounded-md'/>
                    <div>
                      <div className="font-medium">{room.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {room.owner}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {room.lastActive === 'In Review' ? (
                     <Badge variant="outline" className='bg-yellow-100 text-yellow-800 border-yellow-200'>
                       {room.lastActive}
                     </Badge>
                  ) : (
                    <span className='text-muted-foreground text-sm'>{room.lastActive}</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Button variant="outline" className="w-full mt-4 text-primary border-primary hover:bg-primary/5 hover:text-primary">
          + New Data Room
        </Button>
      </CardContent>
    ) : (
      <CardContent className="flex flex-col items-center justify-center text-center p-8 m-6 mt-0">
          <p className="mt-4 text-lg font-semibold">
            This feature is not included in your plan
          </p>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
            Upgrade your plan to create and manage data rooms.
          </p>
          <Button className="mt-6">Upgrade Plan</Button>
        </CardContent>
    )}
  </Card>
);

const AIRiskScannerContent = ({ hasAIPlan }: { hasAIPlan: boolean }) => (
  <Card className="flex flex-col">
    <CardHeader className='flex-row items-center justify-between'>
      <CardTitle>AI Risk Scanner</CardTitle>
      <div className='flex items-center gap-1.5'>
          <AlertCircle className='h-5 w-5 text-yellow-500'/>
          <XCircle className='h-5 w-5 text-red-500'/>
          <CheckCircle className='h-5 w-5 text-green-500'/>
      </div>
    </CardHeader>
    {hasAIPlan ? (
      <CardContent className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg m-6 mt-0 border-gray-200">
        <UploadCloud className="h-8 w-8 text-gray-400" />
        <p className="mt-4 text-sm text-gray-600">
          Drag and drop a file here, or{' '}
          <Link href="#" className="font-semibold text-primary">
            Browse
          </Link>
        </p>
        <p className="text-xs text-gray-400 mt-1">PDF, DOCX, XLSX, CSV</p>
        <Button className="mt-6">Start Analysis</Button>
        <p className="text-xs text-muted-foreground mt-4 max-w-xs mx-auto">
          Upload a document to analyze potential risks. Identify missing info, red flags, and inconsistencies.
        </p>
      </CardContent>
    ) : (
      <CardContent className="flex-1 flex flex-col items-center justify-center text-center p-8 m-6 mt-0">
        <p className="mt-4 text-lg font-semibold">
          This feature is not included in your plan
        </p>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
          Upgrade your plan to unlock AI-powered document analysis.
        </p>
        <Button className="mt-6">Upgrade Plan</Button>
      </CardContent>
    )}
  </Card>
);


export default function Dashboard() {
  // Mock user plan. In a real app, this would come from user data.
  const [plan, setPlan] = useState<PlanType>('combo'); 

  const hasVDRPlan = plan === 'vdr' || plan === 'combo';
  const hasAIPlan = plan === 'ai' || plan === 'combo';

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold">Welcome, John</h1>
        <p className="text-muted-foreground mt-1">
          Get started with your data rooms and AI due dilligence.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        <div className="lg:col-span-3 flex flex-col gap-8">
            <VDRContent hasVDRPlan={hasVDRPlan} />
        </div>

        <div className="lg:col-span-2 flex flex-col gap-8">
          <AIRiskScannerContent hasAIPlan={hasAIPlan} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableBody>
              {quickActions.map((action) => (
                <TableRow key={action.name}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Image src={action.icon} width={32} height={32} alt={action.name} className='rounded-md'/>
                      <span className="font-medium">{action.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className='flex items-center gap-2'>
                      {action.statusType === 'success' && <CheckCircle className='h-4 w-4 text-green-500' />}
                      {action.statusType === 'error' && <AlertCircle className='h-4 w-4 text-red-500' />}
                      <span className={action.statusType === 'error' ? 'text-red-500 font-semibold' : 'text-green-500'}>{action.status}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {action.lastAnalyzed}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="link" className="text-primary p-0 h-auto">
                      View Report <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
