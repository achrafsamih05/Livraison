'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { useCreateUser, useSetUserStatus, useUsers } from '@/lib/hooks';
import { createUserSchema, type CreateUserInput } from '@/lib/schemas';
import { ALL_ROLES } from '@/lib/permissions';
import type { RoleName, UserStatus } from '@/lib/types';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormField } from '@/components/form-field';
import { formatDate } from '@/lib/utils';

const STATUS_VARIANT: Record<UserStatus, 'success' | 'secondary' | 'warning' | 'destructive'> = {
  ACTIVE: 'success',
  INVITED: 'secondary',
  SUSPENDED: 'warning',
  DEACTIVATED: 'destructive',
};

const STATUSES: UserStatus[] = ['ACTIVE', 'INVITED', 'SUSPENDED', 'DEACTIVATED'];

function CreateUserDialog(): React.JSX.Element {
  const [open, setOpen] = React.useState(false);
  const create = useCreateUser();
  const [roles, setRoles] = React.useState<RoleName[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { email: '', password: '', firstName: '', lastName: '', phone: '', roles: [] },
  });

  const toggleRole = (role: RoleName): void => {
    setRoles((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]));
  };

  const onSubmit = (values: CreateUserInput): void => {
    create.mutate(
      { ...values, roles },
      {
        onSuccess: () => {
          setOpen(false);
          setRoles([]);
          reset();
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          New user
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create user</DialogTitle>
          <DialogDescription>Add a new user to the current tenant.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="First name"
              required
              error={errors.firstName?.message}
              render={(p) => <Input {...p} {...register('firstName')} />}
            />
            <FormField
              label="Last name"
              required
              error={errors.lastName?.message}
              render={(p) => <Input {...p} {...register('lastName')} />}
            />
          </div>
          <FormField
            label="Email"
            required
            error={errors.email?.message}
            render={(p) => <Input {...p} type="email" autoComplete="off" {...register('email')} />}
          />
          <FormField
            label="Password"
            required
            error={errors.password?.message}
            hint="At least 12 characters with upper, lower, and a digit."
            render={(p) => (
              <Input {...p} type="password" autoComplete="new-password" {...register('password')} />
            )}
          />
          <FormField
            label="Phone"
            error={errors.phone?.message}
            render={(p) => <Input {...p} type="tel" {...register('phone')} />}
          />
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Roles</legend>
            <div className="flex flex-wrap gap-2">
              {ALL_ROLES.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => toggleRole(role)}
                  aria-pressed={roles.includes(role)}
                  className={
                    roles.includes(role)
                      ? 'rounded-full border border-transparent bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground'
                      : 'rounded-full border px-2.5 py-0.5 text-xs font-medium text-muted-foreground hover:bg-accent'
                  }
                >
                  {role.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </fieldset>
          <DialogFooter>
            <Button type="submit" loading={create.isPending}>
              Create user
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function UsersPage(): React.JSX.Element {
  const { data, isLoading, isError, error } = useUsers();
  const setStatus = useSetUserStatus();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground">Manage users in the current tenant.</p>
        </div>
        <CreateUserDialog />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last login</TableHead>
                <TableHead className="text-end">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-destructive">
                    {error?.message ?? 'Failed to load users.'}
                  </TableCell>
                </TableRow>
              ) : (data?.length ?? 0) === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                data?.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">
                      {u.firstName} {u.lastName}
                    </TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {u.roles.length === 0 ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          u.roles.map((r) => (
                            <Badge key={r} variant="outline">
                              {r.replace(/_/g, ' ')}
                            </Badge>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[u.status]}>{u.status}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(u.lastLoginAt)}
                    </TableCell>
                    <TableCell className="text-end">
                      <div className="flex justify-end">
                        <Select
                          value={u.status}
                          onValueChange={(v) =>
                            setStatus.mutate({ id: u.id, status: v as UserStatus })
                          }
                        >
                          <SelectTrigger
                            aria-label={`Change status for ${u.email}`}
                            className="h-8 w-36"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUSES.map((s) => (
                              <SelectItem key={s} value={s}>
                                {s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
