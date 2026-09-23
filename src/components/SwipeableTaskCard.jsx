import React, { useState, useRef } from 'react';
import { Check, Calendar } from 'lucide-react';

export default function SwipeableTaskCard({ 
  children, 
  onSwipeRight, 
  onSwipeLeft, 
  disabled = false,
  swipeRightLabel = 'Mark Complete',
  swipeLeftLabel = 'Postpone'
}) {
  const [dragX, setDragX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const touchStartX = useRef(null);

  const handleTouchStart = (e) => {
    if (disabled) return;
    touchStartX.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e) => {
    if (disabled || touchStartX.current === null) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - touchStartX.current;
    
    // Dampen drag effect past threshold
    let clampedDiff = diff;
    if (diff > 140) clampedDiff = 140 + (diff - 140) * 0.2;
    if (diff < -140) clampedDiff = -140 + (diff + 140) * 0.2;

    setDragX(clampedDiff);
  };

  const handleTouchEnd = () => {
    if (disabled) return;
    setIsSwiping(false);

    if (dragX > 90 && onSwipeRight) {
      onSwipeRight();
    } else if (dragX < -90 && onSwipeLeft) {
      onSwipeLeft();
    }

    setDragX(0);
    touchStartX.current = null;
  };

  const opacityRight = Math.min(Math.max(dragX / 90, 0), 1);
  const opacityLeft = Math.min(Math.max(-dragX / 90, 0), 1);

  return (
    <div className="relative overflow-hidden rounded-2xl select-none touch-pan-y">
      {/* BACKGROUND SWIPE LAYERS */}
      <div className="absolute inset-0 flex items-center justify-between pointer-events-none rounded-2xl overflow-hidden">
        {/* SWIPE RIGHT LAYER (GREEN: COMPLETE) */}
        <div 
          className="h-full bg-emerald-600 text-white font-bold text-xs flex items-center gap-2 px-4 transition-opacity"
          style={{ opacity: opacityRight, width: `${Math.max(dragX, 0)}px` }}
        >
          <Check className="w-5 h-5 shrink-0" />
          <span className="truncate">{swipeRightLabel}</span>
        </div>

        {/* SWIPE LEFT LAYER (PURPLE: POSTPONE) */}
        <div 
          className="h-full bg-purple-600 text-white font-bold text-xs flex items-center justify-end gap-2 px-4 ml-auto transition-opacity"
          style={{ opacity: opacityLeft, width: `${Math.max(-dragX, 0)}px` }}
        >
          <span className="truncate">{swipeLeftLabel}</span>
          <Calendar className="w-5 h-5 shrink-0" />
        </div>
      </div>

      {/* SWIPEABLE CONTENT CONTAINER */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateX(${dragX}px)`,
          transition: isSwiping ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)'
        }}
        className="relative z-10"
      >
        {children}
      </div>
    </div>
  );
}
