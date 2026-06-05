'use client';

import * as React from 'react';
import Link from 'next/link';
import { Package, Truck, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useShipments } from '@/lib/hooks';
import type { ShipmentStatus } from '@/lib/types';

function StatCard({
  title,
  value,
  icon: Icon,
  loading,
}: {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  loading: boolean;
}): React.JSX.Element {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="size-5 text-muted-foreground" aria-hidden="true" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-12" />
        ) : (
          <div className="text-3xl font-semibold">{value}</div>
        )}
      </CardContent>
    </Card>
  );
}

function useCount(status?: ShipmentStatus): number {
  const { data } = useShipments({ status, limit: 1, offset: 0 });
  return data?.total ?? 0;
}

export default function DashboardPage(): React.JSX.Element {
  const all = useShipments({ limit: 1, offset: 0 });
  const outForDelivery = useCount('OUT_FOR_DELIVERY');
  const delivered = useCount('DELIVERED');
  const failed = useCount('FAILED');

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Today</h1>
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          title="Assigned"
          value={all.data?.total ?? 0}
          icon={Package}
          loading={all.isLoading}
        />
        <StatCard
          title="Out for delivery"
          value={outForDelivery}
          icon={Truck}
          loading={all.isLoading}
        />
        <StatCard title="Delivered" value={delivered} icon={CheckCircle2} loading={all.isLoading} />
        <StatCard title="Failed" value={failed} icon={AlertTriangle} loading={all.isLoading} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Route summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            {all.data?.total ?? 0} stops assigned. {outForDelivery} currently out for delivery.
          </p>
          <Link href="/shipments" className="inline-flex font-medium text-primary hover:underline">
            View assigned shipments →
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
