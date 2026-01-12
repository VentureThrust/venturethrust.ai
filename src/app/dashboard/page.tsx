'use client';
import { useState } from 'react';
import {
  MoreVertical,
} from 'lucide-react';
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


export default function Dashboard() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold">Welcome, John</h1>
        <p className="text-muted-foreground mt-1">
          Here's a summary of your recent activity and data rooms.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Data Rooms</CardTitle>
        </CardHeader>
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
      </Card>
    </div>
  );
}
