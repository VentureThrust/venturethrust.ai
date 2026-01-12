'use client';
import { useState, useRef } from 'react';
import {
  UploadCloud,
  File,
  AlertCircle,
  CheckCircle,
  ShieldAlert,
  ShieldCheck,
  Shield,
  FileText,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

const riskFactors = [
    {
        risk: 'Unclear vesting schedule for founders.',
        severity: 'High',
        category: 'Founder Terms',
        icon: ShieldAlert,
        color: 'text-red-500'
    },
    {
        risk: 'Liquidation preference is 3x, which is higher than the standard 1x.',
        severity: 'High',
        category: 'Financial Terms',
        icon: ShieldAlert,
        color: 'text-red-500'
    },
    {
        risk: 'No explicit "no-shop" clause found.',
        severity: 'Medium',
        category: 'Exclusivity',
        icon: Shield,
        color: 'text-yellow-500'
    },
    {
        risk: 'The document is missing a clear timeline for product milestones.',
        severity: 'Medium',
        category: 'Roadmap',
        icon: Shield,
        color: 'text-yellow-500'
    },
    {
        risk: 'Standard employee option pool (10%) is allocated.',
        severity: 'Low',
        category: 'Equity',
        icon: ShieldCheck,
        color: 'text-green-500'
    },
    {
        risk: 'Standard confidentiality clause is included.',
        severity: 'Low',
        category: 'Legal',
        icon: ShieldCheck,
        color: 'text-green-500'
    },
];

export default function AIRiskScannerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setAnalysisComplete(false);
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
    setAnalysisComplete(false);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsAnalyzing(false);
          setAnalysisComplete(true);
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
        setAnalysisComplete(false);
        setIsAnalyzing(false);
        setProgress(0);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
  };


  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold">AI Risk Scanner</h1>
        <p className="text-muted-foreground mt-1">
          Analyze documents for potential investment risks and red flags.
        </p>
      </div>

      <Card 
        className="flex-1 flex flex-col"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <CardHeader>
            <CardTitle>Upload Document</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg m-6 mt-0 border-gray-200">
          {!file && !isAnalyzing && (
            <>
              <UploadCloud className="h-12 w-12 text-gray-400" />
              <p className="mt-4 text-lg text-gray-600">
                Drag and drop a file here, or{' '}
                <button onClick={handleBrowseClick} className="font-semibold text-primary hover:underline focus:outline-none">
                  Browse
                </button>
              </p>
              <p className="text-sm text-gray-400 mt-1">PDF, DOCX, XLSX, CSV (up to 25MB)</p>
            </>
          )}

          {file && (
            <div className='flex flex-col items-center justify-center w-full max-w-md text-center'>
                <FileText className="h-12 w-12 text-primary"/>
                <p className='mt-4 font-semibold'>{file.name}</p>
                <p className='text-sm text-muted-foreground'>{(file.size / 1024 / 1024).toFixed(2)} MB</p>

                {isAnalyzing && (
                    <div className='w-full mt-4'>
                        <Progress value={progress} className='h-2' />
                        <p className='text-sm text-primary mt-2 animate-pulse'>{progress}% Analyzing...</p>
                    </div>
                )}
                 {!isAnalyzing && !analysisComplete && (
                     <div className='flex items-center gap-4 mt-6'>
                         <Button variant="outline" onClick={() => setFile(null)}>Remove</Button>
                         <Button onClick={handleStartAnalysis}>Start Analysis</Button>
                     </div>
                 )}
                 {analysisComplete && (
                     <div className='flex items-center gap-2 mt-4 text-green-600'>
                         <CheckCircle className='h-5 w-5' />
                         <p className='font-semibold'>Analysis Complete</p>
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
      </Card>

      {analysisComplete && (
      <Card>
        <CardHeader>
            <div className='flex items-center justify-between'>
                <div>
                    <CardTitle>Analysis Report</CardTitle>
                    <CardDescription>FinTechCo_Financials.docx</CardDescription>
                </div>
                <div className='flex items-center gap-4'>
                    <div className='text-center'>
                        <p className='text-3xl font-bold text-red-500'>68</p>
                        <p className='text-sm font-semibold text-muted-foreground'>Risk Score</p>
                    </div>
                     <div className='flex items-center gap-3 text-sm'>
                        <div className='flex items-center gap-1.5'>
                            <AlertCircle className='h-4 w-4 text-red-500'/>
                            <span className='font-semibold'>2 High</span>
                        </div>
                        <div className='flex items-center gap-1.5'>
                             <Shield className='h-4 w-4 text-yellow-500'/>
                             <span className='font-semibold'>2 Medium</span>
                        </div>
                        <div className='flex items-center gap-1.5'>
                             <CheckCircle className='h-4 w-4 text-green-500'/>
                             <span className='font-semibold'>2 Low</span>
                        </div>
                    </div>
                </div>
            </div>
        </CardHeader>
        <CardContent>
           <div className='divide-y divide-border'>
              {riskFactors.map((factor, index) => (
                <div key={index} className='flex items-start gap-4 py-4'>
                    <factor.icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${factor.color}`} />
                    <div className='flex-1'>
                        <p className='font-medium'>{factor.risk}</p>
                        <div className='flex items-center gap-4 text-xs text-muted-foreground mt-1'>
                             <Badge variant={
                                 factor.severity === 'High' ? 'destructive' :
                                 factor.severity === 'Medium' ? 'outline' : 'secondary'
                             } className={
                                factor.severity === 'Medium' ? 'text-yellow-600 bg-yellow-50 border-yellow-200' : ''
                             }>
                                {factor.severity} Risk
                            </Badge>
                            <span>{factor.category}</span>
                        </div>
                    </div>
                </div>
              ))}
           </div>
        </CardContent>
      </Card>
      )}

    </div>
  );
}
