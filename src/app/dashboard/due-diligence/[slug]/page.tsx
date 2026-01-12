'use client';
import { use } from 'react';
import {
  AlertTriangle,
  Book,
  ChevronDown,
  CheckCircle,
  Download,
  Eye,
  File,
  FileText,
  Flag,
  Search,
  Users,
  Briefcase,
  GitBranch,
  ShoppingBag,
  Package,
} from 'lucide-react';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

const sidebarNavItems = [
  { title: 'Overview', icon: FileText, active: true },
  { title: 'Risks', icon: Flag },
  { title: 'Licenses', icon: Book },
  { title: 'Legal', icon: Briefcase },
  { title: 'Financials', icon: GitBranch },
  { title: 'HR', icon: Users },
  { title: 'Sales', icon: ShoppingBag },
  { title: 'Products', icon: Package },
];

const redFlags = [
  {
    title: 'Missing Pollution Control Board Certificate',
    category: 'Licenses',
    description: 'Pollution Control Board Certificate not found, required for MSME.',
    icon: File,
  },
  {
    title: 'Non-compete Violation with a key employee',
    category: 'Legal',
    description: 'John Choudhury (Key Account Manager) & John Choudhury has a non-compete agreement from his previous job.',
    icon: Users,
  },
  {
    title: 'Independent Revenue Projections not verified',
    category: 'Financial',
    description: "Company's future revenue projections have not been independently Varrted.",
    icon: GitBranch,
  },
];

const yellowFlags = [
  {
    title: 'Outdated Employee Handbook',
    category: 'HR',
    description: 'The employee handbook was last updated in 2021 and may not reflect current labor laws.',
    icon: Users,
  },
  {
    title: 'Single-Source Supplier Dependency',
    category: 'Products',
    description: 'The company relies on a single supplier for a critical component, posing a supply chain risk.',
    icon: Package,
  },
];

const greenChecks = [
  {
    title: 'Strong IP Portfolio',
    category: 'Legal',
    description: 'The company holds several key patents for its core technology, providing a competitive advantage.',
    icon: Briefcase,
  },
  {
    title: 'Consistent Revenue Growth',
    category: 'Financial',
    description: 'Financial statements show consistent year-over-year revenue growth for the past three fiscal years.',
    icon: GitBranch,
  },
];

const riskDistributionData = [
  { name: 'High Risk', value: 35, color: '#F44336' },
  { name: 'Moderate Risk', value: 20, color: '#FFC107' },
  { name: 'Positive Insights', value: 45, color: '#4CAF50' },
];

const insightsBreakdown = [
    { name: 'Red Flags', value: 7, icon: AlertTriangle, color: 'text-red-500' },
    { name: 'Yellow Flags', value: 4, icon: Flag, color: 'text-yellow-500' },
    { name: 'Green Checks', value: 9, icon: CheckCircle, color: 'text-green-500' },
]

export default function DueDiligencePage({ params }: { params: { slug: string } }) {
  const resolvedParams = use(params);
  const companyName = resolvedParams.slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  return (
    <div className="bg-background min-h-screen">
      <div className="flex">
        {/* Left Sidebar */}
        <div className="w-64 border-r bg-card p-4 flex flex-col gap-6">
          <div className="flex items-center gap-3">
             <Image
                src="https://placehold.co/40x40/4285F4/FFFFFF/png?text=A"
                width={40}
                height={40}
                alt="Atlas Logistics"
                className="rounded-lg"
              />
              <h2 className="font-semibold text-lg">{companyName}</h2>
          </div>
          <div className='flex flex-col gap-1 text-sm'>
            <span className='font-medium text-foreground'>MSME registration</span>
            <span className='text-muted-foreground'>UDVAM-XYZZXX</span>
            <span className='flex items-center gap-1.5 text-green-600'>
                <CheckCircle className='w-4 h-4' /> Verified
            </span>
          </div>

          <nav className="flex flex-col gap-2 mt-4">
            {sidebarNavItems.map((item) => (
              <a
                key={item.title}
                href="#"
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium',
                  item.active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.title}</span>
              </a>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <header className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
                <div className='p-2 bg-primary/10 rounded-lg text-primary'>
                    <Eye className="h-6 w-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold">{companyName} Due Diligence</h1>
                    <p className="text-muted-foreground">April 23 - April 24, 2024 <ChevronDown className='inline h-4 w-4' /></p>
                </div>
            </div>
            <Button suppressHydrationWarning>
              <Download className="mr-2 h-4 w-4" />
              Download PDF Report
            </Button>
          </header>

          <div className="flex gap-6 items-start">
            {/* Center Content */}
            <div className="flex-1 space-y-6">
                <Card>
                    <CardContent className='p-3 flex items-center justify-between'>
                        <div className='flex items-center gap-4'>
                             <Badge variant="outline" className='text-sm h-8 px-3 flex items-center gap-2 border-0 text-red-500'>
                                <AlertTriangle className='w-4 h-4' /> 
                                <span>Overall Risk: High</span>
                                <ChevronDown className='w-4 h-4' />
                            </Badge>
                            <Button variant="ghost" className='text-muted-foreground' suppressHydrationWarning>Legal</Button>
                            <Button variant="ghost" className='text-muted-foreground' suppressHydrationWarning>Financial <Badge className='ml-2'>5</Badge></Button>
                            <Button variant="ghost" className='text-muted-foreground' suppressHydrationWarning>HR & Employees <Badge className='ml-2'>4</Badge></Button>
                        </div>
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search findings..." className="pl-10" suppressHydrationWarning/>
                        </div>
                    </CardContent>
                </Card>

              <Tabs defaultValue="red-flags" className="w-full">
                <TabsList>
                  <TabsTrigger value="red-flags">Red Flags (7)</TabsTrigger>
                  <TabsTrigger value="yellow-flags">Yellow Flags (4)</TabsTrigger>
                  <TabsTrigger value="green-checks">Green Checks (9)</TabsTrigger>
                </TabsList>
                <TabsContent value="red-flags" className="mt-4 space-y-4">
                    <Card className='border-l-4 border-red-500'>
                        <CardHeader className='flex-row justify-between items-center'>
                           <CardTitle className='text-base flex items-center gap-2'><AlertTriangle className='w-5 h-5 text-red-500' /> Red Flags (7)</CardTitle>
                           <Button variant="ghost" size="icon" suppressHydrationWarning>&gt;</Button>
                        </CardHeader>
                        <CardContent className='space-y-6'>
                            {redFlags.map((flag, index) => (
                                <div key={index} className='flex items-start gap-4'>
                                    <div className='w-5 h-5 bg-red-500 rounded-full mt-1 flex-shrink-0' />
                                    <div className='flex-1'>
                                        <div className='flex justify-between items-start'>
                                            <p className='font-semibold'>{flag.title}</p>
                                            <Badge variant="outline">{flag.category}</Badge>
                                        </div>
                                        <div className='flex items-center gap-2 mt-1 text-sm text-muted-foreground'>
                                            <flag.icon className='w-4 h-4' />
                                            <p>{flag.description}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                     <Card className='border-l-4 border-red-500'>
                        <CardHeader className='flex-row justify-between items-center'>
                           <CardTitle className='text-base flex items-center gap-2'><AlertTriangle className='w-5 h-5 text-red-500' /> Red Flags (7)</CardTitle>
                           <Button variant="ghost" size="icon" suppressHydrationWarning>&gt;</Button>
                        </CardHeader>
                    </Card>
                </TabsContent>
                 <TabsContent value="yellow-flags" className="mt-4 space-y-4">
                    <Card className='border-l-4 border-yellow-500'>
                        <CardHeader className='flex-row justify-between items-center'>
                           <CardTitle className='text-base flex items-center gap-2'><Flag className='w-5 h-5 text-yellow-500' /> Yellow Flags (4)</CardTitle>
                           <Button variant="ghost" size="icon" suppressHydrationWarning>&gt;</Button>
                        </CardHeader>
                        <CardContent className='space-y-6'>
                            {yellowFlags.map((flag, index) => (
                                <div key={index} className='flex items-start gap-4'>
                                    <div className='w-5 h-5 bg-yellow-500 rounded-full mt-1 flex-shrink-0' />
                                    <div className='flex-1'>
                                        <div className='flex justify-between items-start'>
                                            <p className='font-semibold'>{flag.title}</p>
                                            <Badge variant="outline">{flag.category}</Badge>
                                        </div>
                                        <div className='flex items-center gap-2 mt-1 text-sm text-muted-foreground'>
                                            <flag.icon className='w-4 h-4' />
                                            <p>{flag.description}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>
                 <TabsContent value="green-checks" className="mt-4 space-y-4">
                    <Card className='border-l-4 border-green-500'>
                        <CardHeader className='flex-row justify-between items-center'>
                           <CardTitle className='text-base flex items-center gap-2'><CheckCircle className='w-5 h-5 text-green-500' /> Green Checks (9)</CardTitle>
                           <Button variant="ghost" size="icon" suppressHydrationWarning>&gt;</Button>
                        </CardHeader>
                        <CardContent className='space-y-6'>
                            {greenChecks.map((flag, index) => (
                                <div key={index} className='flex items-start gap-4'>
                                    <div className='w-5 h-5 bg-green-500 rounded-full mt-1 flex-shrink-0' />
                                    <div className='flex-1'>
                                        <div className='flex justify-between items-start'>
                                            <p className='font-semibold'>{flag.title}</p>
                                            <Badge variant="outline">{flag.category}</Badge>
                                        </div>
                                        <div className='flex items-center gap-2 mt-1 text-sm text-muted-foreground'>
                                            <flag.icon className='w-4 h-4' />
                                            <p>{flag.description}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Right Sidebar */}
            <aside className="w-80 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className='text-base'>Insights Breakdown</CardTitle>
                </CardHeader>
                <CardContent className='space-y-3'>
                    {insightsBreakdown.map(item => (
                         <div key={item.name} className='flex justify-between items-center text-sm'>
                            <span className={cn('flex items-center gap-2', item.color)}>
                                <item.icon className='w-4 h-4' /> {item.name}
                            </span>
                            <span className='font-medium'>{item.value}</span>
                        </div>
                    ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className='text-base'>Risk Distribution</CardTitle>
                </CardHeader>
                <CardContent className="h-48 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Tooltip
                                contentStyle={{
                                    background: "hsl(var(--background))",
                                    borderColor: "hsl(var(--border))",
                                    borderRadius: "var(--radius)",
                                }}
                            />
                            <Pie
                                data={riskDistributionData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                                labelLine={false}
                                label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                                    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                    const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                                    const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                                    return (
                                    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className='text-sm font-bold'>
                                        {`${(percent * 100).toFixed(0)}%`}
                                    </text>
                                    );
                                }}
                            >
                                {riskDistributionData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className='text-base'>What are Red Flags?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground flex items-start gap-2">
                    <AlertTriangle className='w-4 h-4 text-red-500 mt-0.5 flex-shrink-0' />
                    <span>Red flags indicate critical risks that require immediate attention & action.</span>
                  </p>
                  <Button variant="link" className="p-0 h-auto mt-2 text-primary" suppressHydrationWarning>
                    Download Full Report &gt;
                  </Button>
                </CardContent>
              </Card>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}
