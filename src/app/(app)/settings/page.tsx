import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Check, PlusCircle, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { teamMembers } from '@/lib/data';

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account, team, and branding settings.
        </p>
      </div>
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <div className="border-t border-gray-200 pt-6 max-w-2xl">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Profile</h3>
              <p className="text-sm text-muted-foreground">Update your personal information.</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" defaultValue="John Doe" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue="john.doe@example.com" />
              </div>
            </div>
            <div className="mt-6">
              <Button>Save Changes</Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="team">
          <div className="border-t border-gray-200 pt-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Team Members</h3>
              <p className="text-sm text-muted-foreground">Invite and manage your team members.</p>
            </div>
            <div className="space-y-4">
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                <PlusCircle className="mr-2 h-4 w-4" /> Invite Member
              </Button>
              <div className="space-y-4">
                {teamMembers.length > 0 ? (
                  teamMembers.map((member) => {
                    const avatar = PlaceHolderImages.find(
                      (p) => p.id === member.avatar
                    );
                    return (
                      <div
                        key={member.id}
                        className="flex items-center justify-between space-x-4"
                      >
                        <div className="flex items-center space-x-4">
                          <Avatar>
                            {avatar && <AvatarImage src={avatar.imageUrl} />}
                            <AvatarFallback>
                              {member.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium leading-none">
                              {member.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {member.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Select defaultValue={member.role.toLowerCase()}>
                            <SelectTrigger className="w-[110px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="owner">Owner</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="member">Member</SelectItem>
                            </SelectContent>
                          </Select>
                          {member.role !== 'Owner' && (
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <p>No team members yet.</p>
                    <p className="text-sm">Invite members to collaborate.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="branding">
          <div className="border-t border-gray-200 pt-6 max-w-2xl">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Branding</h3>
              <p className="text-sm text-muted-foreground">Customize your brand appearance.</p>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Logo</Label>
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 rounded-lg">
                    <AvatarImage src="https://picsum.photos/seed/your-logo/64/64" data-ai-hint="company logo" />
                    <AvatarFallback>Logo</AvatarFallback>
                  </Avatar>
                  <Button variant="outline">Upload Logo</Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="domain">Custom Domain</Label>
                <Input id="domain" placeholder="share.yourcompany.com" />
                <p className="text-sm text-muted-foreground">
                  Set a custom domain for your share links (Pro feature).
                </p>
              </div>
            </div>
            <div className="mt-6">
              <Button>Save Branding</Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="subscription">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Free Plan</CardTitle>
                <CardDescription>
                  For individuals and small teams getting started.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-4xl font-bold">$0/mo</div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" /> 5 documents
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" /> Basic analytics
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" /> 1 team member
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" disabled>
                  Current Plan
                </Button>
              </CardFooter>
            </Card>
            <Card className="border-primary">
              <CardHeader>
                <CardTitle>Pro Plan</CardTitle>
                <CardDescription>
                  For growing businesses that need more power and customization.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-4xl font-bold">$49/mo</div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" /> Unlimited documents
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" /> Advanced analytics & AI
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" /> Custom branding
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" /> Unlimited team members
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90">Upgrade to Pro</Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
