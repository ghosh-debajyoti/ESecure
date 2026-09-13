import React, { useEffect, useState } from 'react';
import { getSeverityColorClass } from '../utils/colors';

interface CircularProgressProps {
  value: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'threat' | 'confidence' | 'status';
  label?: string;
  sublabel?: string;
  animated?: boolean;
}

export function CircularProgress({
  value,
  size = 'md',
  variant = 'threat',
  label,
  sublabel,
  animated = true
}: CircularProgressProps) {
  const [currentValue, setCurrentValue] = useState(animated ? 0 : value);

  useEffect(() => {
    if (animated) {
      const duration = 1200;
      const startTime = performance.now();
      const step = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // ease-out cubic
        const ease = 1 - Math.pow(1 - progress, 3);
        setCurrentValue(Math.round(ease * value));
        if (progress < 1) {
          requestAnimationFrame(step);
        }
      };
      requestAnimationFrame(step);
    } else {
      setCurrentValue(value);
    }
  }, [value, animated]);

  let sizePx = 180;
  if (size === 'sm') sizePx = 120;
  if (size === 'lg') sizePx = 240;

  const strokeWidth = 8;
  const radius = (sizePx - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (currentValue / 100) * circumference;

  let strokeClass = '';
  if (variant === 'threat') {
    strokeClass = `stroke-${getSeverityColorClass(value)}`;
  } else {
    strokeClass = 'stroke-info';
  }

  return (
    <div className="circular-progress-container" style={{ width: sizePx, height: sizePx, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={sizePx} height={sizePx} style={{ transform: 'rotate(-90deg)' }} aria-label={`${label || 'Progress'}: ${value}`}>
        {label && <title>{label}: {value}</title>}
        <circle
          cx={sizePx / 2}
          cy={sizePx / 2}
          r={radius}
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          className={`${animated ? "indicator" : ""} ${strokeClass}`}
          cx={sizePx / 2}
          cy={sizePx / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: animated ? circumference : strokeDashoffset,
          }}
        />
      </svg>
      <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <span className={strokeClass.replace('stroke-', 'text-')} style={{ fontSize: size === 'lg' ? '48px' : size === 'md' ? '32px' : '24px', fontWeight: 'bold', lineHeight: 1 }}>
          {currentValue}
        </span>
        {label && <span style={{ fontSize: '12px', color: 'var(--secondary)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>}
        {sublabel && <span style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '2px' }}>{sublabel}</span>}
      </div>
    </div>
  );
}
