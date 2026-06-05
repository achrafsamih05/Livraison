'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, Phone, Navigation } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ShipmentStatusBadge } from '@/components/shipment-status-badge';
import { DeliveryActionDialog } from '@/components/delivery-action-dialog';
import { useCaptureCurrentPosition } from '@/components/use-geolocation';
import { useShipment, useCaptureLocation } from '@/lib/hooks';
import { availableActions, type DriverActionDef } from '@/lib/delivery-workflow';
import { formatMoney } from '@/lib/utils';

export default function ShipmentDetailPage(): React.JSX.Element {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const shipment = useShipment(id);
  const capturePosition = useCaptureCurrentPosition();
  const captureLocation = useCaptureLocation();
  const [selected, setSelected] = React.useState<DriverActionDef | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  if (shipment.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (shipment.isError || shipment.data === undefined) {
    return (
      <div
        role="alert"
        className="rounded-md border border-destructive p-6 text-center text-destructive"
      >
        Shipment not found.{' '}
        <Link href="/shipments" className="underline">
          Back
        </Link>
      </div>
    );
  }

  const s = shipment.data;
  const actions = availableActions(s.status);

  const openAction = (def: DriverActionDef): void => {
    setSelected(def);
    setDialogOpen(true);
  };

  const pingLocation = async (): Promise<void> => {
    const geo = await capturePosition().catch(() => null);
    if (geo !== null) {
      await captureLocation.mutateAsync({ shipmentId: id, geo });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm">
          <Link href="/shipments">
            <ArrowLeft className="size-4" /> Back
          </Link>
        </Button>
        <ShipmentStatusBadge status={s.status} />
      </div>

      <div>
        <h1 className="text-xl font-semibold">{s.recipientName}</h1>
        <p className="text-sm text-muted-foreground">{s.trackingNumber}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="size-4" /> Delivery address
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>{s.recipientLine1}</p>
          <p className="text-muted-foreground">
            {s.recipientCity}, {s.recipientCountry}
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button asChild variant="outline" size="sm">
              <a href={`tel:${s.recipientPhone}`}>
                <Phone className="size-4" /> Call recipient
              </a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  `${s.recipientLine1}, ${s.recipientCity}, ${s.recipientCountry}`,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Navigation className="size-4" /> Navigate
              </a>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void pingLocation()}
              loading={captureLocation.isPending}
            >
              <MapPin className="size-4" /> Share my location
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Shipment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">COD to collect</span>
            <span className="font-medium">{formatMoney(s.codAmount, s.currency)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Weight</span>
            <span className="font-medium">{(s.weightGrams / 1000).toFixed(2)} kg</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Service</span>
            <span className="font-medium">{s.service.replace(/_/g, ' ')}</span>
          </div>
        </CardContent>
      </Card>

      {actions.length > 0 ? (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">Actions</h2>
          {actions.map((def) => (
            <Button
              key={def.action}
              variant={def.variant}
              size="lg"
              className="w-full"
              onClick={() => openAction(def)}
            >
              {def.label}
            </Button>
          ))}
        </div>
      ) : (
        <p className="py-4 text-center text-sm text-muted-foreground">
          No further actions available for this shipment.
        </p>
      )}

      <DeliveryActionDialog
        shipmentId={id}
        def={selected}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
