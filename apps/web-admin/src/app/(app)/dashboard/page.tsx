'use client';

import * as React from 'react';
import Link from 'next/link';
import { Users, Building2, Package, ShieldCheck } from 'lucide-react';
import { useTenants, useUsers, useShipments } from '@/lib/hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

function StatCard({
  label,
  value,
  loading,
  href,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  loading: boolean;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}): React.JSX.Element {
  return (
    <Link href={href as never} className="block">
      <Card className="transition-colors hover:border-primary">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
          <Icon className="size-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <p className="text-3xl font-semibold">{value}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

export default function DashboardPage(): React.JSX.Element {
  const users = useUsers();
  const tenants = useTenants();
  const shipments = useShipments({ limit: 1, offset: 0 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Platform overview and quick access.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Users"
          value={users.data?.length ?? 0}
          loading={users.isLoading}
          href="/users"
          icon={Users}
        />
        <StatCard
          label="Tenants"
          value={tenants.data?.length ?? 0}
          loading={tenants.isLoading}
          href="/tenants"
          icon={Building2}
        />
        <StatCard
          label="Shipments"
          value={shipments.data?.total ?? 0}
          loading={shipments.isLoading}
          href="/shipments"
          icon={Package}
        />
        <StatCard
          label="Roles"
          value={9}
          loading={false}
          href="/roles"
          icon={ShieldCheck}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Welcome</CardTitle>
          <CardDescription>
            Use the navigation to manage users, tenants, and shipments, review the role-permission
            matrix, and inspect audit logs.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
