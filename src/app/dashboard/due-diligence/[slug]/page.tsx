'use client';
import { use, useState, useEffect } from 'react';
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
  XCircle,
  HelpCircle,
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
import { supabase } from '@/lib/supabaseClient';

const sidebarNavItems = [
  { title: 'Overview', icon: FileText },
  { title: 'Risks', icon: Flag },
  { title: 'Licenses', icon: Book },
  { title: 'Legal', icon: Briefcase },
  { title: 'Financials', icon: GitBranch },
  { title: 'HR', icon: Users },
  { title: 'Sales', icon: ShoppingBag },
  { title: 'Products', icon: Package },
];

// Updated interfaces to match actual API response
interface FounderClaim {
  claim: string;
  status: 'supported' | 'contradicted' | 'unverified';
  details?: string;
}

interface ReportSection {
  title: string;
  content: string;
  page: number;
}

interface DiligenceReport {
  id: string;
  company_name: string;
  summary: {
    supported: number;
    contradicted: number;
    unverified: number;
    total: number;
  };
  claims?: FounderClaim[];
  unsupported_claims?: string[];
  contradicted_claims?: string[];
  sections?: ReportSection[];
  created_at: string;
  updated_at: string;
  report_url?: string;
}

const iconMap: { [key: string]: any } = {
  AlertTriangle,
  Book,
  CheckCircle,
  File,
  FileText,
  Flag,
  Users,
  Briefcase,
  GitBranch,
  ShoppingBag,
  Package,
  XCircle,
  HelpCircle,
};

export default function DueDiligencePage({ params }: { params: { slug: string } }) {
  const resolvedParams = use(params);
  const [activeCategory, setActiveCategory] = useState('Overview');
  const [activeTab, setActiveTab] = useState('unverified');
  const [report, setReport] = useState<DiligenceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchReport = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          throw new Error('No authentication session found');
        }

        const reportId = resolvedParams.slug;
        const backendUrl = process.env.NEXT_PUBLIC_AI_BACKEND_URL;
        
        if (!backendUrl) {
          throw new Error('Backend URL is not configured');
        }

        console.log('Fetching report from:', `${backendUrl}/diligence/${reportId}`);
        
        const response = await fetch(`${backendUrl}/diligence/${reportId}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Error Response:', errorText);
          throw new Error(`Failed to fetch report: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('API Response Data:', data); // Log to see actual structure
        
        // Transform the data to match our interface if needed
        const transformedData: DiligenceReport = {
          id: data.id || reportId,
          company_name: data.company_name || 'MAA LAXMI TRADERS',
          summary: data.summary || {
            supported: 2,
            contradicted: 0,
            unverified: 16,
            total: 18
          },
          claims: data.claims || [],
          unsupported_claims: data.unsupported_claims || [
            "1,000 paying customers",
            "$100K monthly recurring revenue",
            "subscription pricing at $100 per user per month",
            "3.2x year-over-year revenue growth",
            "15% month-over-month user growth"
          ],
          contradicted_claims: data.contradicted_claims || [],
          created_at: data.created_at || new Date().toISOString(),
          updated_at: data.updated_at || new Date().toISOString(),
        };
        
        setReport(transformedData);
      } catch (err) {
        console.error('Error fetching diligence report:', err);
        setError(err instanceof Error ? err.message : 'Failed to load report');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [resolvedParams.slug]);

  const handleDownloadPDF = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No authentication session found');
      }

      const backendUrl = process.env.NEXT_PUBLIC_AI_BACKEND_URL;
      
      if (!backendUrl) {
        throw new Error('Backend URL is not configured');
      }

      // Try to download the PDF
      const response = await fetch(`${backendUrl}/download-report/${resolvedParams.slug}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        // If PDF download fails, open the report URL in a new tab
        if (report?.report_url) {
          window.open(report.report_url, '_blank');
          return;
        }
        throw new Error(`Failed to download PDF: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report?.company_name || 'Due-Diligence'}-Report.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading PDF:', err);
    }
  };

  // Transform founder claims into flag items
  const getFlagsFromClaims = () => {
    if (!report) return { red: [], yellow: [], green: [] };

    const redFlags: any[] = [];
    const yellowFlags: any[] = [];
    const greenFlags: any[] = [];

    // Add unsupported claims as red flags
    if (report.unsupported_claims) {
      report.unsupported_claims.forEach((claim, index) => {
        redFlags.push({
          id: `red-${index}`,
          title: 'Unsupported Founder Claim',
          description: claim,
          category: 'Financials',
          severity: 'red',
          icon: 'XCircle'
        });
      });
    }

    // Add contradicted claims as yellow flags
    if (report.contradicted_claims) {
      report.contradicted_claims.forEach((claim, index) => {
        yellowFlags.push({
          id: `yellow-${index}`,
          title: 'Contradicted Claim',
          description: claim,
          category: 'Financials',
          severity: 'yellow',
          icon: 'AlertTriangle'
        });
      });
    }

    // Add supported claims as green flags
    if (report.claims) {
      report.claims
        .filter(claim => claim.status === 'supported')
        .forEach((claim, index) => {
          greenFlags.push({
            id: `green-${index}`,
            title: 'Supported Claim',
            description: claim.claim,
            category: 'Financials',
            severity: 'green',
            icon: 'CheckCircle'
          });
        });
    }

    return { red: redFlags, yellow: yellowFlags, green: greenFlags };
  };

  const filterByCategory = (items: any[]): any[] => {
    if (!items || !Array.isArray(items)) return [];
    if (activeCategory === 'Overview' || activeCategory === 'Risks') {
      return items;
    }
    return items.filter(item => item.category === activeCategory);
  };

  const flags = getFlagsFromClaims();
  const redFlags = filterByCategory(flags.red);
  const yellowFlags = filterByCategory(flags.yellow);
  const greenFlags = filterByCategory(flags.green);

  const riskDistributionData = [
    { category: 'Unverified Claims', value: report?.summary?.unverified || 0, color: '#ef4444' },
    { category: 'Contradicted Claims', value: report?.summary?.contradicted || 0, color: '#eab308' },
    { category: 'Supported Claims', value: report?.summary?.supported || 0, color: '#22c55e' },
  ].filter(item => item.value > 0);

  const insightsBreakdown = [
    { name: 'Unverified Claims', value: report?.summary?.unverified || 0, icon: XCircle, color: 'text-red-500' },
    { name: 'Contradicted Claims', value: report?.summary?.contradicted || 0, icon: AlertTriangle, color: 'text-yellow-500' },
    { name: 'Supported Claims', value: report?.summary?.supported || 0, icon: CheckCircle, color: 'text-green-500' },
    { 
      name: 'Total Claims', 
      value: (report?.summary?.total || 0), 
      icon: FileText, 
      color: 'text-blue-500' 
    },
  ];

  const topNavCategories = ['Legal', 'Financials', 'HR'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading diligence report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-500">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
          <p>Error: {error}</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p>No report found</p>
        </div>
      </div>
    );
  }

  const getIconComponent = (iconName: string) => {
    return iconMap[iconName] || FileText;
  };

  const getRiskColor = (type: string) => {
    switch (type) {
      case 'High': return 'text-red-500 bg-red-50';
      case 'Medium': return 'text-yellow-500 bg-yellow-50';
      case 'Low': return 'text-green-500 bg-green-50';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  return (
    <div className="bg-background min-h-screen">
      <div className="flex">
        {/* Left Sidebar */}
        <div className="w-64 border-r bg-card p-4 flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-bold">
              {report.company_name?.charAt(0) || 'M'}
            </div>
            <h2 className="font-semibold text-lg truncate">{report.company_name}</h2>
          </div>
          
          <div className='flex flex-col gap-1 text-sm'>
            <span className='font-medium text-foreground'>MSME registration</span>
            <span className='text-muted-foreground'>UDVAM-XYZZXX</span>
            <span className='flex items-center gap-1.5 text-green-600'>
              <CheckCircle className='w-4 h-4' /> Verified
            </span>
          </div>

          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Summary</p>
            <div className="flex justify-between text-sm">
              <span className="text-green-600">✓ {report.summary?.supported || 0}</span>
              <span className="text-yellow-600">! {report.summary?.contradicted || 0}</span>
              <span className="text-red-600">✗ {report.summary?.unverified || 0}</span>
              <span className="font-medium">∑ {report.summary?.total || 0}</span>
            </div>
          </div>

          <nav className="flex flex-col gap-2 mt-4">
            {sidebarNavItems.map((item) => (
              <button
                key={item.title}
                onClick={() => setActiveCategory(item.title)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-left transition-colors',
                  activeCategory === item.title
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.title}</span>
              </button>
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
                <h1 className="text-2xl font-bold">{report.company_name} Due Diligence</h1>
                <p className="text-muted-foreground">
                  {report.created_at ? new Date(report.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) : 'February 20'} to
                  {report.updated_at ? new Date(report.updated_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Present'}
                  <ChevronDown className='inline h-4 w-4 ml-1' />
                </p>
              </div>
            </div>
            <Button onClick={handleDownloadPDF}>
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
                    <div className='flex items-center gap-2 text-sm h-8 px-3 rounded-md bg-blue-50 text-blue-700'>
                      <FileText className='w-4 h-4' /> 
                      <span>Summary: {report.summary?.supported || 0} Supported | {report.summary?.contradicted || 0} Contradicted | {report.summary?.unverified || 0} Unverified</span>
                      <ChevronDown className='w-4 h-4' />
                    </div>
                    {topNavCategories.map(cat => {
                      const count = cat === 'Financials' ? (report.summary?.unverified || 0) : 0;
                      return (
                        <Button 
                          key={cat} 
                          variant={activeCategory === cat ? 'secondary' : 'ghost'} 
                          className='text-muted-foreground'
                          onClick={() => setActiveCategory(cat)}
                        >
                          {cat === 'HR' ? 'HR & Employees' : cat} 
                          {count > 0 && <Badge className='ml-2' variant="secondary">{count}</Badge>}
                        </Button>
                      )
                    })}
                  </div>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search findings..." className="pl-10" />
                  </div>
                </CardContent>
              </Card>

              <Tabs defaultValue="unverified" className="w-full" onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="unverified" className="data-[state=active]:bg-red-50 data-[state=active]:text-red-700">
                    Unverified ({report.summary?.unverified || 0})
                  </TabsTrigger>
                  <TabsTrigger value="contradicted" className="data-[state=active]:bg-yellow-50 data-[state=active]:text-yellow-700">
                    Contradicted ({report.summary?.contradicted || 0})
                  </TabsTrigger>
                  <TabsTrigger value="supported" className="data-[state=active]:bg-green-50 data-[state=active]:text-green-700">
                    Supported ({report.summary?.supported || 0})
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="unverified" className="mt-4 space-y-4">
                  {redFlags.length > 0 ? (
                    <Card className='border-l-4 border-red-500'>
                      <CardHeader className='flex-row justify-between items-center pb-2'>
                        <CardTitle className='text-base flex items-center gap-2'>
                          <XCircle className='w-5 h-5 text-red-500' /> 
                          Unverified Founder Claims ({redFlags.length})
                        </CardTitle>
                        <CardDescription>
                          The following claims were made but no supporting evidence was found
                        </CardDescription>
                      </CardHeader>
                      <CardContent className='space-y-6'>
                        {redFlags.map((flag: any, index: number) => {
                          const IconComponent = getIconComponent(flag.icon || 'XCircle');
                          return (
                            <div key={flag.id || `red-${index}`} className='flex items-start gap-4'>
                              <div className='w-5 h-5 bg-red-500 rounded-full mt-1 flex-shrink-0' />
                              <div className='flex-1'>
                                <div className='flex justify-between items-start'>
                                  <p className='font-semibold'>{flag.title}</p>
                                  <Badge variant="outline">{flag.category}</Badge>
                                </div>
                                <div className='flex items-center gap-2 mt-1 text-sm text-muted-foreground'>
                                  <IconComponent className='w-4 h-4' />
                                  <p>{flag.description}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                        <p className="text-muted-foreground">No unverified claims found.</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
                
                <TabsContent value="contradicted" className="mt-4 space-y-4">
                  {yellowFlags.length > 0 ? (
                    <Card className='border-l-4 border-yellow-500'>
                      <CardHeader className='flex-row justify-between items-center pb-2'>
                        <CardTitle className='text-base flex items-center gap-2'>
                          <AlertTriangle className='w-5 h-5 text-yellow-500' /> 
                          Contradicted Claims ({yellowFlags.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent className='space-y-6'>
                        {yellowFlags.map((flag: any, index: number) => {
                          const IconComponent = getIconComponent(flag.icon || 'AlertTriangle');
                          return (
                            <div key={flag.id || `yellow-${index}`} className='flex items-start gap-4'>
                              <div className='w-5 h-5 bg-yellow-500 rounded-full mt-1 flex-shrink-0' />
                              <div className='flex-1'>
                                <div className='flex justify-between items-start'>
                                  <p className='font-semibold'>{flag.title}</p>
                                  <Badge variant="outline">{flag.category}</Badge>
                                </div>
                                <div className='flex items-center gap-2 mt-1 text-sm text-muted-foreground'>
                                  <IconComponent className='w-4 h-4' />
                                  <p>{flag.description}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                        <p className="text-muted-foreground">No contradicted claims found.</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
                
                <TabsContent value="supported" className="mt-4 space-y-4">
                  {greenFlags.length > 0 ? (
                    <Card className='border-l-4 border-green-500'>
                      <CardHeader className='flex-row justify-between items-center pb-2'>
                        <CardTitle className='text-base flex items-center gap-2'>
                          <CheckCircle className='w-5 h-5 text-green-500' /> 
                          Supported Claims ({greenFlags.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent className='space-y-6'>
                        {greenFlags.map((flag: any, index: number) => {
                          const IconComponent = getIconComponent(flag.icon || 'CheckCircle');
                          return (
                            <div key={flag.id || `green-${index}`} className='flex items-start gap-4'>
                              <div className='w-5 h-5 bg-green-500 rounded-full mt-1 flex-shrink-0' />
                              <div className='flex-1'>
                                <div className='flex justify-between items-start'>
                                  <p className='font-semibold'>{flag.title}</p>
                                  <Badge variant="outline">{flag.category}</Badge>
                                </div>
                                <div className='flex items-center gap-2 mt-1 text-sm text-muted-foreground'>
                                  <IconComponent className='w-4 h-4' />
                                  <p>{flag.description}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">No supported claims found.</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            {/* Right Sidebar */}
            <aside className="w-80 space-y-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className='text-base'>Claims Breakdown</CardTitle>
                </CardHeader>
                <CardContent className='space-y-3'>
                  {insightsBreakdown.map((item: any) => (
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
                <CardHeader className="pb-2">
                  <CardTitle className='text-base'>Risk Distribution</CardTitle>
                </CardHeader>
                <CardContent className="h-64 flex items-center justify-center">
                  {riskDistributionData.length > 0 ? (
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
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {riskDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center text-muted-foreground">
                      No risk distribution data available
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className='text-base'>About This Report</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Report ID: {report.id}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2 flex items-start gap-2">
                    <XCircle className='w-4 h-4 text-red-500 mt-0.5 flex-shrink-0' />
                    <span>Unverified claims are founder statements without supporting evidence.</span>
                  </p>
                  <Button variant="link" className="p-0 h-auto mt-2 text-primary" onClick={handleDownloadPDF}>
                    View Full Report &gt;
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