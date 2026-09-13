import React, { useEffect, useState } from 'react';

interface CurveChartProps {
  dataPoints: number[];
  labels: string[];
  color?: string;
  height?: number;
  animated?: boolean;
}

export function CurveChart({
  dataPoints,
  labels,
  color = '#7da0ff',
  height = 120,
  animated = true
}: CurveChartProps) {
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    if (animated) {
      // Small delay to ensure it renders before animating
      setTimeout(() => setShouldAnimate(true), 50);
    } else {
      setShouldAnimate(true);
    }
  }, [animated]);

  if (dataPoints.length === 0) return <div style={{ height }} />;

  const width = 1000; // SVG coordinate width
  const svgHeight = 200; // SVG coordinate height

  const paddingX = 40;
  const paddingY = 20;
  const effectiveWidth = width - paddingX * 2;
  const effectiveHeight = svgHeight - paddingY * 2;

  // Normalize points
  const max = 100;
  const min = 0;
  const range = max - min;

  const points = dataPoints.map((val, i) => {
    const x = paddingX + (i / (dataPoints.length - 1)) * effectiveWidth;
    const y = paddingY + effectiveHeight - ((val - min) / range) * effectiveHeight;
    return { x, y };
  });

  // Build path with quadratic bezier smoothing through midpoints
  let d = `M ${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const mx = (p0.x + p1.x) / 2;
    const my = (p0.y + p1.y) / 2;
    // For a simple smooth, we can use the points as control points and midpoints as ends, 
    // but since we want to go THROUGH the points, a Catmull-Rom or simple smooth is better.
    // Given the constraints, a simple straight line or slightly curved line works.
    // Let's use a cubic bezier approach if we want smooth:
    const cp1x = p0.x + (p1.x - p0.x) / 3;
    const cp2x = p0.x + 2 * (p1.x - p0.x) / 3;
    d += ` C ${cp1x},${p0.y} ${cp2x},${p1.y} ${p1.x},${p1.y}`;
  }

  // Create fill path (close the shape)
  const fillD = `${d} L ${points[points.length - 1].x},${svgHeight} L ${points[0].x},${svgHeight} Z`;

  return (
    <div className="curve-chart-container" style={{ width: '100%', height: height, position: 'relative' }}>
      <svg viewBox={`0 0 ${width} ${svgHeight}`} preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block' }}>
        <defs>
          <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        
        {/* Fill */}
        <path d={fillD} fill="url(#curveGradient)" opacity={shouldAnimate ? 1 : 0} style={{ transition: 'opacity 1.5s ease' }} />
        
        {/* Stroke Line */}
        <path 
          className={shouldAnimate && animated ? "animated-path" : ""}
          d={d} 
          fill="none" 
          stroke={color} 
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            strokeDasharray: width * 2, // Approximation of path length
            strokeDashoffset: (shouldAnimate && animated) ? 0 : (animated ? width * 2 : 0),
            transition: 'stroke-dashoffset 1.5s ease-out'
          }}
        />

        {/* Labels */}
        {labels.map((label, i) => (
          <text 
            key={i} 
            x={points[i].x} 
            y={svgHeight - 2} 
            fill="var(--tertiary, rgba(255,255,255,0.4))" 
            fontSize="18" 
            textAnchor="middle"
          >
            {label}
          </text>
        ))}
      </svg>
    </div>
  );
}
