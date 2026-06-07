'use client';

import { useState, useRef, useEffect } from 'react';
import { UploadCloud, FileText, CheckCircle, ArrowRight, Layers, ChevronRight, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useUser } from '@/hooks/use-user';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { getEffectiveOwnerId } from '@/lib/workspace';
import { formatDistanceToNow } from 'date-fns';

export default function Dashboard() {
  const { user, loading } = useUser();
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          font-family: 'Geist', system-ui, sans-serif;
        }
        .dash-heading {
          /* Refined sans - matches the global Inter heading treatment.
             Semibold + tight tracking = professional B2B feel, not ornamental. */
          font-family: 'Geist', system-ui, sans-serif;
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
          font-family: 'Geist', system-ui, sans-serif;
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
          font-family: 'Geist', system-ui, sans-serif;
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
          font-family: 'Geist', system-ui, sans-serif;
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
          padding: '40px 32px 60px',
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
              fontSize: '42px',
              fontWeight: 600,
              color: '#0d0d1a',
              letterSpacing: '-0.5px',
              lineHeight: 1.2,
              margin: 0,
            }}
          >
            Welcome back,{' '}
            <span style={{ color: '#3b3b8f' }}>{user.firstName}</span>
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
                    My Due Diligence Reports
                  </h2>
                </div>
                <p style={{ fontSize: '13.5px', color: '#999', margin: 0, paddingLeft: '44px' }}>
                  Upload a document to generate an AI due diligence report
                </p>
              </div>
              <span className="tag-badge" style={{ background: '#fff4f0', color: '#c25c3a' }}>AI</span>
            </div>

            <div style={{ height: '1px', background: '#f0f0f0', marginBottom: '28px' }} />

            {/* Upload zone */}
            <div
              className={cn('upload-zone flex-1', aiLocked && 'opacity-40 pointer-events-none')}
              style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                padding: '64px 40px', textAlign: 'center',
                cursor: !file ? 'pointer' : 'default',
              }}
              onClick={() => !file && fileInputRef.current?.click()}
            >
              {!file && (
                <>
                  <div style={{
                    width: '56px', height: '56px', borderRadius: '16px',
                    background: '#fff4f0', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', marginBottom: '18px'
                  }}>
                    <UploadCloud size={24} color="#c25c3a" />
                  </div>
                  <p style={{ fontSize: '15px', fontWeight: 600, color: '#0d0d1a', margin: '0 0 6px' }}>
                    Drag & drop or{' '}
                    <span
                      style={{ color: '#3b3b8f', textDecoration: 'underline', textUnderlineOffset: '3px', cursor: 'pointer' }}
                      onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                    >
                      browse
                    </span>
                  </p>
                  <p style={{ fontSize: '13px', color: '#bbb', margin: 0 }}>
                    PDF, DOCX, XLSX, CSV supported
                  </p>
                </>
              )}

              {file && (
                <div style={{ width: '100%', maxWidth: '320px' }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '12px',
                    background: '#f0f0f8', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 14px'
                  }}>
                    <FileText size={22} color="#3b3b8f" />
                  </div>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#0d0d1a', margin: '0 0 18px' }}>
                    {file.name}
                  </p>

                  {isAnalyzing && (
                    <>
                      <Progress value={progress} style={{ height: '6px', borderRadius: '99px' }} />
                      <p style={{ fontSize: '13px', color: '#aaa', marginTop: '10px' }}>Analyzing document…</p>
                    </>
                  )}

                  {!isAnalyzing && !analysisComplete && (
                    <button
                      className="btn-primary"
                      onClick={(e) => { e.stopPropagation(); handleStartAnalysis(); }}
                    >
                      Start Analysis <ArrowRight size={14} />
                    </button>
                  )}

                  {analysisComplete && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#16a34a', fontSize: '14px', fontWeight: 500 }}>
                      <CheckCircle size={18} />
                      Analysis complete
                    </div>
                  )}
                </div>
              )}

              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileChange}
                accept=".pdf,.docx,.xlsx,.csv"
              />
            </div>

            {aiLocked && (
              <div style={{
                position: 'absolute', inset: 0, zIndex: 10,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                backdropFilter: 'blur(12px)',
                backgroundColor: 'rgba(255,255,255,0.85)',
              }}>
                <p style={{ fontSize: '15px', fontWeight: 600, color: '#0d0d1a', marginBottom: '16px' }}>
                  Due Diligence Reports locked
                </p>
                <button className="btn-primary" onClick={() => router.push('/choose-role')}>
                  Upgrade Plan
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}