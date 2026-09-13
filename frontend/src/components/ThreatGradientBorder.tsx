import React from 'react';
import { getSeverityColorClass } from '../utils/colors';

interface ThreatGradientBorderProps {
  threatLevel: number;
  children?: React.ReactNode;
}

export function ThreatGradientBorder({ threatLevel, children }: ThreatGradientBorderProps) {
  const gradientClass = `bg-${getSeverityColorClass(threatLevel)}`;

  // We assume the parent class has position: relative and overflow: hidden
  return (
    <>
      <div className={`threat-gradient-overlay ${gradientClass}`} />
      {children}
    </>
  );
}
