'use client';

import { useSession } from '@/lib/auth-client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Info, Shield, User } from 'lucide-react';

export function UserRoleCheck() {
  const { data: session } = useSession();

  if (!session?.user) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Please sign in to access user management features.
        </AlertDescription>
      </Alert>
    );
  }

  const userRole = (session.user as any)?.role || 'user';
  const isAdmin = userRole === 'admin';

  return (
    <div className="space-y-4">
      <Alert variant={isAdmin ? 'default' : 'destructive'}>
        <Shield className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span>Current user role:</span>
            <Badge variant={isAdmin ? 'default' : 'secondary'}>
              {userRole}
            </Badge>
          </div>
          {!isAdmin && (
            <div className="text-sm">
              You need admin role to manage users
            </div>
          )}
        </AlertDescription>
      </Alert>
      
      <div className="text-sm text-muted-foreground p-4 bg-muted/50 rounded-lg">
        <h4 className="font-medium mb-2">Debug Information:</h4>
        <div className="space-y-1">
          <div>User ID: {session.user.id}</div>
          <div>Email: {session.user.email}</div>
          <div>Name: {session.user.name}</div>
          <div>Role: {userRole}</div>
        </div>
        
        {!isAdmin && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <h5 className="font-medium text-yellow-800 mb-2">To become an admin:</h5>
            <ol className="list-decimal list-inside text-sm text-yellow-700 space-y-1">
              <li>Run: <code className="bg-yellow-100 px-1 rounded">pnpm check-users</code> to see existing users</li>
              <li>Run: <code className="bg-yellow-100 px-1 rounded">pnpm set-admin {session.user.email}</code> to make this user admin</li>
              <li>Or create a new admin: <code className="bg-yellow-100 px-1 rounded">pnpm create-admin</code></li>
              <li>Refresh the page after setting admin role</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}