'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { SignaturePad } from '@/components/signature-pad';
import { PhotoCapture } from '@/components/photo-capture';
import { useCaptureCurrentPosition } from '@/components/use-geolocation';
import { podSchema, failureSchema, type PodInput } from '@/lib/schemas';
import type { DriverActionDef } from '@/lib/delivery-workflow';
import type { ProofOfDelivery } from '@/lib/types';
import { usePerformAction } from '@/lib/hooks';

export function DeliveryActionDialog({
  shipmentId,
  def,
  open,
  onOpenChange,
}: {
  shipmentId: string;
  def: DriverActionDef | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}): React.JSX.Element | null {
  const perform = usePerformAction();
  const capturePosition = useCaptureCurrentPosition();
  const [signature, setSignature] = React.useState<string | undefined>(undefined);
  const [photo, setPhoto] = React.useState<string | undefined>(undefined);
  const [reason, setReason] = React.useState('');
  const [reasonError, setReasonError] = React.useState<string | undefined>(undefined);

  const podForm = useForm<PodInput>({
    resolver: zodResolver(podSchema),
    defaultValues: { recipientName: '', notes: '' },
  });

  React.useEffect(() => {
    if (open) {
      setSignature(undefined);
      setPhoto(undefined);
      setReason('');
      setReasonError(undefined);
      podForm.reset({ recipientName: '', notes: '' });
    }
  }, [open, podForm]);

  if (def === null) {
    return null;
  }

  const submitPod = podForm.handleSubmit(async (values) => {
    let geo;
    try {
      geo = await capturePosition();
    } catch {
      geo = undefined;
    }
    const pod: ProofOfDelivery = {
      recipientName: values.recipientName,
      notes: values.notes || undefined,
      signatureDataUrl: signature,
      photoDataUrl: photo,
      geo,
    };
    await perform.mutateAsync({ shipmentId, def, pod });
    onOpenChange(false);
  });

  const submitReason = async (): Promise<void> => {
    const parsed = failureSchema.safeParse({ reason });
    if (!parsed.success) {
      setReasonError(parsed.error.issues[0]?.message ?? 'A reason is required.');
      return;
    }
    await perform.mutateAsync({ shipmentId, def, reason: parsed.data.reason });
    onOpenChange(false);
  };

  const submitSimple = async (): Promise<void> => {
    await perform.mutateAsync({ shipmentId, def });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{def.label}</DialogTitle>
          <DialogDescription>
            {def.requiresPod
              ? 'Capture proof of delivery to complete this delivery.'
              : def.requiresReason
                ? 'Provide a reason for this outcome.'
                : 'Confirm to record this status change.'}
          </DialogDescription>
        </DialogHeader>

        {def.requiresPod ? (
          <form className="space-y-4" onSubmit={submitPod} noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="pod-recipient">Recipient name</Label>
              <Input
                id="pod-recipient"
                aria-invalid={Boolean(podForm.formState.errors.recipientName)}
                {...podForm.register('recipientName')}
              />
              {podForm.formState.errors.recipientName ? (
                <p role="alert" className="text-xs text-destructive">
                  {podForm.formState.errors.recipientName.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pod-notes">Notes (optional)</Label>
              <Textarea id="pod-notes" {...podForm.register('notes')} />
            </div>
            <div className="space-y-1.5">
              <Label>Signature</Label>
              <SignaturePad onChange={setSignature} />
            </div>
            <div className="space-y-1.5">
              <Label>Photo</Label>
              <PhotoCapture onChange={setPhoto} />
            </div>
            <Button type="submit" className="w-full" size="lg" loading={perform.isPending}>
              Confirm delivery
            </Button>
          </form>
        ) : def.requiresReason ? (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                value={reason}
                aria-invalid={Boolean(reasonError)}
                onChange={(e) => setReason(e.target.value)}
              />
              {reasonError ? (
                <p role="alert" className="text-xs text-destructive">
                  {reasonError}
                </p>
              ) : null}
            </div>
            <Button
              type="button"
              variant={def.variant}
              className="w-full"
              size="lg"
              loading={perform.isPending}
              onClick={() => void submitReason()}
            >
              {def.label}
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            className="w-full"
            size="lg"
            loading={perform.isPending}
            onClick={() => void submitSimple()}
          >
            {def.label}
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
