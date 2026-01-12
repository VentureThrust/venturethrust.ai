'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type User } from '@/hooks/use-user';

interface EditableAvatarProps {
  user: User;
  setUser: (user: User) => void;
}

export function EditableAvatar({ user, setUser }: EditableAvatarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newAvatarUrl = reader.result as string;
        setUser({ ...user, avatarUrl: newAvatarUrl });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="relative group">
      <Image
        src={user.avatarUrl}
        alt="User Avatar"
        width={96}
        height={96}
        className="rounded-full transition-opacity group-hover:opacity-70"
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full h-12 w-12 opacity-0 group-hover:opacity-100 bg-background/50"
        onClick={handleAvatarClick}
      >
        <Pencil className="h-5 w-5" />
        <span className="sr-only">Edit avatar</span>
      </Button>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/png, image/jpeg"
      />
    </div>
  );
}
