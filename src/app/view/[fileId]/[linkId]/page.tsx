// src/app/view/[fileId]/[linkId]/page.tsx
//
// Standalone, PUBLIC agreement-signing page. Lives OUTSIDE the (app)
// route group on purpose, so it does NOT get the dashboard sidebar/header
// chrome - a recipient (who may not even have a VentureThrust account)
// sees a clean, full-screen DocSend-style signing experience.
//
// Data comes from /api/agreements/view (service-role, DB-backed) - never
// from the owner's in-memory folder tree - so anyone with the link can
// open it. Interactions (opened / signed) post to /api/agreements/access
// which notifies the owner.

'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { InactiveLink } from '@/components/inactive-link';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import {
  Loader2, Type, ChevronLeft, ChevronRight, FileWarning,
  Link2Off, ClipboardCheck, CheckCircle2, PenLine,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import SignatureCanvas from 'react-signature-canvas';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { PlacedField } from '@/app/(app)/agreements/edit/_components/agreement-editor';
import { fieldTypes } from '@/app/(app)/agreements/edit/_components/agreement-editor';
// pdf-shim loads pdfjs UMD from CDN at runtime - bypasses the react-pdf
// Webpack ESM crash. Same component used by the agreement editor.
import { Document, Page } from '@/components/pdf-shim';
import { format } from 'date-fns';

// The shape returned by /api/agreements/view.
type ViewFile = {
  id: string;
  name: string;
  contentUrl: string | null;
  agreementFields: PlacedField[];
  signerEmails: string[];
  account: string | null;
};

const getDeviceAndOS = () => {
  if (typeof window === 'undefined') return { device: 'Unknown', os: 'Unknown' };
  const ua = navigator.userAgent;
  let os = 'Unknown';
  if (/android/i.test(ua)) os = 'Android';
  if (/iPad|iPhone|iPod/.test(ua)) os = 'iOS';
  if (/windows phone/i.test(ua)) os = 'Windows Phone';
  else if (/mac/i.test(ua)) os = 'macOS';
  else if (/windows/i.test(ua)) os = 'Windows';
  else if (/linux/i.test(ua)) os = 'Linux';
  const device = /Mobi|Android/i.test(ua) ? 'Mobile' : 'Desktop';
  return { device, os };
};

type FieldValue = string | { type: 'typed' | 'drawn'; value: string };

export default function ViewFilePage() {
  const params = useParams();
  const { fileId, linkId } = params as { fileId: string; linkId: string };
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  // When reached from a file's per-file agreement gate, `next` returns the
  // visitor to that file after signing; email/name prefill the info step.
  const nextUrl = searchParams.get('next');

  const [file, setFile] = useState<ViewFile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInvalid, setIsInvalid] = useState(false);
  const [invalidReason, setInvalidReason] = useState<string | null>(null);
  const [session, setSession] = useState<{ name?: string; email?: string; startTime?: number }>({});
  const [step, setStep] = useState<'info' | 'view'>('info');

  // Info gate (prefilled when arriving from a file's agreement gate)
  const [name, setName] = useState(searchParams.get('name') ?? '');
  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [isContinuing, setIsContinuing] = useState(false);

  // Field state
  const [fieldValues, setFieldValues] = useState<Record<string, FieldValue>>({});
  const [editingField, setEditingField] = useState<PlacedField | null>(null);

  // Signature dialog state
  const [isSignatureDialogOpen, setIsSignatureDialogOpen] = useState(false);
  const [isConfirmationDialogOpen, setIsConfirmationDialogOpen] = useState(false);
  const [isSigningComplete, setIsSigningComplete] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  // DocSend-style final consent: the recipient must tick the
  // "I agree to use electronic records…" box before "Complete signing"
  // is enabled.
  const [agreeChecked, setAgreeChecked] = useState(false);
  const [signatureToConfirm, setSignatureToConfirm] = useState<{ type: 'typed' | 'drawn'; value: string } | null>(null);
  const [activeSignatureField, setActiveSignatureField] = useState<PlacedField | null>(null);
  const [typedSignature, setTypedSignature] = useState('');
  const sigCanvas = useRef<SignatureCanvas>(null);

  // PDF state
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  // Responsive page width: 820px on desktop, shrink to fit on phones.
  // Fields are positioned in % of the page, so they scale along with it -
  // a fixed 820 made phones show a zoomed, horizontally cut-off document
  // with the signature fields pushed off screen.
  const [pageWidth, setPageWidth] = useState(820);
  useEffect(() => {
    const compute = () => setPageWidth(Math.min(820, window.innerWidth - 24));
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);
  // Fields were placed relative to the desktop page; scale them with it so
  // they keep the same proportion to the document on every screen.
  const fieldScale = pageWidth / 820;

  // PHONES: one page at a time (chevrons to move), like the deck viewer.
  // Small screens showing several stacked pages read as a zoomed mess and
  // split the per-page timing.
  const [isMobilePaged, setIsMobilePaged] = useState(false);
  useEffect(() => {
    setIsMobilePaged(window.matchMedia('(max-width: 767px)').matches);
  }, []);

  // Signed-and-done popup (DocSend-style ceremony end).
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);

  // ── Per-page dwell tracking ──────────────────────────────────────────────
  // Accumulates seconds spent on each page so the owner's analytics can
  // show which page got the most attention. `pageTimesRef` is the running
  // tally; `pageEnterRef` is the timestamp the current page was shown.
  const pageTimesRef = useRef<Record<number, number>>({});
  const pageEnterRef = useRef<number>(Date.now());
  // Mirror of `pageNumber` so the heartbeat/unload sender can bank the
  // current page's time without capturing a stale value in its closure.
  const pageNumberRef = useRef<number>(1);

  // Flush the time spent on the page we're leaving into the tally.
  const flushPageTime = (page: number) => {
    const elapsed = Math.round((Date.now() - pageEnterRef.current) / 1000);
    if (elapsed > 0) {
      pageTimesRef.current[page] = (pageTimesRef.current[page] ?? 0) + elapsed;
    }
    pageEnterRef.current = Date.now();
  };

  // Refs to each rendered page wrapper - used by the scroll Intersection
  // Observer to know which page is currently in view (for the header
  // indicator + per-page dwell timing) and by the chevrons to scroll.
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const allAgreementFields = file?.agreementFields ?? [];

  // Whether the agreement has a placed signature field. If it doesn't (e.g. a
  // plain uploaded PDF used as a gate), we offer a fallback "Sign here" so the
  // recipient ALWAYS has a way to sign.
  const hasPlacedSignature = allAgreementFields.some(
    (f) => f.type === 'signature' || f.type === 'initials',
  );
  const FALLBACK_SIG_ID = '__fallback_sig__';
  const fallbackSigField = { id: FALLBACK_SIG_ID, type: 'signature', x: 12, y: 68, page: 1 } as PlacedField;
  const fallbackSigned = (() => {
    const v = fieldValues[FALLBACK_SIG_ID];
    return !!v && (typeof v === 'string' ? v.trim() !== '' : !!v.value);
  })();

  const requiredFieldsFilled = useMemo(() => {
    const placedOk = allAgreementFields.length === 0
      ? true
      : allAgreementFields.every((field) => {
          const value = fieldValues[field.id];
          if (!value) return false;
          if (typeof value === 'string') return value.trim() !== '';
          if (typeof value === 'object') return !!value.value;
          return false;
        });
    // A signature is always required - either a placed one (covered by placedOk)
    // or the fallback signature when the doc has none.
    if (hasPlacedSignature) return placedOk;
    const v = fieldValues[FALLBACK_SIG_ID];
    const fbOk = !!v && (typeof v === 'string' ? v.trim() !== '' : !!v.value);
    return placedOk && fbOk;
  }, [allAgreementFields, fieldValues, hasPlacedSignature]);

  // ── Load the agreement from the DB-backed API ────────────────────────────
  useEffect(() => {
    if (!fileId || !linkId) {
      setIsInvalid(true);
      setIsLoading(false);
      return;
    }
    let cancelled = false;

    (async () => {
      try {
        const gateQS = searchParams.get('gate') === '1' ? '&gate=1' : '';
        // Send-by-email arrivals carry the share token; it authorizes the
        // load when this link isn't in the file's own links array.
        const st = searchParams.get('st');
        const stQS = st ? `&st=${encodeURIComponent(st)}` : '';
        const res = await fetch(
          `/api/agreements/view?fileId=${encodeURIComponent(fileId)}&linkId=${encodeURIComponent(linkId)}${gateQS}${stQS}`,
          { cache: 'no-store' },
        );
        const json = await res.json();
        if (cancelled) return;

        if (!res.ok || !json.ok) {
          setInvalidReason(typeof json.error === 'string' ? json.error : 'error');
          setIsInvalid(true);
          setIsLoading(false);
          return;
        }

        const loaded: ViewFile = json.file;
        setFile(loaded);
        setIsInvalid(false);

        // Resume an existing session (same browser, already entered name/email)
        const sessionKey = `viewer_session_file_${fileId}_${linkId}`;
        const existing = JSON.parse(sessionStorage.getItem(sessionKey) || '{}');
        if (existing.name && existing.email) {
          setSession({ ...existing, startTime: Date.now() });
          setName(existing.name);
          setEmail(existing.email);
          setStep('view');

          const initialValues: Record<string, FieldValue> = {};
          loaded.agreementFields.forEach((field) => {
            if (field.type === 'email') initialValues[field.id] = existing.email;
            if (field.type === 'name') initialValues[field.id] = existing.name;
            if (field.type === 'date-signed') initialValues[field.id] = format(new Date(), 'MM/dd/yyyy');
          });
          setFieldValues(initialValues);

          // Already signed? → view-only mode (we don't restore other
          // signers' field data; just lock editing).
          if (loaded.signerEmails.includes(String(existing.email).toLowerCase())) {
            setIsSigningComplete(true);
          }
        } else {
          setStep('info');
        }
        setIsLoading(false);
      } catch (err) {
        if (cancelled) return;
        console.error('[agreement-view] load failed:', err);
        setInvalidReason('error');
        setIsInvalid(true);
        setIsLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [fileId, linkId]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => setNumPages(numPages);

  // Chevron nav now SCROLLS to the target page (all pages are rendered
  // stacked). The IntersectionObserver below keeps `pageNumber` in sync
  // as the user scrolls, so the header indicator is always correct.
  const changePage = (offset: number) => {
    const next = pageNumber + offset;
    if (!numPages || next < 1 || next > numPages) return;
    if (isMobilePaged) {
      // Paged mode renders one page: bank its time and switch.
      flushPageTime(pageNumber);
      setPageNumber(next);
      return;
    }
    pageRefs.current.get(next)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // "Start signing": jump to the first field still waiting for input.
  const goToFirstUnfilledField = () => {
    const target = allAgreementFields.find((f) => {
      const v = fieldValues[f.id];
      return !v || (typeof v === 'string' ? v.trim() === '' : !v.value);
    }) ?? allAgreementFields[0];
    if (!target) return;
    if (isMobilePaged) {
      if (target.page !== pageNumber) {
        flushPageTime(pageNumber);
        setPageNumber(target.page);
      }
    } else {
      pageRefs.current.get(target.page)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Track the currently-visible page via IntersectionObserver. When the
  // most-visible page changes, bank the previous page's dwell time and
  // update the header indicator. Re-runs when numPages becomes known.
  useEffect(() => {
    // Paged mode has no stacked scroll to observe.
    if (!numPages || step !== 'view' || isMobilePaged) return;
    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the entry with the largest visible ratio.
        let best: { page: number; ratio: number } | null = null;
        for (const e of entries) {
          const p = Number((e.target as HTMLElement).dataset.page);
          if (!Number.isFinite(p)) continue;
          if (!best || e.intersectionRatio > best.ratio) best = { page: p, ratio: e.intersectionRatio };
        }
        if (best && best.ratio > 0.4) {
          setPageNumber((prev) => {
            if (prev !== best!.page) flushPageTime(prev);
            return best!.page;
          });
        }
      },
      { threshold: [0.25, 0.5, 0.75] },
    );
    // Observe all currently-registered page wrappers.
    pageRefs.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [numPages, step, isMobilePaged]);

  // Keep the page-number mirror in sync for the progress sender.
  useEffect(() => { pageNumberRef.current = pageNumber; }, [pageNumber]);

  // ── Per-page dwell, persisted for EVERY session (not just signers) ───────
  // The signed flow snapshots pageViews on submit, but a recipient who reads
  // the agreement without signing would otherwise record zero page-attention.
  // This sends the running tally periodically and on leave so the owner's
  // analytics has data for views as well as signs. Stored in a ref so the
  // interval/unload handlers always run the latest closure.
  const sendProgressRef = useRef<(useBeacon?: boolean) => void>(() => {});
  sendProgressRef.current = (useBeacon = false) => {
    if (!session.name || !session.email) return;
    // Bank the current page's elapsed time, then snapshot the cumulative tally.
    flushPageTime(pageNumberRef.current);
    const pageViews = { ...pageTimesRef.current };
    if (Object.keys(pageViews).length === 0) return;
    const durationSeconds = session.startTime
      ? Math.round((Date.now() - session.startTime) / 1000)
      : 0;
    const { device, os } = getDeviceAndOS();
    const body = JSON.stringify({
      fileId, linkId, name: session.name, email: session.email,
      action: 'progress', durationSeconds, device, os, pageViews,
      numPages: numPages ?? 0,
    });
    if (useBeacon && typeof navigator !== 'undefined' && navigator.sendBeacon) {
      try { navigator.sendBeacon('/api/agreements/access', new Blob([body], { type: 'application/json' })); } catch { /* ignore */ }
    } else {
      // keepalive lets the request outlive a navigation if not using a beacon.
      fetch('/api/agreements/access', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
    }
  };

  useEffect(() => {
    // Only run while actively viewing an unsigned agreement.
    if (step !== 'view' || !session.email || isSigningComplete) return;
    const id = setInterval(() => sendProgressRef.current(false), 15000);
    const onHide = () => sendProgressRef.current(true);
    const onVisibility = () => { if (document.visibilityState === 'hidden') sendProgressRef.current(true); };
    window.addEventListener('pagehide', onHide);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearInterval(id);
      window.removeEventListener('pagehide', onHide);
      document.removeEventListener('visibilitychange', onVisibility);
      // Final flush when leaving the view (navigation, signing, unmount).
      sendProgressRef.current(true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, session.email, isSigningComplete]);

  // ── Info gate → record "opened" + notify owner, then enter view step ─────
  const handleInfoContinue = async () => {
    if (!name || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      toast({
        variant: 'destructive',
        title: 'Invalid Information',
        description: 'Please enter a valid name and email address.',
      });
      return;
    }
    setIsContinuing(true);

    const sessionKey = `viewer_session_file_${fileId}_${linkId}`;
    const newSession = { name, email, startTime: Date.now() };
    sessionStorage.setItem(sessionKey, JSON.stringify(newSession));
    setSession(newSession);

    // Pre-fill auto fields
    const initialValues: Record<string, FieldValue> = {};
    (file?.agreementFields ?? []).forEach((field) => {
      if (field.type === 'email') initialValues[field.id] = email;
      if (field.type === 'name') initialValues[field.id] = name;
      if (field.type === 'date-signed') initialValues[field.id] = format(new Date(), 'MM/dd/yyyy');
    });
    setFieldValues(initialValues);

    // Fire-and-forget: notify the owner that the agreement was opened.
    const { device, os } = getDeviceAndOS();
    fetch('/api/agreements/access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileId, linkId, name, email, action: 'opened', device, os }),
    }).catch(() => {});

    setStep('view');
    setIsContinuing(false);
  };

  const handleFieldClick = (field: PlacedField) => {
    if (isSigningComplete) return;
    if (fieldValues[field.id] && field.type !== 'signature' && field.type !== 'initials') return;

    if (field.type === 'signature' || field.type === 'initials') {
      setActiveSignatureField(field);
      setTypedSignature(session.name || '');
      setIsSignatureDialogOpen(true);
    } else if (['text', 'company', 'title'].includes(field.type)) {
      setEditingField(field);
    }
  };

  const handleAcceptSignature = (type: 'typed' | 'drawn') => {
    if (!activeSignatureField) return;
    let signatureValue: string | null = null;
    if (type === 'typed') {
      if (!typedSignature) {
        toast({ variant: 'destructive', title: 'Name is required' });
        return;
      }
      signatureValue = typedSignature;
    } else {
      if (sigCanvas.current?.isEmpty()) {
        toast({ variant: 'destructive', title: 'Signature is required' });
        return;
      }
      signatureValue = sigCanvas.current?.toDataURL() || null;
    }
    if (signatureValue) {
      setSignatureToConfirm({ type, value: signatureValue });
      setIsSignatureDialogOpen(false);
      setIsConfirmationDialogOpen(true);
    }
  };

  const handleConfirmAndSign = () => {
    if (signatureToConfirm && activeSignatureField) {
      setFieldValues((prev) => ({ ...prev, [activeSignatureField.id]: signatureToConfirm }));
    }
    setIsConfirmationDialogOpen(false);
    setSignatureToConfirm(null);
    setActiveSignatureField(null);
    sigCanvas.current?.clear();
    setTypedSignature('');
  };

  const handleTextInputSave = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && editingField) {
      setFieldValues((prev) => ({ ...prev, [editingField.id]: (e.target as HTMLInputElement).value }));
      setEditingField(null);
    }
  };

  // ── Finalize: record "signed" + notify owner ─────────────────────────────
  const handleDoneSigning = async () => {
    if (!file || !session.name || !session.email) return;
    setIsFinalizing(true);

    const durationSeconds = session.startTime
      ? Math.round((Date.now() - session.startTime) / 1000)
      : 0;
    const { device, os } = getDeviceAndOS();

    // Bank the time spent on the current page, then snapshot the tally.
    flushPageTime(pageNumber);
    const pageViews = { ...pageTimesRef.current };

    try {
      const res = await fetch('/api/agreements/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileId,
          linkId,
          name: session.name,
          email: session.email,
          action: 'signed',
          fieldValues,
          durationSeconds,
          device,
          os,
          pageViews,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || 'sign_failed');

      setIsSigningComplete(true);
      setIsSuccessOpen(true);

      // If this was a per-file agreement gate, return to the file (now
      // unlocked) - give the success popup a moment to be read.
      if (nextUrl && nextUrl.startsWith('/')) {
        setTimeout(() => router.push(nextUrl), 2500);
      }
    } catch (err) {
      console.error('[agreement-view] sign failed:', err);
      toast({ variant: 'destructive', title: 'Could not submit', description: 'Please try again.' });
    } finally {
      setIsFinalizing(false);
    }
  };

  const clearSignature = () => sigCanvas.current?.clear();

  // Renders a single placed field (signature/text/etc.) as a positioned
  // overlay element. Used per-page in the stacked multi-page view.
  const renderField = (field: PlacedField) => {
    const fieldValue = fieldValues[field.id];
    const fieldInfo = fieldTypes.find((f) => f.id === field.type);
    const Icon = fieldInfo?.icon || Type;
    const isFilled = !!fieldValue && (typeof fieldValue === 'string' ? fieldValue.trim() !== '' : !!fieldValue.value);

    let displayValue: React.ReactNode;
    if (isFilled && editingField?.id !== field.id) {
      if (typeof fieldValue === 'object' && fieldValue.type === 'drawn') {
        displayValue = <img src={fieldValue.value} alt="signature" className="h-12 object-contain pointer-events-none" />;
      } else if (typeof fieldValue === 'object' && fieldValue.type === 'typed') {
        displayValue = <div className="px-1 pointer-events-none"><span className="text-2xl font-signature">{fieldValue.value}</span></div>;
      } else {
        displayValue = <div className="px-1 pointer-events-none"><span className="text-sm">{fieldValue as string}</span></div>;
      }
    } else if (editingField?.id === field.id) {
      displayValue = (
        <div className="pointer-events-auto">
          <Input
            autoFocus
            onBlur={() => setEditingField(null)}
            onKeyDown={handleTextInputSave}
            className="h-8 p-1"
            defaultValue={(fieldValues[field.id] as string) || ''}
          />
        </div>
      );
    } else {
      // DocSend-style compact tag: a small cyan box sitting ON the line.
      displayValue = (
        <div className="flex items-center gap-1.5 px-2 py-1 border border-cyan-500 bg-cyan-100/90 rounded-[3px] pointer-events-auto cursor-pointer hover:bg-cyan-200/90">
          <Icon className="h-3.5 w-3.5 text-cyan-800" />
          <span className="text-xs font-medium text-cyan-900 whitespace-nowrap">{fieldInfo?.name || 'Field'}</span>
        </div>
      );
    }

    return (
      <div
        key={field.id}
        className="absolute"
        style={{
          left: `${field.x}%`,
          top: `${field.y}%`,
          // Fields keep their proportion to the document on small screens
          // (they were placed against the 820px desktop render).
          transform: `scale(${fieldScale})`,
          transformOrigin: 'top left',
        }}
        onClick={() => handleFieldClick(field)}
      >
        {displayValue}
      </div>
    );
  };

  // ── Render: loading / invalid / not-found ────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-muted">
        <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isInvalid || !file) {
    // Inactive (disabled / expired / owner plan lapsed): show the email-capture
    // + reactivate/message flow, same as space links. The reason is never shown.
    // A genuinely missing file falls through to a neutral not-available card.
    if (invalidReason === 'disabled' || invalidReason === 'expired') {
      return <InactiveLink fileId={fileId} />;
    }
    return (
      <div className="flex items-center justify-center min-h-screen bg-muted p-4 sm:p-8">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center items-center gap-4">
            <div className="rounded-full border border-destructive/20 bg-destructive/10 p-3">
              <Link2Off className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl">This link is not available</CardTitle>
            <CardDescription className="pt-2">
              This document link could not be found. Please check the URL or contact the sender.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // ── Render: info gate (DocSend-style) ────────────────────────────────────
  if (step === 'info') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 p-4">
        <Card className="w-full max-w-md bg-white text-gray-900">
          <CardHeader className="text-center">
            <CardTitle>{file.name || 'Someone'} requests your action to continue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Your Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-gray-100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleInfoContinue()}
                className="bg-gray-100"
              />
            </div>
            <p className="text-xs text-gray-500">
              This information will be shared with the owner. Learn more about how we use and protect your data in our Privacy Policy.
            </p>
            <Button
              onClick={handleInfoContinue}
              disabled={isContinuing}
              className="w-full bg-black text-white hover:bg-gray-800"
            >
              {isContinuing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Continue'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Render: success screen (after signing, or returning signer) ─────────
  if (isSigningComplete) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-600 to-blue-700 p-6">
        <div className="w-full max-w-lg text-center text-white">
          <div className="mx-auto mb-8 h-28 w-28 rounded-full bg-white/15 flex items-center justify-center">
            <ClipboardCheck className="h-14 w-14 text-white" />
          </div>
          <h1 className="text-4xl font-semibold tracking-tight">Document completed!</h1>
          <p className="mt-4 text-base text-blue-50 leading-relaxed max-w-md mx-auto">
            <span className="font-semibold">Thank you for using VentureThrust.</span>{' '}
            Keep an eye on your email inbox for a copy of the signed document. You may now close this window.
          </p>
        </div>
      </div>
    );
  }

  // ── Render: document + signature fields ──────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-gray-200">
      <header className="flex-shrink-0 bg-white shadow-sm p-2 flex justify-between items-center z-20">
        <h2 className="text-lg font-semibold truncate px-4">{file.name}</h2>
        {numPages && (
          <div className="flex items-center justify-center gap-2">
            <Button variant="ghost" size="icon" disabled={pageNumber <= 1} onClick={() => changePage(-1)}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <span>{pageNumber} / {numPages}</span>
            <Button variant="ghost" size="icon" disabled={pageNumber >= numPages} onClick={() => changePage(1)}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        )}
      </header>

      {/* DocSend-style request banner: tells the recipient a signature is
          expected and jumps them to the first empty field. Hidden once all
          fields are filled (the confirmation banner takes over) or signed. */}
      {!isSigningComplete && hasPlacedSignature && !requiredFieldsFilled && (
        <div className="flex-shrink-0 bg-blue-50 border-b border-blue-100 px-4 sm:px-8 py-3 z-10">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">eSignature required</p>
              <p className="text-sm text-gray-700">You are requested to review and sign this document.</p>
            </div>
            <Button onClick={goToFirstUnfilledField} className="bg-gray-900 hover:bg-gray-800 text-white shrink-0">
              <PenLine className="mr-2 h-4 w-4" />
              Start signing
            </Button>
          </div>
        </div>
      )}

      {/* Fallback signature - when the agreement has NO placed signature field,
          the recipient still needs a way to sign. Show a prompt + "Sign here". */}
      {!isSigningComplete && !hasPlacedSignature && !fallbackSigned && (
        <div className="flex-shrink-0 bg-amber-50 border-b border-amber-100 px-4 sm:px-8 py-4 z-10">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-sm text-gray-800">Add your signature to accept this agreement.</p>
            <Button
              onClick={() => handleFieldClick(fallbackSigField)}
              className="bg-gray-900 hover:bg-gray-800 text-white shrink-0"
            >
              Sign here
            </Button>
          </div>
        </div>
      )}

      {/* DocSend-style confirmation banner - sticky under the header.
          Shows once all fields are filled; the recipient must tick the
          consent box before "Complete signing" enables. */}
      {!isSigningComplete && requiredFieldsFilled && (
        <div className="flex-shrink-0 bg-blue-50 border-b border-blue-100 px-4 sm:px-8 py-4 z-10">
          <div className="max-w-5xl mx-auto">
            <p className="text-sm font-semibold text-gray-900 mb-2">Confirmation</p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <label className="flex items-start gap-2.5 cursor-pointer flex-1">
                <Checkbox
                  checked={agreeChecked}
                  onCheckedChange={(c) => setAgreeChecked(c === true)}
                  className="mt-0.5"
                />
                <span className="text-sm text-gray-700 leading-snug">
                  I agree to use electronic records and signatures and to VentureThrust&apos;s{' '}
                  <span className="underline">Terms of Service</span>. By signing, I confirm that I
                  have reviewed and agree to the contents of this document.
                </span>
              </label>
              <Button
                onClick={handleDoneSigning}
                disabled={!agreeChecked || isFinalizing}
                className="bg-gray-900 hover:bg-gray-800 text-white shrink-0"
              >
                {isFinalizing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'I agree. Complete signing'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* All pages rendered stacked in a single scroll container - scrolling
          moves through the document (not just chevron nav). Each page wraps
          a canvas + its own field overlay. */}
      <main className="flex-1 overflow-auto flex flex-col items-center py-4 gap-4">
        <Document
          file={file.contentUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={<Loader2 className="h-8 w-8 animate-spin" />}
          error={<FileWarning className="h-8 w-8 text-destructive" />}
          className="flex flex-col items-center gap-4"
        >
          {(isMobilePaged
            ? [Math.min(pageNumber, numPages ?? 1)]
            : Array.from({ length: numPages ?? 0 }, (_, i) => i + 1)
          ).map((p) => (
            <div
              key={p}
              data-page={p}
              ref={(el) => {
                if (el) pageRefs.current.set(p, el);
                else pageRefs.current.delete(p);
              }}
              className="relative shadow-lg bg-white"
            >
              <Page pageNumber={p} width={pageWidth} renderTextLayer={false} />
              <div className="absolute inset-0">
                {(file.agreementFields ?? [])
                  .filter((field) => field.page === p)
                  .map((field) => renderField(field))}
                {/* Default signature field on the last page when the agreement
                    has no placed signature - so there's always one to sign on. */}
                {!hasPlacedSignature && p === (numPages ?? 1) && renderField({ ...fallbackSigField, page: p })}
              </div>
            </div>
          ))}
        </Document>
      </main>

      {/* (Done footer + completed dialog removed - the sticky confirmation
          banner with the consent checkbox now drives finalization.) */}

      {/* Success ceremony: signed, sealed, copy on its way. */}
      <Dialog open={isSuccessOpen} onOpenChange={setIsSuccessOpen}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center gap-3 py-2 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-green-50">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </span>
            <DialogTitle className="text-xl">Document signed successfully</DialogTitle>
            <p className="text-sm text-muted-foreground">
              You have signed <strong>{file?.name}</strong>. A copy of the signed document will be
              sent to <strong>{session.email}</strong> for your records.
            </p>
            <Button className="mt-2 w-full bg-gray-900 text-white hover:bg-gray-800" onClick={() => setIsSuccessOpen(false)}>
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isSignatureDialogOpen} onOpenChange={setIsSignatureDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Your Signature</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="type">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="type">Type</TabsTrigger>
              <TabsTrigger value="draw">Draw</TabsTrigger>
            </TabsList>
            <TabsContent value="type" className="p-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="typed-name">Full Name</Label>
                <div className="relative border-b-2">
                  <Input
                    id="typed-name"
                    value={typedSignature}
                    onChange={(e) => setTypedSignature(e.target.value)}
                    placeholder="Type your name"
                    className="bg-transparent text-3xl font-signature h-20 p-4 border-none !ring-0 !outline-none"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">By clicking &apos;Accept Signature&apos;, you agree that your typed name will be your electronic signature.</p>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setIsSignatureDialogOpen(false)}>Cancel</Button>
                <Button onClick={() => handleAcceptSignature('typed')}>Accept Signature</Button>
              </DialogFooter>
            </TabsContent>
            <TabsContent value="draw" className="space-y-4">
              <div className="border rounded-lg bg-white">
                <SignatureCanvas ref={sigCanvas} penColor="black" canvasProps={{ className: 'w-full h-40' }} />
              </div>
              <Button variant="link" size="sm" className="p-0 h-auto" onClick={clearSignature}>Clear Signature</Button>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setIsSignatureDialogOpen(false)}>Cancel</Button>
                <Button onClick={() => handleAcceptSignature('drawn')}>Accept Signature</Button>
              </DialogFooter>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <Dialog open={isConfirmationDialogOpen} onOpenChange={setIsConfirmationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Your Signature</DialogTitle>
            <DialogDescription>Review your signature. By clicking &quot;Accept Signature&quot;, you agree that your signature will be legally binding.</DialogDescription>
          </DialogHeader>
          <div className="py-4 flex justify-center items-center h-32 border-y my-4">
            {signatureToConfirm?.type === 'typed' ? (
              <span className="text-4xl font-signature">{signatureToConfirm.value}</span>
            ) : (
              <img src={signatureToConfirm?.value} alt="Signature Preview" className="max-h-24" />
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setIsConfirmationDialogOpen(false); setIsSignatureDialogOpen(true); }}>Cancel</Button>
            <Button onClick={handleConfirmAndSign}>Accept Signature</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
