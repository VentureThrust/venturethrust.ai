'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSpaces } from '@/lib/spaces-provider';
import { Loader2 } from 'lucide-react';

export default function NewSpacePage() {
  const router = useRouter();
  const { addSpace } = useSpaces();

  useEffect(() => {
    const createSpaceAndRedirect = async () => {
      const newSpaceId = await addSpace({
        name: 'Untitled Space',
        description: '',
        files: [],
        isEnabled: true,
      });
      router.replace(`/spaces/${newSpaceId}/edit`);
    };
    createSpaceAndRedirect();
  }, [addSpace, router]);

  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p>Creating new space...</p>
      </div>
    </div>
  );
}