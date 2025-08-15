'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { authClient } from '@/lib/auth-client';
import { Calendar, Shield, User, UserX } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  banned?: boolean;
  banReason?: string;
  banExpires?: Date;
  createdAt: Date;
  emailVerified: boolean;
}

interface UserManagementDialogProps {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserUpdate: () => void;
}

export function UserManagementDialog({
  user,
  open,
  onOpenChange,
  onUserUpdate
}: UserManagementDialogProps) {
  const [selectedRole, setSelectedRole] = useState(user.role || 'user');
  const [banReason, setBanReason] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSetRole = async () => {
    try {
      setLoading(true);
      await authClient.admin.setRole({
        userId: user.id,
        role: selectedRole as 'user' | 'admin'
      });
      toast.success('User role updated successfully');
      onUserUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update user role:', error);
      toast.error('Failed to update user role');
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async () => {
    try {
      setLoading(true);
      await authClient.admin.banUser({
        userId: user.id,
        banReason: banReason || 'Banned by admin'
      });
      toast.success('User banned successfully');
      onUserUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to ban user:', error);
      toast.error('Failed to ban user');
    } finally {
      setLoading(false);
    }
  };

  const handleUnbanUser = async () => {
    try {
      setLoading(true);
      await authClient.admin.unbanUser({ userId: user.id });
      toast.success('User unbanned successfully');
      onUserUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to unban user:', error);
      toast.error('Failed to unban user');
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async () => {
    if (!newPassword.trim()) {
      toast.error('Please enter a new password');
      return;
    }

    try {
      setLoading(true);
      await authClient.admin.setUserPassword({
        userId: user.id,
        newPassword
      });
      toast.success('Password updated successfully');
      setNewPassword('');
      onUserUpdate();
    } catch (error) {
      console.error('Failed to update password:', error);
      toast.error('Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleImpersonate = async () => {
    try {
      setLoading(true);
      await authClient.admin.impersonateUser({ userId: user.id });
      toast.success('Impersonation started');
      onOpenChange(false);
      // Redirect or refresh as needed
    } catch (error) {
      console.error('Failed to impersonate user:', error);
      toast.error('Failed to impersonate user');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveUser = async () => {
    if (!confirm('Are you sure you want to permanently delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      await authClient.admin.removeUser({ userId: user.id });
      toast.success('User removed successfully');
      onUserUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to remove user:', error);
      toast.error('Failed to remove user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Manage User: {user.name}</span>
          </DialogTitle>
          <DialogDescription>
            Manage user account settings, roles, and permissions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">User Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Email</Label>
                <div className="text-sm text-muted-foreground">{user.email}</div>
              </div>
              <div>
                <Label>Name</Label>
                <div className="text-sm text-muted-foreground">{user.name}</div>
              </div>
              <div>
                <Label>Created</Label>
                <div className="text-sm text-muted-foreground flex items-center space-x-1">
                  <Calendar className="h-3 w-3" />
                  <span>{user.createdAt.toLocaleDateString()}</span>
                </div>
              </div>
              <div>
                <Label>Status</Label>
                <div className="flex items-center space-x-2">
                  {user.banned ? (
                    <Badge variant="destructive" className="flex items-center space-x-1">
                      <UserX className="h-3 w-3" />
                      <span>Banned</span>
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="flex items-center space-x-1">
                      <Shield className="h-3 w-3" />
                      <span>Active</span>
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Role Management */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Role Management</h3>
            <div className="flex items-center space-x-2">
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={handleSetRole} 
                disabled={loading || selectedRole === user.role}
              >
                Update Role
              </Button>
            </div>
          </div>

          <Separator />

          {/* Password Management */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Password Management</h3>
            <div className="flex items-center space-x-2">
              <Input
                type="password"
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleSetPassword} disabled={loading || !newPassword.trim()}>
                Set Password
              </Button>
            </div>
          </div>

          <Separator />

          {/* Ban Management */}
          {user.banned ? (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-red-600">User is Banned</h3>
              {user.banReason && (
                <div>
                  <Label>Ban Reason</Label>
                  <div className="text-sm text-muted-foreground">{user.banReason}</div>
                </div>
              )}
              <Button onClick={handleUnbanUser} disabled={loading} variant="outline">
                Unban User
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Ban User</h3>
              <div>
                <Label htmlFor="banReason">Ban Reason</Label>
                <Textarea
                  id="banReason"
                  placeholder="Enter reason for ban..."
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                />
              </div>
              <Button 
                onClick={handleBanUser} 
                disabled={loading} 
                variant="destructive"
              >
                Ban User
              </Button>
            </div>
          )}

          <Separator />

          {/* Dangerous Actions */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-red-600">Dangerous Actions</h3>
            <div className="flex items-center space-x-2">
              <Button 
                onClick={handleImpersonate} 
                disabled={loading} 
                variant="secondary"
              >
                Impersonate User
              </Button>
              <Button 
                onClick={handleRemoveUser} 
                disabled={loading} 
                variant="destructive"
              >
                Delete User
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}