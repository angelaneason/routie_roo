import { ReactNode, useRef, useState, TouchEvent } from "react";
import { Loader2 } from "lucide-react";

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  disabled?: boolean;
}

export function PullToRefresh({ children, onRefresh, disabled = false }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const PULL_THRESHOLD = 80; // Distance needed to trigger refresh
  const MAX_PULL = 120; // Maximum pull distance

  const handleTouchStart = (e: TouchEvent) => {
    if (disabled || isRefreshing) return;
    
    // Only start pull if we're at the top of the page
    if (window.scrollY === 0) {
      startY.current = e.touches[0]?.clientY || 0;
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (disabled || isRefreshing || startY.current === 0) return;

    const currentY = e.touches[0]?.clientY || 0;
    const distance = currentY - startY.current;

    // Only pull down, and only when at top of page
    if (distance > 0 && window.scrollY === 0) {
      // Apply resistance to make it feel natural
      const resistedDistance = Math.min(distance * 0.5, MAX_PULL);
      setPullDistance(resistedDistance);
      
      // Prevent default scroll behavior when pulling
      if (resistedDistance > 10) {
        e.preventDefault();
      }
    }
  };

  const handleTouchEnd = async () => {
    if (disabled || isRefreshing) return;

    if (pullDistance >= PULL_THRESHOLD) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } catch (error) {
        console.error("Refresh failed:", error);
      } finally {
        setIsRefreshing(false);
      }
    }

    setPullDistance(0);
    startY.current = 0;
  };

  const refreshIndicatorOpacity = Math.min(pullDistance / PULL_THRESHOLD, 1);
  const showRefreshIndicator = pullDistance > 0 || isRefreshing;

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative"
      style={{
        transform: isRefreshing ? `translateY(${PULL_THRESHOLD}px)` : `translateY(${pullDistance}px)`,
        transition: isRefreshing || pullDistance === 0 ? "transform 0.3s ease" : "none",
      }}
    >
      {/* Pull-to-refresh indicator */}
      {showRefreshIndicator && (
        <div
          className="absolute top-0 left-0 right-0 flex items-center justify-center"
          style={{
            height: `${PULL_THRESHOLD}px`,
            transform: `translateY(-${PULL_THRESHOLD}px)`,
            opacity: refreshIndicatorOpacity,
          }}
        >
          <div className="flex flex-col items-center gap-2 text-blue-600">
            {isRefreshing ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-sm font-medium">Refreshing...</span>
              </>
            ) : pullDistance >= PULL_THRESHOLD ? (
              <>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                <span className="text-sm font-medium">Release to refresh</span>
              </>
            ) : (
              <>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
                <span className="text-sm font-medium">Pull to refresh</span>
              </>
            )}
          </div>
        </div>
      )}

      {children}
    </div>
  );
}
