'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { PermissionGuard, useHasPermission } from '@/components/auth/permission-guard';
import { PERMISSIONS } from '@/lib/rbac';
import { Loader2, Mail, MoreHorizontal, UserPlus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface Member {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userImage: string | null;
  roleName: string;
  roleId: string;
  status: string;
  joinedAt: string;
}

interface Role {
  id: string;
  name: string;
  description: string | null;
}

export default function OrganizationMembersPage() {
  const { currentOrganizationId } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [inviting, setInviting] = useState(false);

  const canInviteUsers = useHasPermission(PERMISSIONS.USER_CREATE);
  const canManageRoles = useHasPermission(PERMISSIONS.ROLE_ASSIGN);

  useEffect(() => {
    async function fetchData() {
      if (!currentOrganizationId) return;

      try {
        const [membersResponse, rolesResponse] = await Promise.all([
          fetch(`/api/organizations/${currentOrganizationId}/members`),
          fetch(`/api/organizations/${currentOrganizationId}/roles`)
        ]);

        if (membersResponse.ok) {
          const membersData = await membersResponse.json();
          setMembers(membersData);
        }

        if (rolesResponse.ok) {
          const rolesData = await rolesResponse.json();
          setRoles(rolesData);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast.error('Failed to load organization data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [currentOrganizationId]);

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !selectedRoleId || !currentOrganizationId) return;

    setInviting(true);
    try {
      const response = await fetch(`/api/organizations/${currentOrganizationId}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: inviteEmail,
          roleId: selectedRoleId,
        }),
      });

      if (response.ok) {
        toast.success('Invitation sent successfully');
        setInviteDialogOpen(false);
        setInviteEmail('');
        setSelectedRoleId('');
        // Refresh members list
        const membersResponse = await fetch(`/api/organizations/${currentOrganizationId}/members`);
        if (membersResponse.ok) {
          const membersData = await membersResponse.json();
          setMembers(membersData);
        }
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to send invitation');
      }
    } catch (error) {
      console.error('Failed to invite user:', error);
      toast.error('Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleChangeRole = async (memberId: string, newRoleId: string) => {
    if (!currentOrganizationId) return;

    try {
      const response = await fetch(`/api/organizations/${currentOrganizationId}/members/${memberId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roleId: newRoleId,
        }),
      });

      if (response.ok) {
        toast.success('Member role updated successfully');
        // Refresh members list
        const membersResponse = await fetch(`/api/organizations/${currentOrganizationId}/members`);
        if (membersResponse.ok) {
          const membersData = await membersResponse.json();
          setMembers(membersData);
        }
      } else {
        toast.error('Failed to update member role');
      }
    } catch (error) {
      console.error('Failed to update member role:', error);
      toast.error('Failed to update member role');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <PermissionGuard permission={PERMISSIONS.USER_READ}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Organization Members</h1>
            <p className="text-muted-foreground">
              Manage members and their roles in your organization.
            </p>
          </div>
          
          {canInviteUsers && (
            <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite New Member</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleInviteUser} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="member@example.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={selectedRoleId} onValueChange={setSelectedRoleId} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setInviteDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={inviting}>
                      {inviting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Send Invitation
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Members ({members.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={member.userImage || undefined} />
                      <AvatarFallback>
                        {member.userName
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{member.userName}</p>
                      <p className="text-sm text-muted-foreground">{member.userEmail}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Badge variant="secondary">{member.roleName}</Badge>
                    <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                      {member.status}
                    </Badge>
                    
                    {canManageRoles && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {roles.map((role) => (
                            <DropdownMenuItem
                              key={role.id}
                              onClick={() => handleChangeRole(member.id, role.id)}
                              disabled={role.id === member.roleId}
                            >
                              Change to {role.name}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              ))}
              
              {members.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No members found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  );
}