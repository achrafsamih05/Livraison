'use client';

import * as React from 'react';
import Link from 'next/link';
import { Package, Truck, CheckCircle2, AlertTriangle, PlusCircle } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useShipments } from '@/lib/hooks';
import type { ShipmentStatus } from '@/lib/types';

function KpiCard({
  title,
  value,
  icon: Icon,
  loading,
}: {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  loading: boolean;
}): React.JSX.Element {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="size-5 text-muted-foreground" aria-hidden="true" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <div className="text-3xl font-semibold">{value}</div>
        )}
      </CardContent>
    </Card>
  );
}

function useStatusCount(status?: ShipmentStatus): number | undefined {
  const { data } = useShipments({ status, limit: 1, offset: 0 });
  return data?.total;
}

export default function DashboardPage(): React.JSX.Element {
  const all = useShipments({ limit: 1, offset: 0 });
  const inTransit = useStatusCount('IN_TRANSIT');
  const delivered = useStatusCount('DELIVERED');
  const failed = useStatusCount('FAILED');

  const loading = all.isLoading;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of your shipping activity."
        actions={
          <Button asChild>
            <Link href="/shipments/create">
              <PlusCircle className="size-4" /> Create shipment
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total shipments"
          value={all.data?.total ?? 0}
          icon={Package}
          loading={loading}
        />
        <KpiCard title="In transit" value={inTransit ?? 0} icon={Truck} loading={loading} />
        <KpiCard title="Delivered" value={delivered ?? 0} icon={CheckCircle2} loading={loading} />
        <KpiCard title="Failed" value={failed ?? 0} icon={AlertTriangle} loading={loading} />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Get started</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 sm:flex-row">
          <Button asChild variant="outline">
            <Link href="/shipments">View all shipments</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/shipments/create">Create a shipment</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
