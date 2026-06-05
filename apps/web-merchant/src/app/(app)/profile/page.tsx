'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FormField } from '@/components/form-field';
import { profileSchema, type ProfileInput } from '@/lib/schemas';
import { useMe, useUpdateProfile } from '@/lib/hooks';

export default function ProfilePage(): React.JSX.Element {
  const me = useMe();
  const update = useUpdateProfile();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    values: me.data
      ? { firstName: me.data.firstName, lastName: me.data.lastName, phone: '' }
      : undefined,
  });

  React.useEffect(() => {
    if (me.data) {
      reset({ firstName: me.data.firstName, lastName: me.data.lastName, phone: '' });
    }
  }, [me.data, reset]);

  return (
    <div>
      <PageHeader title="Profile" description="Manage your account details." />

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent>
          {me.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <form
              className="space-y-4"
              onSubmit={handleSubmit((values) => update.mutate(values))}
              noValidate
            >
              <FormField
                label="Email"
                render={(p) => <Input {...p} value={me.data?.email ?? ''} readOnly disabled />}
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                label="Phone"
                hint="Optional. 7-15 digits."
                error={errors.phone?.message}
                render={(p) => <Input {...p} inputMode="tel" {...register('phone')} />}
              />
              <Button type="submit" loading={update.isPending} disabled={!isDirty}>
                Save changes
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
