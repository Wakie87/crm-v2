'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { PermissionGuard } from '@/components/auth/permission-guard';
import { PERMISSIONS } from '@/lib/rbac';
import { Loader2 } from 'lucide-react';

interface OrganizationData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  website: string | null;
  plan: string;
  subscriptionStatus: string;
  maxUsers: number;
  maxStorage: number;
}

export default function OrganizationSettingsPage() {
  const { currentOrganizationId } = useAuth();
  const [organization, setOrganization] = useState<OrganizationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchOrganization() {
      if (!currentOrganizationId) return;

      try {
        const response = await fetch(`/api/organizations/${currentOrganizationId}`);
        if (response.ok) {
          const data = await response.json();
          setOrganization(data);
        }
      } catch (error) {
        console.error('Failed to fetch organization:', error);
        toast.error('Failed to load organization settings');
      } finally {
        setLoading(false);
      }
    }

    fetchOrganization();
  }, [currentOrganizationId]);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!organization || !currentOrganizationId) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/organizations/${currentOrganizationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: organization.name,
          description: organization.description,
          website: organization.website,
        }),
      });

      if (response.ok) {
        toast.success('Organization settings updated successfully');
      } else {
        toast.error('Failed to update organization settings');
      }
    } catch (error) {
      console.error('Failed to update organization:', error);
      toast.error('Failed to update organization settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Organization not found</p>
      </div>
    );
  }

  return (
    <PermissionGuard permission={PERMISSIONS.ORGANIZATION_READ}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Organization Settings</h1>
          <p className="text-muted-foreground">
            Manage your organization&apos;s basic information and settings.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Organization Name</Label>
                  <Input
                    id="name"
                    value={organization.name}
                    onChange={(e) =>
                      setOrganization({ ...organization, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={organization.slug}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Slug cannot be changed after creation
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={organization.description || ''}
                  onChange={(e) =>
                    setOrganization({ ...organization, description: e.target.value })
                  }
                  placeholder="Describe your organization..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={organization.website || ''}
                  onChange={(e) =>
                    setOrganization({ ...organization, website: e.target.value })
                  }
                  placeholder="https://example.com"
                />
              </div>

              <PermissionGuard permission={PERMISSIONS.ORGANIZATION_UPDATE}>
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </PermissionGuard>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscription Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Current Plan</Label>
                <p className="text-sm font-medium capitalize">{organization.plan}</p>
              </div>
              <div>
                <Label>Status</Label>
                <p className="text-sm font-medium capitalize">{organization.subscriptionStatus}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Max Users</Label>
                <p className="text-sm font-medium">{organization.maxUsers}</p>
              </div>
              <div>
                <Label>Max Storage (MB)</Label>
                <p className="text-sm font-medium">{organization.maxStorage}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  );
}