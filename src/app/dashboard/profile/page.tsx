'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUser } from '@/hooks/use-user';
import { EditableAvatar } from '@/components/profile/editable-avatar';

export default function ProfilePage() {
  const { user, setUser } = useUser();

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newName = formData.get('name') as string;
    const newEmail = formData.get('email') as string;
    
    // In a real app, you'd also get the new avatar URL
    // and split the name into first and last names.
    setUser({
      ...user,
      name: newName,
      firstName: newName.split(' ')[0],
      email: newEmail,
    });

    // Here you would typically make an API call to save the user data
    console.log('User profile saved:', { name: newName, email: newEmail });
  };


  return (
    <div className="flex justify-center items-start py-8 px-4">
      <Card className="w-full max-w-2xl">
        <form onSubmit={handleSave}>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              This is how others will see you on the site.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="flex items-center gap-6">
              <EditableAvatar user={user} setUser={setUser} />
              <div className="text-sm text-muted-foreground">
                <p>Click on the avatar to upload a custom one from your files.</p>
                <p className="mt-2">For best results, use an image at least 256x256px in .jpg or .png format.</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Username</Label>
              <Input id="name" name="name" defaultValue={user.name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={user.email} />
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <div className="flex justify-end gap-2 w-full">
              <Button variant="outline" type="reset">Cancel</Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
