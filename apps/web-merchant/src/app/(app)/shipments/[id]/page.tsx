'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, MapPin, Package } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ShipmentStatusBadge } from '@/components/shipment-status-badge';
import { useCancelShipment, useShipment, useTimeline } from '@/lib/hooks';
import { formatDate, formatMoney } from '@/lib/utils';

function DetailRow({ label, value }: { label: string; value: React.ReactNode }): React.JSX.Element {
  return (
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-end font-medium">{value}</span>
    </div>
  );
}

export default function ShipmentDetailsPage(): React.JSX.Element {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const shipment = useShipment(id);
  const timeline = useTimeline(id);
  const cancel = useCancelShipment(id);

  const canCancel =
    shipment.data !== undefined && ['CREATED', 'PICKUP_PENDING'].includes(shipment.data.status);

  if (shipment.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (shipment.isError || shipment.data === undefined) {
    return (
      <div
        role="alert"
        className="rounded-md border border-destructive p-6 text-center text-destructive"
      >
        Shipment not found or failed to load.{' '}
        <Link href="/shipments" className="underline">
          Back to shipments
        </Link>
      </div>
    );
  }

  const s = shipment.data;

  return (
    <div>
      <PageHeader
        title={s.trackingNumber}
        description="Shipment details and tracking timeline."
        actions={
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/shipments">
                <ArrowLeft className="size-4" /> Back
              </Link>
            </Button>
            {canCancel ? (
              <Button
                variant="destructive"
                size="sm"
                loading={cancel.isPending}
                onClick={() => cancel.mutate('Cancelled from merchant portal')}
              >
                Cancel shipment
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="mb-4 flex items-center gap-3">
        <ShipmentStatusBadge status={s.status} />
        <span className="text-sm text-muted-foreground">
          Service: {s.service.replace(/_/g, ' ')}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="size-4" /> Shipment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DetailRow label="Weight" value={`${(s.weightGrams / 1000).toFixed(2)} kg`} />
            <DetailRow label="COD" value={formatMoney(s.codAmount, s.currency)} />
            <DetailRow label="Declared value" value={formatMoney(s.declaredValue, s.currency)} />
            <DetailRow label="Reference" value={s.reference ?? '—'} />
            <DetailRow label="Created" value={formatDate(s.createdAt)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="size-4" /> Sender
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DetailRow label="Name" value={s.senderName} />
            <DetailRow label="Phone" value={s.senderPhone} />
            <DetailRow
              label="Address"
              value={`${s.senderLine1}, ${s.senderCity}, ${s.senderCountry}`}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="size-4" /> Recipient
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DetailRow label="Name" value={s.recipientName} />
            <DetailRow label="Phone" value={s.recipientPhone} />
            <DetailRow
              label="Address"
              value={`${s.recipientLine1}, ${s.recipientCity}, ${s.recipientCountry}`}
            />
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">Tracking timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {timeline.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : timeline.data === undefined || timeline.data.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tracking events yet.</p>
          ) : (
            <ol className="relative border-s ps-6">
              {timeline.data.map((event) => (
                <li key={event.id} className="mb-6 last:mb-0">
                  <span
                    className="absolute -start-1.5 mt-1 size-3 rounded-full bg-primary"
                    aria-hidden="true"
                  />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">{event.type.replace(/_/g, ' ')}</span>
                    {event.description ? (
                      <span className="text-sm text-muted-foreground">{event.description}</span>
                    ) : null}
                    <span className="text-xs text-muted-foreground">
                      {event.location ? `${event.location} · ` : ''}
                      {formatDate(event.occurredAt)}
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
