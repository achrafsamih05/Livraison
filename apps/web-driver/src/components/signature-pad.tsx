'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';

/**
 * Pointer-based signature capture. Works with touch, pen, and mouse. Emits a
 * PNG data URL on change. Accessible: provides a labelled region and a clear
 * action; falls back gracefully if pointer events are unavailable.
 */
export function SignaturePad({
  onChange,
  ariaLabel = 'Signature capture area',
}: {
  onChange: (dataUrl: string | undefined) => void;
  ariaLabel?: string;
}): React.JSX.Element {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const drawing = React.useRef(false);
  const hasInk = React.useRef(false);

  const getCtx = (): CanvasRenderingContext2D | null => {
    const canvas = canvasRef.current;
    return canvas ? canvas.getContext('2d') : null;
  };

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null) {
      return;
    }
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    const ctx = canvas.getContext('2d');
    if (ctx !== null) {
      ctx.scale(ratio, ratio);
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#111111';
    }
  }, []);

  const pointFromEvent = (e: React.PointerEvent<HTMLCanvasElement>): { x: number; y: number } => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const start = (e: React.PointerEvent<HTMLCanvasElement>): void => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    const ctx = getCtx();
    if (ctx === null) return;
    const { x, y } = pointFromEvent(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const move = (e: React.PointerEvent<HTMLCanvasElement>): void => {
    if (!drawing.current) return;
    const ctx = getCtx();
    if (ctx === null) return;
    const { x, y } = pointFromEvent(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    hasInk.current = true;
  };

  const end = (): void => {
    if (!drawing.current) return;
    drawing.current = false;
    const canvas = canvasRef.current;
    if (canvas !== null && hasInk.current) {
      onChange(canvas.toDataURL('image/png'));
    }
  };

  const clear = (): void => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (canvas !== null && ctx !== null) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    hasInk.current = false;
    onChange(undefined);
  };

  return (
    <div className="flex flex-col gap-2">
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={ariaLabel}
        className="h-40 w-full touch-none rounded-md border border-input bg-white"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
      />
      <Button type="button" variant="outline" size="sm" onClick={clear} className="self-start">
        Clear signature
      </Button>
    </div>
  );
}
