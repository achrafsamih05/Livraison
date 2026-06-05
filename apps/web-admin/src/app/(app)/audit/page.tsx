'use client';

import * as React from 'react';
import { Search } from 'lucide-react';
import { useAudit } from '@/lib/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FormField } from '@/components/form-field';
import { formatDate } from '@/lib/utils';

export default function AuditPage(): React.JSX.Element {
  const [input, setInput] = React.useState('');
  const [shipmentId, setShipmentId] = React.useState('');
  const { data, isLoading, isError, error, isFetching } = useAudit(shipmentId);

  const onSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    setShipmentId(input.trim());
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Audit Logs</h1>
        <p className="text-sm text-muted-foreground">
          Inspect the immutable audit trail for a shipment by its ID.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form className="flex items-end gap-3" onSubmit={onSubmit}>
            <div className="flex-1">
              <FormField
                label="Shipment ID"
                render={(p) => (
                  <Input
                    {...p}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="e.g. 7c9e6679-7425-40de-944b-e07fc1f90ae7"
                  />
                )}
              />
            </div>
            <Button type="submit" loading={isFetching && shipmentId.length > 0}>
              <Search className="size-4" />
              Look up
            </Button>
          </form>
        </CardContent>
      </Card>

      {shipmentId.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Request ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={4}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : isError ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-destructive">
                      {error?.message ?? 'Failed to load audit log.'}
                    </TableCell>
                  </TableRow>
                ) : (data?.items.length ?? 0) === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No audit entries for this shipment.
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.items.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatDate(entry.occurredAt)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{entry.action}</Badge>
                      </TableCell>
                      <TableCell>
                        <div>{entry.actorType}</div>
                        {entry.actorId ? (
                          <div className="font-mono text-xs text-muted-foreground">
                            {entry.actorId}
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {entry.requestId ?? '—'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
