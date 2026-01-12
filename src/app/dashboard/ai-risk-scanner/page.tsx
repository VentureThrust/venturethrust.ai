'use client';
import { useState, useRef } from 'react';
import { MoreVertical, UploadCloud, FileText, CheckCircle, Users, ArrowLeft, AlertTriangle, Check, Shield } from 'lucide-react';
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
import { Progress } from '@/components/ui/progress';

type Startup = {
  icon: string;
  name: string;
  owner: string;
  status: string;
  lastActive: string;
};

const startups: Startup[] = [
  {
    icon: 'https://placehold.co/32x32/4285F4/FFFFFF/png?text=P',
    name: 'PayFlow',
    owner: 'Ryan Chen',
    status: 'New',
    lastActive: '10 min ago',
  },
  {
    icon: 'https://placehold.co/32x32/34A853/FFFFFF/png?text=E',
    name: 'EnergiGrid',
    owner: 'Sophia Patel',
    status: 'In Review',
    lastActive: 'Yesterday',
  },
  {
    icon: 'https://placehold.co/32x32/A076F9/FFFFFF/png?text=H',
    name: 'HealthHub',
    owner: 'MJ Williams',
    status: 'In Review',
    lastActive: '3 days ago',
  },
  {
    icon: 'https://placehold.co/32x32/FBBC05/FFFFFF/png?text=R',
    name: 'RetailPulse',
    owner: 'James Singh',
    status: 'Completed',
    lastActive: '5 days ago',
  },
  {
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

const documents = [
    { name: 'Pitch Deck.pdf', status: 'Analyzed', risk: 'low' },
    { name: 'Financials.xlsx', status: 'Analyzed', risk: 'medium' },
    { name: 'Team Bios.docx', status: 'Pending', risk: 'none' },
    { name: 'Market Analysis.pdf', status: 'Analyzed', risk: 'high' },
];

const analysisItems = [
    { type: 'red', text: 'Unrealistic revenue projections in Financials.xlsx.' },
    { type: 'yellow', text: 'Competitive landscape in Market Analysis.pdf appears understated.' },
    { type: 'green', text: 'Strong founding team experience noted in Team Bios.docx.' },
    { type: 'red', text: 'Contradictory market size data between Pitch Deck and Market Analysis.' },
]

function StartupDetailView({ startup, onBack }: { startup: Startup, onBack: () => void }) {
    const [file, setFile] = useState<File | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setIsAnalyzing(false);
            setProgress(0);
        }
    };

    const handleBrowseClick = () => {
        fileInputRef.current?.click();
    };

    const handleStartAnalysis = () => {
        if (!file) return;

        setIsAnalyzing(true);
        setProgress(0);

        const interval = setInterval(() => {
        setProgress((prev) => {
            if (prev >= 100) {
            clearInterval(interval);
            setIsAnalyzing(false);
            return 100;
            }
            return prev + 10;
        });
        }, 200);
    };

    return (
        <div className="flex flex-col gap-8">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={onBack}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-3xl font-bold">Data Room: {startup.name}</h1>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
                <div className="xl:col-span-2 flex flex-col gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Documents</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>File Name</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Risk Level</TableHead>
                                        <TableHead className="text-right w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {documents.map(doc => (
                                        <TableRow key={doc.name}>
                                            <TableCell className="font-medium">{doc.name}</TableCell>
                                            <TableCell>{doc.status}</TableCell>
                                            <TableCell>
                                                {doc.risk === 'low' && <Badge variant="outline" className='bg-green-100 text-green-800'>Low</Badge>}
                                                {doc.risk === 'medium' && <Badge variant="outline" className='bg-yellow-100 text-yellow-800'>Medium</Badge>}
                                                {doc.risk === 'high' && <Badge variant="outline" className='bg-red-100 text-red-800'>High</Badge>}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Analysis Report</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {analysisItems.map((item, index) => (
                                <div key={index} className="flex items-start gap-4 p-4 rounded-lg bg-card border">
                                    {item.type === 'red' && <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />}
                                    {item.type === 'yellow' && <Shield className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />}
                                    {item.type === 'green' && <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />}
                                    <p className="text-sm text-foreground">{item.text}</p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
                <Card className="flex-1 flex flex-col">
                    <CardHeader><CardTitle>Quick Risk Check</CardTitle></CardHeader>
                    <CardContent className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed rounded-lg m-6 mt-0 border-gray-200">
                        {!file && !isAnalyzing && (
                            <>
                                <UploadCloud className="h-10 w-10 text-gray-400" />
                                <p className="mt-4 text-sm text-gray-600">
                                Drag and drop a file here, or{' '}
                                <button onClick={handleBrowseClick} className="font-semibold text-primary hover:underline focus:outline-none">Browse</button>
                                </p>
                                <p className="text-xs text-gray-400 mt-1">PDF DOCX XLSX CSV</p>
                            </>
                        )}
                        {file && (
                            <div className='flex flex-col items-center justify-center w-full max-w-md text-center'>
                                <FileText className="h-10 w-10 text-primary"/>
                                <p className='mt-2 font-semibold text-sm'>{file.name}</p>
                                <p className='text-xs text-muted-foreground'>{(file.size / 1024 / 1024).toFixed(2)} MB</p>

                                {isAnalyzing && (
                                    <div className='w-full mt-4'>
                                        <Progress value={progress} className='h-1.5' />
                                        <p className='text-xs text-primary mt-2 animate-pulse'>{progress}% Analyzing...</p>
                                    </div>
                                )}
                            </div>
                        )}
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            accept=".pdf,.docx,.xlsx,.csv"
                        />
                    </CardContent>
                    <div className="p-6 pt-0 flex flex-col gap-4">
                        <Button size="lg" onClick={handleStartAnalysis} disabled={!file || isAnalyzing}>Start Analysis</Button>
                        <p className="text-sm text-muted-foreground text-center">Upload a document to analyze potential risks.</p>
                    </div>
                </Card>
            </div>
        </div>
    );
}


export default function AiRiskScannerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedStartup, setSelectedStartup] = useState<Startup | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setIsAnalyzing(false);
      setProgress(0);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleStartAnalysis = () => {
    if (!file) return;

    setIsAnalyzing(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsAnalyzing(false);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };
  
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile) {
        setFile(droppedFile);
        setIsAnalyzing(false);
        setProgress(0);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
  };

  if (selectedStartup) {
      return <StartupDetailView startup={selectedStartup} onBack={() => setSelectedStartup(null)} />
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold">Startups Shared With Me</h1>
        <p className="text-muted-foreground mt-1">
          Analyze startup data rooms securely. Track documents. Make faster decisions.
        </p>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
        <div className="xl:col-span-2 flex flex-col gap-6">
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
                    <TableRow key={startup.name} onClick={() => setSelectedStartup(startup)} className="cursor-pointer">
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

        <Card 
          className="flex-1 flex flex-col"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <CardHeader>
              <CardTitle>Quick Risk Check</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed rounded-lg m-6 mt-0 border-gray-200">
            {!file && !isAnalyzing && (
              <>
                <UploadCloud className="h-10 w-10 text-gray-400" />
                <p className="mt-4 text-sm text-gray-600">
                  Drag and drop a file here, or{' '}
                  <button onClick={handleBrowseClick} className="font-semibold text-primary hover:underline focus:outline-none">
                    Browse
                  </button>
                </p>
                <p className="text-xs text-gray-400 mt-1">PDF DOCX XLSX CSV</p>
              </>
            )}

            {file && (
              <div className='flex flex-col items-center justify-center w-full max-w-md text-center'>
                  <FileText className="h-10 w-10 text-primary"/>
                  <p className='mt-2 font-semibold text-sm'>{file.name}</p>
                  <p className='text-xs text-muted-foreground'>{(file.size / 1024 / 1024).toFixed(2)} MB</p>

                  {isAnalyzing && (
                      <div className='w-full mt-4'>
                          <Progress value={progress} className='h-1.5' />
                          <p className='text-xs text-primary mt-2 animate-pulse'>{progress}% Analyzing...</p>
                      </div>
                  )}
              </div>
            )}
             <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf,.docx,.xlsx,.csv"
            />
          </CardContent>
            <div className="p-6 pt-0 flex flex-col gap-4">
              <Button size="lg" onClick={handleStartAnalysis} disabled={!file || isAnalyzing}>Start Analysis</Button>
              <p className="text-sm text-muted-foreground text-center">Upload a document to analyze potential risks. Identify missing info, red flags, and inconsistencies.</p>
            </div>
        </Card>
      </div>
    </div>
  );
}
