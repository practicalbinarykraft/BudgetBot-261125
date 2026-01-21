/**
 * Circular Progress Component
 * 
 * Apple Watch-style circular progress indicator
 */

interface CircularProgressProps {
  /** Progress value (0-1) */
  progress: number;
  /** Size of the circle */
  size?: number;
  /** Stroke width */
  strokeWidth?: number;
  /** Color of the progress ring */
  color?: string;
  /** Background color of the ring */
  backgroundColor?: string;
  /** Children to render in the center */
  children?: React.ReactNode;
  /** Additional className */
  className?: string;
}

export function CircularProgress({
  progress,
  size = 64,
  strokeWidth = 4,
  color = '#3b82f6',
  backgroundColor = '#e5e7eb',
  children,
  className = '',
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - progress * circumference;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg
        className="absolute inset-0 -rotate-90"
        width={size}
        height={size}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-300 ease-out"
        />
      </svg>
      {/* Content in center */}
      <div className="relative z-10 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}
