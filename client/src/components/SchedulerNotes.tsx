import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, ChevronUp, Plus, Trash2, GripVertical } from "lucide-react";
import { toast } from "sonner";

export function SchedulerNotes() {
  // Hide by default on all devices
  const [isVisible, setIsVisible] = useState(false);
  // Start collapsed on mobile to avoid covering content
  const [isExpanded, setIsExpanded] = useState(typeof window !== 'undefined' ? window.innerWidth >= 768 : true);
  const [newNoteText, setNewNoteText] = useState("");
  const [position, setPosition] = useState({ x: 0, y: 20 });
  // Smaller size on mobile to avoid covering content
  const [size, setSize] = useState({ 
    width: typeof window !== 'undefined' && window.innerWidth < 768 ? 240 : 280, 
    height: typeof window !== 'undefined' && window.innerWidth < 768 ? 300 : 400 
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  // Initialize position to top right on mount
  useEffect(() => {
    const updatePosition = () => {
      if (cardRef.current) {
        const windowWidth = window.innerWidth;
        if (windowWidth < 768) {
          // On mobile: smaller, positioned lower to avoid header
          setPosition({ x: (windowWidth - size.width) / 2, y: 120 });
          setSize({ width: 240, height: 300 });
        } else {
          // On desktop: larger, top right
          setPosition({ x: windowWidth - size.width - 20, y: 60 });
          setSize({ width: 280, height: 400 });
        }
      }
    };
    
    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [size.width]);

  const notesQuery = trpc.schedulerNotes.list.useQuery();
  const createMutation = trpc.schedulerNotes.create.useMutation({
    onSuccess: () => {
      toast.success("Note added");
      setNewNoteText("");
      notesQuery.refetch();
    },
    onError: (error) => {
      toast.error(`Failed to add note: ${error.message}`);
    },
  });

  const toggleMutation = trpc.schedulerNotes.toggleComplete.useMutation({
    onSuccess: () => {
      notesQuery.refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update note: ${error.message}`);
    },
  });

  const deleteMutation = trpc.schedulerNotes.delete.useMutation({
    onSuccess: () => {
      toast.success("Note deleted");
      notesQuery.refetch();
    },
    onError: (error) => {
      toast.error(`Failed to delete note: ${error.message}`);
    },
  });

  // Drag handlers
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    setDragOffset({
      x: clientX - position.x,
      y: clientY - position.y,
    });
  };

  const handleDragMove = (e: MouseEvent | TouchEvent) => {
    if (!isDragging) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    setPosition({
      x: clientX - dragOffset.x,
      y: clientY - dragOffset.y,
    });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Resize handlers
  const handleResizeStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    setResizeStart({
      x: clientX,
      y: clientY,
      width: size.width,
      height: size.height,
    });
  };

  const handleResizeMove = (e: MouseEvent | TouchEvent) => {
    if (!isResizing) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const deltaX = clientX - resizeStart.x;
    const deltaY = clientY - resizeStart.y;
    
    setSize({
      width: Math.max(200, resizeStart.width + deltaX),
      height: Math.max(200, resizeStart.height + deltaY),
    });
  };

  const handleResizeEnd = () => {
    setIsResizing(false);
  };

  // Add event listeners
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDragMove);
      window.addEventListener('touchend', handleDragEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [isDragging, dragOffset]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleResizeMove);
      window.addEventListener('mouseup', handleResizeEnd);
      window.addEventListener('touchmove', handleResizeMove);
      window.addEventListener('touchend', handleResizeEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleResizeMove);
      window.removeEventListener('mouseup', handleResizeEnd);
      window.removeEventListener('touchmove', handleResizeMove);
      window.removeEventListener('touchend', handleResizeEnd);
    };
  }, [isResizing, resizeStart]);

  const handleAddNote = () => {
    if (!newNoteText.trim()) return;
    createMutation.mutate({ noteText: newNoteText.trim() });
  };

  const handleToggleComplete = (id: number) => {
    toggleMutation.mutate({ id });
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate({ id });
  };

  const notes = notesQuery.data || [];
  const pendingNotes = notes.filter(n => !n.isCompleted);
  const completedNotes = notes.filter(n => n.isCompleted);

  // Collapsed height is minimal
  const displayHeight = isExpanded ? size.height : 50;

  return (
    <>
      {/* Floating toggle button - show on all devices when sticky note is hidden */}
      {!isVisible && (
        <button
          onClick={() => setIsVisible(true)}
          className="fixed bottom-6 right-4 z-50 w-14 h-14 hover:scale-110 text-purple-700 rounded-full shadow-lg flex items-center justify-center transition-all border-2 border-purple-600"
          style={{ backgroundColor: '#ecec56' }}
          aria-label="Show reminders"
        >
          <img src="/purple-pushpin.png" alt="Pin" className="w-8 h-8" />
        </button>
      )}

      {/* Sticky note - hidden on mobile by default, always visible on desktop */}
      {isVisible && (
        <div
          ref={cardRef}
          className="fixed z-40 max-w-[calc(100vw-2rem)] select-none shadow-2xl rounded-lg transition-all duration-300"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            width: `${size.width}px`,
            height: `${displayHeight}px`,
            backgroundColor: '#ecec56', // Bright yellow
            touchAction: 'none',
          }}
        >
          {/* Close button - show on all devices */}
          <button
            onClick={() => setIsVisible(false)}
            className="absolute top-2 right-2 z-50 w-8 h-8 bg-purple-600 hover:bg-purple-700 text-yellow-100 rounded-full flex items-center justify-center shadow-md"
            aria-label="Hide reminders"
          >
            ×
          </button>

          {/* Pushpin at top - draggable */}
          <div 
            className="absolute -top-12 left-1/2 -translate-x-1/2 cursor-grab active:cursor-grabbing z-10"
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
          >
            <img 
              src="/purple-pushpin.png" 
              alt="Purple Pushpin" 
              className="w-16 h-16 drop-shadow-lg pointer-events-none"
            />
          </div>

          {/* Invisible drag area for easier dragging - positioned below close button */}
          <div 
            className="absolute top-0 left-0 right-12 h-10 cursor-grab active:cursor-grabbing z-10"
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
          />

          {/* Content area */}
          <div className="h-full flex flex-col pt-6 px-4 pb-4">
            {/* Toggle button */}
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-12 h-6 w-6 p-0 hover:bg-purple-300/50 z-50"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>

            {isExpanded && (
              <div className="flex-1 flex flex-col gap-3 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                {/* Add new note */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Add reminder..."
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleAddNote();
                      }
                    }}
                    className="bg-white/70 border-purple-400 text-gray-900 placeholder:text-gray-600 text-sm font-bold"
                    style={{ fontFamily: 'cursive' }}
                  />
                  <Button
                    onClick={handleAddNote}
                    disabled={!newNoteText.trim() || createMutation.isPending}
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700 text-yellow-100 flex-shrink-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Notes list - scrollable */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {/* Pending notes */}
                  {pendingNotes.map((note) => (
                    <div
                      key={note.id}
                      className="flex items-start gap-2 text-gray-900 bg-white/50 p-2 rounded border border-purple-200"
                      style={{ fontFamily: 'cursive' }}
                    >
                      <Checkbox
                        checked={false}
                        onCheckedChange={() => handleToggleComplete(note.id)}
                        className="mt-0.5 h-4 w-4 border-gray-700"
                      />
                      <span className="flex-1 text-sm leading-tight font-bold break-words">{note.noteText}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(note.id)}
                        className="h-5 w-5 p-0 text-red-700 hover:text-red-900 hover:bg-black/10 flex-shrink-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}

                  {/* Completed notes */}
                  {completedNotes.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-purple-400/30">
                      <p className="text-xs text-gray-700 font-bold">Done</p>
                      {completedNotes.map((note) => (
                        <div
                          key={note.id}
                          className="flex items-start gap-2 text-gray-700 bg-white/30 p-2 rounded border border-purple-100"
                          style={{ fontFamily: 'cursive' }}
                        >
                          <Checkbox
                            checked={true}
                            onCheckedChange={() => handleToggleComplete(note.id)}
                            className="mt-0.5 h-4 w-4 border-gray-700"
                          />
                          <span className="flex-1 text-sm line-through opacity-60 leading-tight font-bold break-words">
                            {note.noteText}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(note.id)}
                            className="h-5 w-5 p-0 text-red-700 hover:text-red-900 hover:bg-black/10 flex-shrink-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Empty state */}
                  {notes.length === 0 && (
                    <p className="text-sm text-center text-gray-700 py-8 font-bold" style={{ fontFamily: 'cursive' }}>
                      No reminders yet!
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Resize handle - only show when expanded */}
            {isExpanded && (
              <div
                className="absolute bottom-1 right-1 cursor-nwse-resize p-2 hover:bg-purple-300/50 rounded"
                onMouseDown={handleResizeStart}
                onTouchStart={handleResizeStart}
                onClick={(e) => e.stopPropagation()}
              >
                <GripVertical className="h-4 w-4 text-purple-700" />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
