'use client';

import * as React from 'react';
import Link from 'next/link';
import { Package, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ShipmentStatusBadge } from '@/components/shipment-status-badge';
import { useShipments } from '@/lib/hooks';
import { cn } from '@/lib/utils';
import type { ShipmentStatus } from '@/lib/types';

const FILTERS: Array<{ label: string; value: ShipmentStatus | 'ALL' }> = [
  { label: 'All', value: 'ALL' },
  { label: 'Pickup', value: 'PICKUP_PENDING' },
  { label: 'In transit', value: 'IN_TRANSIT' },
  { label: 'Out for delivery', value: 'OUT_FOR_DELIVERY' },
  { label: 'Failed', value: 'FAILED' },
];

export default function ShipmentsPage(): React.JSX.Element {
  const [filter, setFilter] = React.useState<ShipmentStatus | 'ALL'>('ALL');
  const [search, setSearch] = React.useState('');
  const query = useShipments({
    status: filter === 'ALL' ? undefined : filter,
    limit: 100,
    offset: 0,
  });

  const items = (query.data?.items ?? []).filter((s) => {
    const q = search.trim().toLowerCase();
    if (q === '') return true;
    return (
      s.trackingNumber.toLowerCase().includes(q) ||
      s.recipientName.toLowerCase().includes(q) ||
      s.recipientCity.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Shipments</h1>

      <div className="relative">
        <Search
          className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          placeholder="Search tracking #, recipient, city"
          aria-label="Search shipments"
          className="ps-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Filter by status">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            role="tab"
            aria-selected={filter === f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              'whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-medium',
              filter === f.value
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-input text-muted-foreground',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {query.isError ? (
        <div
          role="alert"
          className="rounded-md border border-destructive p-6 text-center text-sm text-destructive"
        >
          Failed to load shipments.
        </div>
      ) : query.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <Package className="size-10 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">No shipments match.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((s) => (
            <li key={s.id}>
              <Link href={`/shipments/${s.id}`} className="block">
                <Card className="transition-colors active:bg-accent">
                  <CardContent className="flex items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{s.recipientName}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {s.recipientCity} · {s.trackingNumber}
                      </p>
                    </div>
                    <ShipmentStatusBadge status={s.status} />
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
