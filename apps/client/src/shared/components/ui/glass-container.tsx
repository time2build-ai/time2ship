import { ReactNode } from 'react';

import { cn } from '@/shared/lib/utils';

interface GlassContainerProps {
  children: ReactNode;
  className?: string;
}

const NOISE_BACKGROUND = `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E")`;

export function GlassContainer({ children, className }: GlassContainerProps): React.ReactElement {
  return (
    <div
      className={cn(
        'relative bg-ink-muted/30 backdrop-blur-xl border border-surface/10 rounded-2xl p-8 sm:p-10 shadow-xl overflow-hidden',
        className
      )}
      style={{ backgroundImage: NOISE_BACKGROUND }}
    >
      {children}
    </div>
  );
}
