'use client';
import { Users } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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

export default function SharedWithMePage() {
  const startups: any[] = [];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold">Startups Shared With Me</h1>
        <p className="text-muted-foreground mt-1">
          Analyze startup data rooms securely. Track documents. Make faster decisions.
        </p>
      </div>
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Startups Shared With Me</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Startup</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead className="text-right w-[50px]"> </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {startups.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      No startups have shared a data room with you yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  <></>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                  <Users className="h-6 w-6 text-muted-foreground"/>
                  <CardTitle className="text-xl">Invite Founders</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                  <Button>Invite Founders</Button>
                  <Button variant="outline">View Demo Data Room</Button>
              </div>
          </CardHeader>
          <CardContent>
              <p className="text-muted-foreground text-sm">No startups have shared a data room with you yet.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
