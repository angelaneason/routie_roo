import { useState } from "react";
import { useSwipeable } from "react-swipeable";
import { Phone, MessageSquare, Navigation, X } from "lucide-react";

interface Contact {
  id: number;
  name: string | null;
  address: string | null;
  phoneNumbers: string | null;
}

interface SwipeableContactCardProps {
  contact: Contact;
  children: React.ReactNode;
  onCall?: () => void;
  onText?: () => void;
  onNavigate?: () => void;
}

export function SwipeableContactCard({
  contact,
  children,
  onCall,
  onText,
  onNavigate
}: SwipeableContactCardProps) {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

  const hasPhone = contact.phoneNumbers && contact.phoneNumbers !== "[]";
  const hasAddress = contact.address && contact.address.trim() !== "";

  // Configure swipe handlers
  const handlers = useSwipeable({
    onSwiping: (eventData) => {
      // Only allow left swipe (negative delta)
      if (eventData.deltaX < 0) {
        setIsSwiping(true);
        // Limit swipe to -180px max
        const offset = Math.max(eventData.deltaX, -180);
        setSwipeOffset(offset);
      }
    },
    onSwiped: (eventData) => {
      setIsSwiping(false);
      // If swiped more than 60px, snap to open position
      if (eventData.deltaX < -60) {
        setSwipeOffset(-180);
      } else {
        setSwipeOffset(0);
      }
    },
    trackMouse: false,
    trackTouch: true,
    preventScrollOnSwipe: true,
    delta: 10
  });

  const handleActionClick = (action: () => void) => {
    action();
    // Close swipe after action
    setSwipeOffset(0);
  };

  return (
    <div className="relative overflow-hidden">
      {/* Action Buttons Behind Card */}
      <div className="absolute right-0 top-0 bottom-0 flex items-stretch">
        {hasPhone && onCall && (
          <button
            className="w-16 bg-green-500 text-white flex items-center justify-center touch-target active:bg-green-600"
            onClick={() => handleActionClick(onCall)}
          >
            <Phone className="h-5 w-5" />
          </button>
        )}
        {hasPhone && onText && (
          <button
            className="w-16 bg-blue-500 text-white flex items-center justify-center touch-target active:bg-blue-600"
            onClick={() => handleActionClick(onText)}
          >
            <MessageSquare className="h-5 w-5" />
          </button>
        )}
        {hasAddress && onNavigate && (
          <button
            className="w-16 bg-purple-500 text-white flex items-center justify-center touch-target active:bg-purple-600"
            onClick={() => handleActionClick(onNavigate)}
          >
            <Navigation className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Swipeable Card */}
      <div
        {...handlers}
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: isSwiping ? 'none' : 'transform 0.3s ease-out'
        }}
        className="relative bg-background"
      >
        {children}
      </div>

      {/* Close button when swiped */}
      {swipeOffset < -10 && (
        <button
          className="absolute right-2 top-2 z-10 bg-background/90 rounded-full p-1 shadow-lg"
          onClick={() => setSwipeOffset(0)}
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
