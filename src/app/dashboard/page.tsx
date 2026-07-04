'use client';

import { useState, useRef, useEffect } from 'react';
import { UploadCloud, FileText, CheckCircle, ArrowRight, Layers, ChevronRight, Plus, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useUser } from '@/hooks/use-user';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { getEffectiveOwnerId } from '@/lib/workspace';
import { formatDistanceToNow } from 'date-fns';
import { UpcomingFeatureDialog } from '@/components/upcoming-feature-dialog';
import { ProductTour, type TourStep } from '@/components/product-tour';
import { MissedVisitors } from '@/components/missed-visitors';
import { InvestorWelcome } from '@/components/investor-welcome';

// Guided first-run tour: spotlights the real nav items so a new user learns
// what each part of the workspace does. Shows once, then never again.
const DASHBOARD_TOUR: TourStep[] = [
  {
    title: 'Welcome to VentureThrust',
    description: 'Let me show you around in 30 seconds. Here is what each part of your workspace does.',
  },
  {
    selector: '[href="/spaces"]',
    title: 'Spaces are your data rooms',
    description: 'Create a secure space for each deal or company, fill it with documents, and share it with investors.',
  },
  {
    selector: '[href="/content-library"]',
    title: 'Your Content Library',
    description: 'Keep every document in one place and reuse files across multiple spaces without uploading them again.',
  },
  {
    selector: '[href="/file-requests"]',
    title: 'Request files from anyone',
    description: 'Send a link and people can upload documents straight into your data room, even without an account.',
  },
  {
    selector: '[href="/agreements"]',
    title: 'Gate access with agreements',
    description: 'Add an NDA or any document that viewers must sign before they can open your files.',
  },
  {
    selector: '[href="/analytics"]',
    title: 'Track every view',
    description: 'See who opened your room, which pages they read, and for how long, so you know where the real interest is.',
  },
  {
    selector: '[href="/dashboard/shared-with-me"]',
    title: 'Shared with you',
    description: 'Data rooms and reports that other people share with your email all show up here.',
  },
];

export default function Dashboard() {
  const { user, loading } = useUser();
  const router = useRouter();

  // Investor accounts get the InvestorWelcome popup INSTEAD of the founder
  // product tour. Rendering both at once froze the page: the welcome dialog
  // locks pointer events while the tour's Next/Skip buttons sit beneath it.
  // null = still resolving, render neither.
  const [isInvestorAccount, setIsInvestorAccount] = useState<boolean | null>(null);
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const uid = session?.user?.id;
        if (!uid) { if (active) setIsInvestorAccount(false); return; }
        const { data } = await supabase
          .from('profiles')
          .select('is_investor')
          .eq('id', uid)
          .maybeSingle();
        if (active) setIsInvestorAccount((data as { is_investor?: boolean } | null)?.is_investor === true);
      } catch {
        if (active) setIsInvestorAccount(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [waitlistOpen, setWaitlistOpen] = useState(false);

  // ── User's spaces - populates the "My Data Room" card with real data ──
  type UserSpace = { id: string; name: string | null; title: string | null; created_at: string };
  const [userSpaces, setUserSpaces] = useState<UserSpace[]>([]);
  const [spacesLoading, setSpacesLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const loadSpaces = async () => {
      setSpacesLoading(true);
      try {
        // Scope to the ACTIVE workspace owner (the user's own, or a shared
        // workspace they're logged into) - same scoping as the /spaces page.
        const ownerId = await getEffectiveOwnerId();
        if (!ownerId) {
          if (!cancelled) setSpacesLoading(false);
          return;
        }
        const { data, error } = await supabase
          .from('spaces')
          .select('id, name, title, created_at')
          .eq('created_by', ownerId)
          // Exclude the internal content-library sentinel space
          .neq('title', 'CONTENT_LIBRARY')
          .order('created_at', { ascending: false });
        if (cancelled) return;
        if (error) {
          console.warn('Could not load spaces:', error.message);
        } else if (data) {
          setUserSpaces(data as UserSpace[]);
        }
      } finally {
        if (!cancelled) setSpacesLoading(false);
      }
    };
    loadSpaces();
    return () => { cancelled = true; };
  }, [user]);

  if (loading || !user) return null;

  const vdrLocked = user.plan === 'ai_only';
  const aiLocked = user.plan === 'vdr_only';
  const isVdrOnly = user.plan === 'vdr_only';
  const isAiOnly = user.plan === 'ai_only';
  const isBoth = user.plan === 'vdr_ai';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setProgress(0);
    setIsAnalyzing(false);
    setAnalysisComplete(false);
  };

  const handleStartAnalysis = () => {
    if (!file) return;
    setIsAnalyzing(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setIsAnalyzing(false);
          setAnalysisComplete(true);
          return 100;
        }
        return p + 10;
      });
    }, 200);
  };

  return (
    <>
      <style>{`
        /* Fonts now load globally from globals.css - no per-page import needed */

        .dash-root * {
          font-family: var(--font-inter), system-ui, sans-serif;
        }
        .dash-heading {
          /* Refined sans - matches the global Inter heading treatment.
             Semibold + tight tracking = professional B2B feel, not ornamental. */
          font-family: var(--font-inter), system-ui, sans-serif;
          font-weight: 600;
          letter-spacing: -0.02em;
          line-height: 1.2;
        }
        .panel-card {
          background: #ffffff;
          border-top: 1px solid #ebebeb;
          transition: none;
        }
        .panel-card:hover {
          box-shadow: none;
        }
        .upload-zone {
          border: 1.5px dashed #d4d4d4;
          border-radius: 14px;
          background: #fafafa;
          transition: border-color 0.2s ease, background 0.2s ease;
        }
        .upload-zone:hover {
          border-color: #1a1a2e;
          background: #f5f5f7;
        }
        .btn-primary {
          background: #1a1a2e;
          color: #ffffff;
          border-radius: 10px;
          font-family: var(--font-inter), system-ui, sans-serif;
          font-weight: 500;
          font-size: 14px;
          padding: 10px 22px;
          border: none;
          cursor: pointer;
          transition: background 0.2s ease, transform 0.1s ease;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .btn-primary:hover {
          background: #2d2d4e;
          transform: translateY(-1px);
        }
        .btn-outline {
          background: #ffffff;
          color: #1a1a2e;
          border-radius: 10px;
          font-family: var(--font-inter), system-ui, sans-serif;
          font-weight: 500;
          font-size: 14px;
          padding: 9px 20px;
          border: 1.5px solid #e0e0e0;
          cursor: pointer;
          transition: border-color 0.2s ease, background 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .btn-outline:hover {
          border-color: #1a1a2e;
          background: #f9f9f9;
        }
        .tag-badge {
          font-family: var(--font-inter), system-ui, sans-serif;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          background: #f0f0f5;
          color: #6b6b8a;
          padding: 4px 10px;
          border-radius: 100px;
        }
      `}</style>

      <div
        className="dash-root"
        style={{
          backgroundColor: '#ffffff',
          minHeight: '100%',
          padding: 'clamp(24px, 5vw, 40px) clamp(16px, 4vw, 32px) 60px',
        }}
      >
        {/* ── Header ── */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <span className="tag-badge">Overview</span>
          </div>
          <h1
            className="dash-heading"
            style={{
              fontSize: 'clamp(26px, 6vw, 42px)',
              fontWeight: 600,
              color: '#0d0d1a',
              letterSpacing: '-0.5px',
              lineHeight: 1.2,
              margin: 0,
              overflowWrap: 'anywhere',
              wordBreak: 'break-word',
            }}
          >
            Welcome back,{' '}
            <span style={{ color: '#3b3b8f', overflowWrap: 'anywhere' }}>{user.firstName}</span>
          </h1>
          <p
            style={{
              fontSize: '15px',
              color: '#888',
              marginTop: '10px',
              fontWeight: 400,
              letterSpacing: '0.01em',
            }}
          >
            Here's a summary of your workspace activity.
          </p>
        </div>

        {/* Re-engagement: who tried to open links while the plan was paused. */}
        <MissedVisitors />

        {/* ── Panels Grid ── */}
        <div
          className={cn(
            'grid gap-0',
            isVdrOnly || isAiOnly ? 'grid-cols-1' : 'grid-cols-1 xl:grid-cols-2'
          )}
          style={{ border: '1px solid #ebebeb', borderRadius: '0px' }}
        >
          {/* MY DATA ROOM */}
          <div
            className={cn(
              'panel-card relative',
              isVdrOnly && 'xl:col-span-2',
              isAiOnly && 'order-2',
              isBoth && 'order-1'
            )}
            style={{
              padding: '28px 28px 32px',
              borderTop: 'none',
              borderRight: !isVdrOnly && !isAiOnly ? '1px solid #ebebeb' : 'none',
            }}
          >
            {/* Card header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <div style={{
                    width: '34px', height: '34px', borderRadius: '10px',
                    background: '#f0f0f8', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <FileText size={16} color="#3b3b8f" />
                  </div>
                  <h2
                    className="dash-heading"
                    style={{ fontSize: '20px', fontWeight: 600, color: '#0d0d1a', margin: 0 }}
                  >
                    My Data Room
                  </h2>
                </div>
                <p style={{ fontSize: '13.5px', color: '#999', margin: 0, paddingLeft: '44px' }}>
                  Access and manage your virtual data room
                </p>
              </div>
              <button className="btn-outline" onClick={() => router.push('/spaces')}>
                Open <ArrowRight size={14} />
              </button>
            </div>

            <div style={{ height: '1px', background: '#f0f0f0', marginBottom: '28px' }} />

            {/* My Data Room body - spaces list if any, else empty state */}
            {spacesLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                <Loader2 size={20} className="animate-spin" color="#999" />
              </div>
            ) : userSpaces.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {userSpaces.slice(0, 5).map((sp) => {
                  const label = sp.name || sp.title || 'Untitled Space';
                  return (
                    <button
                      key={sp.id}
                      onClick={() => router.push(`/spaces/${sp.id}/edit`)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '12px 14px', borderRadius: '12px',
                        border: '1px solid #ebebeb', background: '#fff',
                        textAlign: 'left', cursor: 'pointer',
                        transition: 'border-color 0.15s ease, background 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#c4c4f0';
                        e.currentTarget.style.background = '#fafaff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#ebebeb';
                        e.currentTarget.style.background = '#fff';
                      }}
                    >
                      <div style={{
                        width: '40px', height: '40px', borderRadius: '10px',
                        background: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <Layers size={18} color="#7c3aed" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          fontSize: '14.5px', fontWeight: 600, color: '#0d0d1a',
                          margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                          {label}
                        </p>
                        <p style={{ fontSize: '12px', color: '#999', margin: '2px 0 0' }}>
                          Created {formatDistanceToNow(new Date(sp.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      <ChevronRight size={16} color="#bbb" />
                    </button>
                  );
                })}
                {userSpaces.length > 5 && (
                  <button
                    onClick={() => router.push('/spaces')}
                    style={{
                      padding: '10px', borderRadius: '10px', border: 'none',
                      background: 'transparent', color: '#3b3b8f',
                      fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                    }}
                  >
                    See all {userSpaces.length} spaces <ArrowRight size={13} />
                  </button>
                )}
                <button
                  onClick={() => router.push('/spaces/new')}
                  style={{
                    marginTop: '4px', padding: '12px',
                    borderRadius: '10px', border: '1.5px dashed #d4d4d4',
                    background: 'transparent', color: '#666',
                    fontSize: '13.5px', fontWeight: 500, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  }}
                >
                  <Plus size={14} /> Create new space
                </button>
              </div>
            ) : (
              /* Empty state - no spaces yet */
              <div
                className="upload-zone"
                style={{
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  padding: '64px 40px', textAlign: 'center',
                }}
              >
                <div style={{
                  width: '56px', height: '56px', borderRadius: '16px',
                  background: '#f0f0f8', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', marginBottom: '18px'
                }}>
                  <FileText size={24} color="#3b3b8f" />
                </div>
                <p style={{ fontSize: '15px', fontWeight: 600, color: '#0d0d1a', margin: '0 0 6px' }}>
                  Your Data Room is empty
                </p>
                <p style={{ fontSize: '13.5px', color: '#aaa', margin: '0 0 24px' }}>
                  Upload documents to get started
                </p>
                <button className="btn-primary" onClick={() => router.push('/spaces')}>
                  Go to Data Room <ArrowRight size={14} />
                </button>
              </div>
            )}

            {vdrLocked && (
              <div style={{
                position: 'absolute', inset: 0, zIndex: 10,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                backdropFilter: 'blur(12px)',
                backgroundColor: 'rgba(255,255,255,0.85)',
              }}>
                <p style={{ fontSize: '15px', fontWeight: 600, color: '#0d0d1a', marginBottom: '16px' }}>
                  Virtual Data Room locked
                </p>
                <button className="btn-primary" onClick={() => router.push('/choose-role')}>
                  Upgrade Plan
                </button>
              </div>
            )}
          </div>

          {/* AI RISK SCANNER */}
          <div
            className={cn(
              'panel-card relative flex flex-col',
              isAiOnly && 'xl:col-span-2 order-1',
              isVdrOnly && 'order-2',
              isBoth && 'order-2'
            )}
            style={{ padding: '28px 28px 32px', borderTop: 'none' }}
          >
            {/* Card header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <div style={{
                    width: '34px', height: '34px', borderRadius: '10px',
                    background: '#fff4f0', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <UploadCloud size={16} color="#c25c3a" />
                  </div>
                  <h2
                    className="dash-heading"
                    style={{ fontSize: '20px', fontWeight: 600, color: '#0d0d1a', margin: 0 }}
                  >
                    AI Due Diligence
                  </h2>
                </div>
                <p style={{ fontSize: '13.5px', color: '#999', margin: 0, paddingLeft: '44px' }}>
                  Automated diligence reports, launching soon
                </p>
              </div>
              <span className="tag-badge" style={{ background: '#eef2ff', color: '#3b3b8f' }}>Soon</span>
            </div>

            <div style={{ height: '1px', background: '#f0f0f0', marginBottom: '28px' }} />

            {/* AI due diligence is gated behind a pilot waitlist (pre-launch). */}
            <div
              className="flex-1"
              style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                padding: '56px 40px', textAlign: 'center',
              }}
            >
              <div style={{
                width: '56px', height: '56px', borderRadius: '16px',
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', marginBottom: '18px'
              }}>
                <Sparkles size={24} color="#fff" />
              </div>
              <p style={{ fontSize: '16px', fontWeight: 600, color: '#0d0d1a', margin: '0 0 6px' }}>
                AI Due Diligence is coming soon
              </p>
              <p style={{ fontSize: '13.5px', color: '#999', margin: '0 0 22px', maxWidth: '320px' }}>
                We&apos;re validating accuracy with a small group of professional investors before launch. Join the waitlist for early access.
              </p>
              <button className="btn-primary" onClick={() => setWaitlistOpen(true)}>
                Join the waitlist <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <UpcomingFeatureDialog open={waitlistOpen} onOpenChange={setWaitlistOpen} featureName="AI Due Diligence" />
      {/* Exactly ONE onboarding overlay, never both (they blocked each other):
          founders get the guided tour, investors get the welcome popup. */}
      {isInvestorAccount === false && <ProductTour tourKey="welcome" steps={DASHBOARD_TOUR} />}
      {isInvestorAccount === true && <InvestorWelcome />}
    </>
  );
}