
'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Dynamic import with ssr:false - react-pdf (which the editor uses)
// ships ESM that Next's server-side bundling pass crashes on with
// "Object.defineProperty called on non-object". Deferring the import
// to the browser bypasses that entire codepath.
const AgreementEditor = dynamic(
  () => import('./_components/agreement-editor').then(m => m.AgreementEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    ),
  }
);

function EditAgreementPage() {
  return (
    <Suspense fallback={<div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <AgreementEditor />
    </Suspense>
  );
}

export default EditAgreementPage;
