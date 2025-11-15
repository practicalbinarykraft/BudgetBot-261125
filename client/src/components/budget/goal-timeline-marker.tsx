// No imports needed - using SVG symbols for Safari compatibility

/**
 * Visual marker for goal on financial timeline
 * 
 * Renders a colored circle with icon based on priority
 * Used inside Recharts ReferenceDot component
 * 
 * Модульный, <80 строк, джуну понятно
 */
interface GoalTimelineMarkerProps {
  cx?: number; // X coordinate from Recharts
  cy?: number; // Y coordinate from Recharts
  priority: string;
  onClick?: () => void;
}

export function GoalTimelineMarker({ 
  cx = 0, 
  cy = 0, 
  priority,
  onClick 
}: GoalTimelineMarkerProps) {
  // Priority-based styling
  const config = getPriorityConfig(priority);
  
  return (
    <g onClick={onClick} style={{ cursor: "pointer" }}>
      {/* Outer glow circle - expands on hover */}
      <circle
        cx={cx}
        cy={cy}
        r={12}
        fill={config.glowColor}
        opacity={0.3}
      >
        <animate
          attributeName="r"
          begin="mouseover"
          end="mouseout"
          from="12"
          to="15"
          dur="0.2s"
          fill="freeze"
        />
        <animate
          attributeName="opacity"
          begin="mouseover"
          end="mouseout"
          from="0.3"
          to="0.5"
          dur="0.2s"
          fill="freeze"
        />
      </circle>
      
      {/* Main marker circle - grows on hover */}
      <circle
        cx={cx}
        cy={cy}
        r={8}
        fill="white"
        stroke={config.borderColor}
        strokeWidth={2.5}
        data-testid={`marker-${priority}`}
      >
        <animate
          attributeName="r"
          begin="mouseover"
          end="mouseout"
          from="8"
          to="10"
          dur="0.2s"
          fill="freeze"
        />
      </circle>
      
      {/* Icon - not using foreignObject for Safari compatibility */}
      <text
        x={cx}
        y={cy + 1}
        fontSize="10"
        textAnchor="middle"
        dominantBaseline="middle"
        fill={config.iconColor}
        fontWeight="bold"
      >
        {config.symbol}
      </text>
    </g>
  );
}

/**
 * Get priority-based visual configuration
 * High priority: Red star (urgent)
 * Medium priority: Orange plus (important)
 * Low priority: Blue circle (future)
 * 
 * Using symbols instead of SVG icons for Safari compatibility
 */
function getPriorityConfig(priority: string) {
  switch (priority) {
    case "high":
      return {
        symbol: "★", // Star
        borderColor: "#ef4444", // red-500
        iconColor: "#ef4444",
        glowColor: "#ef4444",
      };
    case "medium":
      return {
        symbol: "◆", // Diamond
        borderColor: "#f97316", // orange-500
        iconColor: "#f97316",
        glowColor: "#f97316",
      };
    case "low":
    default:
      return {
        symbol: "●", // Circle
        borderColor: "#3b82f6", // blue-500
        iconColor: "#3b82f6",
        glowColor: "#3b82f6",
      };
  }
}
