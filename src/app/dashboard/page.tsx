'use client';
import {
  Activity,
  ArrowUpRight,
  Badge,
  Bell,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  CloudUpload,
  CreditCard,
  DollarSign,
  Eye,
  File,
  FilePlus,
  FileOutput,
  FileUp,
  Folder,
  Globe,
  HelpCircle,
  Home,
  Inbox,
  LineChart,
  Link,
  Lock,
  Package2,
  PanelLeft,
  PlusCircle,
  Search,
  Settings,
  Share2,
  ShoppingCart,
  SquareGanttChart,
  SquareUser,
  Star,
  Users,
  Users2,
  Wallet,
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

const dataRooms = [
  {
    icon: SquareGanttChart,
    name: 'SeedRound Docs',
    owner: 'Gran Chen',
    status: 'In Review',
    statusColor: 'bg-yellow-400',
  },
  {
    icon: LineChart,
    name: 'Series-A Room',
    owner: 'Seel Acrive',
    lastActive: 'Yesterday',
  },
  {
    icon: SquareUser,
    name: 'MVP Pitch Deck',
    owner: 'MJ Williams',
    lastActive: '2 days ago',
  },
  {
    icon: DollarSign,
    name: 'RetailPulse',
    owner: 'Aames Singh',
    lastActive: '5 days ago',
  },
  {
    icon: Users,
    name: 'EduNex',
    owner: 'Sara Taylor',
    lastActive: '1 week ago',
  },
];

const quickActions = [
  {
    icon: Wallet,
    name: 'PayFlow Pitch Deck',
    status: 'No Major Issues',
    statusColor: 'text-green-500',
  },
  {
    icon: Folder,
    name: 'FinTechCo Financials',
    status: '4 Red Flags',
    statusColor: 'text-red-500',
    analyzed: 'Analyzed 2 days ago',
  },
  {
    icon: File,
    name: 'Sample NDA',
    status: '4 Red Flags',
    statusColor: 'text-red-500',
    analyzed: 'Analyzed 4 days ago',
  },
];

export default function Dashboard() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold">Welcome, I...</h1>
        <p className="text-muted-foreground mt-1">
          Get started with your data rooms and AI due dilligence.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
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
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dataRooms.map((room) => (
                    <TableRow key={room.name}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="bg-muted p-2 rounded-md">
                            <room.icon className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <div className="font-medium">{room.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {room.owner}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {room.status ? (
                          <div className="inline-flex items-center gap-2 rounded-full bg-muted px-2 py-1 text-sm">
                            <span
                              className={`h-2 w-2 rounded-full ${room.statusColor}`}
                            ></span>
                            {room.status}
                          </div>
                        ) : (
                          room.lastActive
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Button variant="outline" className="w-full mt-4">
                <PlusCircle className="mr-2 h-4 w-4" /> New Data Room
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>AI Risk Scanner</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-border rounded-lg m-6 mt-0">
            <CloudUpload className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">
              Drag and drop a file here, or{' '}
              <span className="text-primary font-medium cursor-pointer">
                Browse
              </span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PDF DOCX XLSX CSV
            </p>
            <Button className="mt-6">Start Analysis</Button>
          </CardContent>
           <CardDescription className="px-6 pb-6 text-center">
            Upload a document to analyze potential risks. Identify missing info, red flags, and inconsistenc.
           </CardDescription>
        </Card>
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
                      <div className="bg-muted p-2 rounded-md">
                        <action.icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <span className="font-medium">{action.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          action.status === 'No Major Issues'
                            ? 'bg-green-500'
                            : 'bg-red-500'
                        }`}
                      ></span>
                      <span className={`${action.statusColor}`}>
                        {action.status}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {action.analyzed}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      View Report <ChevronRight className="ml-2 h-4 w-4" />
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
