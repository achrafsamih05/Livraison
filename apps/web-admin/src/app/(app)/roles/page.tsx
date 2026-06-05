'use client';

import * as React from 'react';
import { Check } from 'lucide-react';
import { ALL_ROLES, PERMISSIONS, roleHasPermission } from '@/lib/permissions';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function RolesPage(): React.JSX.Element {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Roles &amp; Permissions</h1>
        <p className="text-sm text-muted-foreground">
          Canonical permission matrix mapping platform roles to capabilities.
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky start-0 bg-card">Permission</TableHead>
                {ALL_ROLES.map((role) => (
                  <TableHead key={role} className="whitespace-nowrap text-center">
                    {role.replace(/_/g, ' ')}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {PERMISSIONS.map((perm) => (
                <TableRow key={perm.key}>
                  <TableCell className="sticky start-0 bg-card font-medium">
                    <div>{perm.resource}</div>
                    <div className="text-xs text-muted-foreground">{perm.action}</div>
                  </TableCell>
                  {ALL_ROLES.map((role) => (
                    <TableCell key={role} className="text-center">
                      {roleHasPermission(perm, role) ? (
                        <Check
                          className="mx-auto size-4 text-success"
                          aria-label={`${role} has ${perm.key}`}
                        />
                      ) : (
                        <span className="text-muted-foreground" aria-hidden="true">
                          ·
                        </span>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
