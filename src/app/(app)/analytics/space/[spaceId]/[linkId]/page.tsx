

'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useSpaces } from '@/lib/spaces-provider';
import type { Space } from '@/lib/spaces-provider';
import { Loader2, Mail, ShieldCheck, Pen } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import SignatureCanvas from 'react-signature-canvas';
import { FileViewer } from '@/components/file-viewer';
import { Document as TDocument } from '@/lib/data';
import { type Visit } from '@/lib/folder-provider';
import { format } from 'date-fns';

const getDeviceAndOS = () => {
    if (typeof window === 'undefined') return { device: 'Unknown', os: 'Unknown' };
    const ua = navigator.userAgent;
    let os = 'Unknown';
    if (/android/i.test(ua)) os = 'Android';
    if (/iPad|iPhone|iPod/.test(ua)) os = 'iOS';
    if (/windows phone/i.test(ua)) os = 'Windows Phone';
    if (/mac/i.test(ua)) os = 'macOS';
    if (/windows/i.test(ua)) os = 'Windows';
    if (/linux/i.test(ua)) os = 'Linux';
    
    const device = /Mobi|Android/i.test(ua) ? 'Mobile' : 'Desktop';
    return { device, os };
}


export default function SpaceVerificationPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { spaceId, linkId } = params;
  const { findSpace, updateSpace } = useSpaces();
  const { toast } = useToast();

  const [space, setSpace] = useState<Space | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'email' | 'nda' | 'done'>('email');
  const [signature, setSignature] = useState<string | null>(null);
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [ndaFile, setNdaFile] = useState<TDocument | null>(null);
  
  useEffect(() => {
    const spaceIdStr = spaceId as string;
    if (spaceIdStr) {
      const isPreview = searchParams.get('preview') === 'true';
      const sessionKey = `viewer_session_${spaceIdStr}`;
      
      if (typeof window !== 'undefined') {
        const sessionString = sessionStorage.getItem(sessionKey);
        const session = sessionString ? JSON.parse(sessionString) : {};

        if (session.email && session.ndaSigned) {
          router.replace(`/space/${spaceIdStr}/view?visitId=${session.visitId}`);
          return;
        }
        
        if (isPreview) {
          const visitId = `visit_${Date.now()}`;
          sessionStorage.setItem(sessionKey, JSON.stringify({ email: 'owner@preview.com', ndaSigned: true, name: 'Preview User', visitId }));
          router.replace(`/space/${spaceIdStr}/view?visitId=${visitId}`);
          return;
        }

        const foundSpace = findSpace(spaceIdStr, true);
        if (foundSpace) {
          setSpace(foundSpace);
          if (foundSpace.nda?.required && foundSpace.nda.fileUrl) {
              setNdaFile({
                  id: 'nda-file',
                  name: foundSpace.nda.fileName || 'NDA',
                  type: 'PDF',
                  createdAt: new Date().toISOString(),
                  views: 0,
                  storagePath: '',
                  contentUrl: foundSpace.nda.fileUrl,
              });
          }
          
          if (session.email) {
            setEmail(session.email);
            setStep(foundSpace.nda?.required && !session.ndaSigned ? 'nda' : 'done');
          } else {
            setStep('email');
          }
        }
      }
    }
    setIsLoading(false);
  }, [spaceId, findSpace, searchParams, router]);

  useEffect(() => {
      if (step === 'done') {
          // Pass the email to the view page
          const sessionKey = `viewer_session_${spaceId}`;
          const session = JSON.parse(sessionStorage.getItem(sessionKey) || '{}');
          if(session.email) {
             sessionStorage.setItem(`viewer_email_for_${spaceId}`, session.email);
          }
          router.replace(`/space/${spaceId}/view?visitId=${session.visitId}`);
      }
  }, [step, spaceId, router]);


  const handleEmailContinue = () => {
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      toast({
        variant: 'destructive',
        title: 'Invalid Email',
        description: 'Please enter a valid email address.',
      });
      return;
    }
    
    const visitId = `visit_${Date.now()}`;
    const sessionKey = `viewer_session_${spaceId}`;
    const session = JSON.parse(sessionStorage.getItem(sessionKey) || '{}');
    session.email = email;
    session.visitId = visitId;
    sessionStorage.setItem(sessionKey, JSON.stringify(session));

    // Create the initial visit record now
    const { device, os } = getDeviceAndOS();
    const newVisit: Visit = {
      id: visitId,
      name: email.split('@')[0],
      email: email,
      account: "Unknown",
      isInternal: false,
      time: format(new Date(), 'PPpp'),
      link: "Direct",
      duration: "00:00",
      durationSeconds: 0,
      device,
      os,
      location: 'Unknown',
      signed: false,
      viewPercentage: 0,
      pageViews: {},
    };
    
    if (space) {
        updateSpace({
            id: space.id,
            visits: [...(space.visits || []), newVisit],
        });
    }

    toast({
      title: 'Email Verified',
    });
    
    if (space?.nda?.required) {
        setStep('nda');
    } else {
        session.ndaSigned = true; // No NDA required
        sessionStorage.setItem(sessionKey, JSON.stringify(session));
        setStep('done');
    }
  };
  
  const handleNdaAgree = () => {
      if (!signature) {
          toast({
              variant: 'destructive',
              title: 'Signature Required',
              description: 'Please sign the agreement to continue.',
          });
          return;
      }
      const sessionKey = `viewer_session_${spaceId}`;
      const session = JSON.parse(sessionStorage.getItem(sessionKey) || '{}');
      session.ndaSigned = true;
      sessionStorage.setItem(sessionKey, JSON.stringify(session));
      
      if(space && session.visitId) {
          const updatedVisits = (space.visits || []).map(v => v.id === session.visitId ? { ...v, signed: true } : v);
          updateSpace({ id: space.id, visits: updatedVisits });
      }

      toast({
          title: 'Agreement Signed',
          description: 'You can now access the space.',
      });
      setStep('done');
  }

  const clearSignature = () => {
    sigCanvas.current?.clear();
    setSignature(null);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-muted">
        <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!space) {
    return (
       <div className="flex items-center justify-center min-h-screen bg-muted p-4">
        <Card className="w-full max-w-md text-center">
            <CardHeader>
                <CardTitle>Space Not Found</CardTitle>
                <CardDescription>The space you are trying to access does not exist.</CardDescription>
            </CardHeader>
        </Card>
      </div>
    );
  }
  
  if (step === 'email') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-muted p-4">
          <Card className="w-full max-w-md">
              <CardHeader className="text-center">
                  <div className="mx-auto bg-primary/10 text-primary p-3 rounded-full w-fit mb-4">
                      <Mail className="h-8 w-8" />
                  </div>
                  <CardTitle>View "{space.title}"</CardTitle>
                  <CardDescription>
                      To continue, please enter your email address.
                  </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                  <div className="space-y-2">
                      <Label htmlFor="email">Email address</Label>
                      <Input 
                          id="email" 
                          type="email" 
                          placeholder="your@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleEmailContinue()}
                      />
                  </div>
                  <Button onClick={handleEmailContinue} className="w-full">
                      Continue
                  </Button>
                   <p className="text-xs text-muted-foreground text-center pt-2">
                      <ShieldCheck className="inline-block h-3 w-3 mr-1" />
                      Your email is used for analytics and will be shared with the owner.
                  </p>
              </CardContent>
          </Card>
      </div>
    );
  }
  
  if (step === 'nda') {
    return (
        <div className="min-h-screen bg-muted p-4 sm:p-8 flex items-center justify-center">
            <Card className="w-full max-w-4xl">
                <CardHeader>
                    <CardTitle>Agreement Required</CardTitle>
                    <CardDescription>Please review and sign the agreement below to access "{space.title}".</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-lg h-[50vh] overflow-hidden mb-4">
                       {ndaFile ? <FileViewer file={ndaFile} open={true} onOpenChange={() => {}} /> : <div className="flex items-center justify-center h-full text-muted-foreground">Agreement document not found.</div>}
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Draw your signature below</Label>
                            <div className="border rounded-lg bg-white">
                                <SignatureCanvas
                                    ref={sigCanvas}
                                    penColor='black'
                                    canvasProps={{className: 'w-full h-32'}}
                                    onEnd={() => setSignature(sigCanvas.current?.toDataURL() || null)}
                                />
                            </div>
                             <Button variant="link" size="sm" className="p-0 h-auto" onClick={clearSignature}>Clear Signature</Button>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="terms" />
                            <label
                            htmlFor="terms"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                            I agree to be legally bound by this document.
                            </label>
                        </div>
                        <Button onClick={handleNdaAgree} className="w-full" disabled={!signature}>
                             <Pen className="mr-2 h-4 w-4" />
                            Agree & Continue
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
  }

  return (
      <div className="flex items-center justify-center min-h-screen bg-muted">
        <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
      </div>
  );
}
