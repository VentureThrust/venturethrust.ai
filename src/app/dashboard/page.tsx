'use client';
import { useState, useRef } from 'react';
import { MoreVertical, UploadCloud, FileText, CheckCircle } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
import { useUser } from '@/hooks/use-user';

const dataRooms: any[] = [];

export default function Dashboard() {
  const { user } = useUser();
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
        <h1 className="text-3xl font-bold">Welcome, {user.firstName}</h1>
        <p className="text-muted-foreground mt-1">
          Here's a summary of your recent activity and data rooms.
        </p>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <Card className="xl:col-span-2">
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
                        <Image
                          src={room.icon}
                          width={32}
                          height={32}
                          alt={room.name}
                          className="rounded-md"
                        />
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
                        <Badge
                          variant="outline"
                          className="bg-yellow-100 text-yellow-800 border-yellow-200"
                        >
                          {room.lastActive}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          {room.lastActive}
                        </span>
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
            <Button
              variant="outline"
              className="w-full mt-4 text-primary border-primary hover:bg-primary/5 hover:text-primary"
            >
              + New Data Room
            </Button>
          </CardContent>
        </Card>

        <Card 
          className="flex-1 flex flex-col"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <CardHeader>
              <CardTitle>AI Risk Scanner</CardTitle>
              <CardDescription>Upload a document to analyze for potential red flags.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed rounded-lg m-6 mt-0 border-gray-200">
            {!file && !isAnalyzing && (
              <>
                <UploadCloud className="h-10 w-10 text-gray-400" />
                <p className="mt-4 text-sm text-gray-600">
                  Drag & drop, or{' '}
                  <button onClick={handleBrowseClick} className="font-semibold text-primary hover:underline focus:outline-none">
                    Browse
                  </button>
                </p>
                <p className="text-xs text-gray-400 mt-1">Max file size: 25MB</p>
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
                  {!isAnalyzing && !analysisComplete && (
                       <div className='flex items-center gap-2 mt-4'>
                           <Button variant="outline" size="sm" onClick={() => setFile(null)}>Remove</Button>
                           <Button size="sm" onClick={handleStartAnalysis}>Start Analysis</Button>
                       </div>
                   )}
                   {analysisComplete && (
                       <div className='flex items-center gap-2 mt-3 text-green-600'>
                           <CheckCircle className='h-4 w-4' />
                           <p className='font-semibold text-sm'>Analysis Complete</p>
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
      </div>
    </div>
  );
}
