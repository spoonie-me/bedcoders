import { useEffect, useRef } from 'react';

/**
 * The hero's visual thesis: a trace that dips low and recovers smoothly,
 * again and again — never crashing to zero, never needing a dramatic
 * one-time reboot. This is "soft reset" made literal: a repeatable,
 * gentle motion, not an overcome-arc.
 *
 * Respects prefers-reduced-motion by rendering a single static frame.
 */
export function SoftResetWave() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = 0;
    let height = 0;
    let dpr = 1;

    function resize() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    const signal = getComputedStyle(document.documentElement).getPropertyValue('--signal').trim() || '#8F5A18';
    const border = getComputedStyle(document.documentElement).getPropertyValue('--bg-border').trim() || '#D8D2C4';

    // The trace: a slow, uneven line that dips low twice per cycle and
    // recovers each time — deliberately not a clean sine wave, so it
    // reads as a real signal rather than decoration.
    function traceY(x: number, t: number): number {
      const cycle = (x * 0.006 + t) % (Math.PI * 2);
      const base = Math.sin(cycle) * 0.35;
      const dip = -Math.pow(Math.sin(cycle * 0.5), 8) * 0.55;
      const wobble = Math.sin(x * 0.03 + t * 3) * 0.03;
      return base + dip + wobble;
    }

    function draw(t: number) {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      // faint baseline grid, instrument-panel feel
      ctx.strokeStyle = border;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();
      ctx.globalAlpha = 1;

      ctx.beginPath();
      ctx.strokeStyle = signal;
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      const midY = height / 2;
      const amplitude = height * 0.38;
      for (let x = 0; x <= width; x += 2) {
        const y = midY - traceY(x, t) * amplitude;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // a soft glow dot marking the current leading edge on the loop
      const headX = width * 0.86;
      const headY = midY - traceY(headX, t) * amplitude;
      ctx.beginPath();
      ctx.fillStyle = signal;
      ctx.arc(headX, headY, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    if (prefersReducedMotion) {
      draw(0);
      return () => window.removeEventListener('resize', resize);
    }

    let raf = 0;
    const start = performance.now();
    function loop(now: number) {
      const t = (now - start) / 1400;
      draw(t);
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label="A calm line that dips and recovers, repeating — visualizing a soft reset rather than a crash."
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  );
}
