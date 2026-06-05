'use client';

import * as React from 'react';
import Link from 'next/link';
import { PlusCircle, Package } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ShipmentStatusBadge } from '@/components/shipment-status-badge';
import { useShipments } from '@/lib/hooks';
import { formatDate, formatMoney } from '@/lib/utils';
import type { ShipmentStatus } from '@/lib/types';

const PAGE_SIZE = 20;
const STATUSES: ShipmentStatus[] = [
  'CREATED',
  'PICKUP_PENDING',
  'PICKED_UP',
  'IN_TRANSIT',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'FAILED',
  'RETURNED',
  'CANCELLED',
];

export default function ShipmentsPage(): React.JSX.Element {
  const [status, setStatus] = React.useState<ShipmentStatus | 'ALL'>('ALL');
  const [page, setPage] = React.useState(0);

  const query = useShipments({
    status: status === 'ALL' ? undefined : status,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  });

  const total = query.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <PageHeader
        title="Shipments"
        description="All your shipments."
        actions={
          <Button asChild>
            <Link href="/shipments/create">
              <PlusCircle className="size-4" /> Create
            </Link>
          </Button>
        }
      />

      <div className="mb-4 flex items-center gap-3">
        <label htmlFor="status-filter" className="text-sm text-muted-foreground">
          Status
        </label>
        <Select
          value={status}
          onValueChange={(value) => {
            setStatus(value as ShipmentStatus | 'ALL');
            setPage(0);
          }}
        >
          <SelectTrigger id="status-filter" className="w-56">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s.replace(/_/g, ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {query.isError ? (
            <div role="alert" className="p-8 text-center text-sm text-destructive">
              Failed to load shipments. Please try again.
            </div>
          ) : query.isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : total === 0 ? (
            <div className="flex flex-col items-center gap-3 p-12 text-center">
              <Package className="size-10 text-muted-foreground" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">No shipments found.</p>
              <Button asChild>
                <Link href="/shipments/create">Create your first shipment</Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tracking #</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>COD</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.data?.items.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">
                      <Link href={`/shipments/${s.id}`} className="text-primary hover:underline">
                        {s.trackingNumber}
                      </Link>
                    </TableCell>
                    <TableCell>{s.recipientName}</TableCell>
                    <TableCell>{s.recipientCity}</TableCell>
                    <TableCell>
                      <ShipmentStatusBadge status={s.status} />
                    </TableCell>
                    <TableCell>{formatMoney(s.codAmount, s.currency)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(s.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {total > 0 ? (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page + 1} of {pageCount} · {total} total
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page + 1 >= pageCount}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
