'use client';
import {
  ChevronDown,
  Lock,
  Plus,
  Users,
  Share2,
  BarChart2,
  ChevronRight,
  MoreVertical,
  CheckSquare,
  XSquare,
  FileCheck
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

const dataRooms = [
  {
    icon: 'https://placehold.co/32x32/4285F4/FFFFFF/png?text=S',
    name: 'SeedRound Docs',
    owner: 'Gan Chen',
    status: 'In Review',
    statusColor: 'bg-yellow-500',
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
    icon: Users,
    name: 'Invite Investors',
  },
  {
    icon: Share2,
    name: 'Share Data Room',
  },
  {
    icon: MoreVertical,
    name: 'View More',
  },
];

const recentActivity = [
    {
        avatar: 'https://i.pravatar.cc/40?u=a042581f4e29026704d',
        name: 'Gan Chen',
        action: 'accessed',
        document: 'SeedRound Docs',
        time: 'Seconds ago',
    },
    {
        avatar: 'https://i.pravatar.cc/40?u=a042581f4e29026704e',
        name: 'Seef Arche',
        action: 'accessed',
        document: 'Series-A Room',
        time: 'Yesterday',
    }
];

export default function Dashboard() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold">Welcome, I...</h1>
        <p className="text-muted-foreground mt-1">
          Get started with your data rooms and securely share documents.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        <div className="lg:col-span-3 flex flex-col gap-8">
          <Card>
            <CardHeader>
              <CardTitle>My Data Rooms</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableBody>
                  {dataRooms.map((room) => (
                    <TableRow key={room.name}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-md">
                            <Image src={room.icon} width={32} height={32} alt={room.name} className='rounded-md'/>
                          </div>
                          <div>
                            <div className="font-medium">{room.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {room.owner}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className='text-right'>
                        {room.status ? (
                           <Badge variant="outline" className='bg-yellow-100 text-yellow-800 border-yellow-200'>
                             {room.status}
                           </Badge>
                        ) : (
                          <span className='text-muted-foreground text-sm'>{room.lastActive}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Button variant="outline" className="w-full mt-4 text-primary border-primary/20 hover:bg-primary/5 hover:text-primary">
                <Plus className="mr-2 h-4 w-4" /> New Data Room
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-2'>
              {quickActions.map((action) => (
                 <div key={action.name} className='flex items-center justify-between p-3 rounded-lg hover:bg-muted/50'>
                     <div className="flex items-center gap-3">
                        <div className="bg-muted p-2 rounded-md">
                           <action.icon className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <span className="font-medium">{action.name}</span>
                     </div>
                     <ChevronRight className="h-5 w-5 text-muted-foreground" />
                 </div>
              ))}
              </div>
            </CardContent>
          </Card>

        </div>

        <div className="lg:col-span-2 flex flex-col gap-8">
            <Card className="flex flex-col">
              <CardHeader className='flex-row items-center justify-between'>
                <CardTitle>AI Due Diligence</CardTitle>
                <div className='flex items-center gap-1.5'>
                    <CheckSquare className='h-5 w-5 text-green-500'/>
                    <XSquare className='h-5 w-5 text-red-500'/>
                    <FileCheck className='h-5 w-5 text-blue-500'/>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col items-center justify-center text-center p-8 m-6 mt-0">
                <div className='p-4 bg-muted rounded-full'>
                    <Lock className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="mt-4 text-lg font-semibold">
                  This feature is not included in your plan
                </p>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
                  Upgrade your plan to unlock AI-powered document analysis and risk detection.
                </p>
                <Button className="mt-6 bg-primary hover:bg-primary/90">Upgrade Plan</Button>
              </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className='space-y-4'>
                        {recentActivity.map((activity, index) => (
                            <div key={index} className='flex items-center gap-3'>
                                <Image src={activity.avatar} width={40} height={40} alt={activity.name} className='rounded-full'/>
                                <div>
                                    <p className='text-sm'>
                                        <span className='font-semibold'>{activity.name}</span> {activity.action} <span className='font-semibold'>{activity.document}</span>
                                    </p>
                                    <p className='text-xs text-muted-foreground'>{activity.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className='text-right mt-4'>
                      <Button variant="link" className='text-primary p-0 h-auto'>View More <ChevronRight className="ml-1 h-4 w-4" /></Button>
                    </div>
                </CardContent>
            </Card>
        </div>

      </div>
    </div>
  );
}
