'use client';

import * as React from 'react';
import { MapPin, Crosshair } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLocationStore } from '@/stores/location-store';
import { useCaptureCurrentPosition, useWatchPosition } from '@/components/use-geolocation';
import { formatDate } from '@/lib/utils';

export default function RoutePage(): React.JSX.Element {
  const [tracking, setTracking] = React.useState(false);
  useWatchPosition(tracking);
  const capture = useCaptureCurrentPosition();
  const current = useLocationStore((s) => s.current);
  const history = useLocationStore((s) => s.history);
  const error = useLocationStore((s) => s.error);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Route & location</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Crosshair className="size-4" /> Last known location
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {current ? (
            <div className="text-sm">
              <p className="font-medium">
                {current.latitude.toFixed(5)}, {current.longitude.toFixed(5)}
              </p>
              <p className="text-muted-foreground">
                Accuracy ±{Math.round(current.accuracy)} m · {formatDate(current.capturedAt)}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No position captured yet.</p>
          )}
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void capture().catch(() => undefined)}
            >
              <MapPin className="size-4" /> Capture position
            </Button>
            <Button
              variant={tracking ? 'destructive' : 'default'}
              size="sm"
              onClick={() => setTracking((t) => !t)}
            >
              {tracking ? 'Stop tracking' : 'Start tracking'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Location history</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No fixes recorded.</p>
          ) : (
            <ol className="space-y-2 text-sm">
              {[...history].reverse().map((fix, i) => (
                <li
                  key={`${fix.capturedAt}-${i}`}
                  className="flex justify-between border-b pb-2 last:border-0"
                >
                  <span>
                    {fix.latitude.toFixed(4)}, {fix.longitude.toFixed(4)}
                  </span>
                  <span className="text-muted-foreground">{formatDate(fix.capturedAt)}</span>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
