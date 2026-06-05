'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormField } from '@/components/form-field';
import { createShipmentSchema, type CreateShipmentInput } from '@/lib/schemas';
import { useCreateShipment } from '@/lib/hooks';
import type { ServiceLevel } from '@/lib/types';

const SERVICES: ServiceLevel[] = ['SAME_DAY', 'NEXT_DAY', 'EXPRESS', 'STANDARD', 'ECONOMY'];

export default function CreateShipmentPage(): React.JSX.Element {
  const create = useCreateShipment();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateShipmentInput>({
    resolver: zodResolver(createShipmentSchema),
    defaultValues: {
      service: 'STANDARD',
      currency: 'SAR',
      weightGrams: 1000,
      sender: { country: 'SA' },
      recipient: { country: 'SA' },
    },
  });

  const service = watch('service');

  return (
    <div>
      <PageHeader
        title="Create shipment"
        description="Enter sender, recipient, and package details."
      />

      <form
        className="space-y-4"
        onSubmit={handleSubmit((values) => create.mutate(values))}
        noValidate
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sender</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <FormField
                label="Name"
                required
                error={errors.sender?.name?.message}
                render={(p) => <Input {...p} {...register('sender.name')} />}
              />
              <FormField
                label="Phone"
                required
                error={errors.sender?.phone?.message}
                render={(p) => <Input {...p} inputMode="tel" {...register('sender.phone')} />}
              />
              <FormField
                label="Address line"
                required
                error={errors.sender?.line1?.message}
                render={(p) => <Input {...p} {...register('sender.line1')} />}
              />
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  label="City"
                  required
                  error={errors.sender?.city?.message}
                  render={(p) => <Input {...p} {...register('sender.city')} />}
                />
                <FormField
                  label="Country"
                  required
                  error={errors.sender?.country?.message}
                  render={(p) => <Input {...p} maxLength={2} {...register('sender.country')} />}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recipient</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <FormField
                label="Name"
                required
                error={errors.recipient?.name?.message}
                render={(p) => <Input {...p} {...register('recipient.name')} />}
              />
              <FormField
                label="Phone"
                required
                error={errors.recipient?.phone?.message}
                render={(p) => <Input {...p} inputMode="tel" {...register('recipient.phone')} />}
              />
              <FormField
                label="Address line"
                required
                error={errors.recipient?.line1?.message}
                render={(p) => <Input {...p} {...register('recipient.line1')} />}
              />
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  label="City"
                  required
                  error={errors.recipient?.city?.message}
                  render={(p) => <Input {...p} {...register('recipient.city')} />}
                />
                <FormField
                  label="Country"
                  required
                  error={errors.recipient?.country?.message}
                  render={(p) => <Input {...p} maxLength={2} {...register('recipient.country')} />}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Package & service</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <FormField
              label="Service level"
              required
              error={errors.service?.message}
              render={(p) => (
                <Select
                  value={service}
                  onValueChange={(value) => setValue('service', value as ServiceLevel)}
                >
                  <SelectTrigger id={p.id} aria-invalid={p['aria-invalid']}>
                    <SelectValue placeholder="Choose service" />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICES.map((sv) => (
                      <SelectItem key={sv} value={sv}>
                        {sv.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FormField
              label="Weight (grams)"
              required
              error={errors.weightGrams?.message}
              render={(p) => <Input {...p} type="number" min={1} {...register('weightGrams')} />}
            />
            <FormField
              label="Currency"
              required
              error={errors.currency?.message}
              render={(p) => <Input {...p} maxLength={3} {...register('currency')} />}
            />
            <FormField
              label="COD amount"
              error={errors.codAmount?.message}
              render={(p) => (
                <Input {...p} type="number" min={0} step="0.01" {...register('codAmount')} />
              )}
            />
            <FormField
              label="Declared value"
              error={errors.declaredValue?.message}
              render={(p) => (
                <Input {...p} type="number" min={0} step="0.01" {...register('declaredValue')} />
              )}
            />
            <FormField
              label="Reference"
              error={errors.reference?.message}
              render={(p) => <Input {...p} {...register('reference')} />}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="submit" loading={create.isPending}>
            Create shipment
          </Button>
        </div>
      </form>
    </div>
  );
}
