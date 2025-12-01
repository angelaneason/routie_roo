import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, ChevronUp, Plus, Trash2, GripVertical } from "lucide-react";
import { toast } from "sonner";

export function SchedulerNotes() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [newNoteText, setNewNoteText] = useState("");
  const [position, setPosition] = useState({ x: 0, y: 20 });
  const [size, setSize] = useState({ width: 280, height: 400 });
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
        if (windowWidth < 640) {
          setPosition({ x: (windowWidth - size.width) / 2, y: 60 });
        } else {
          setPosition({ x: windowWidth - size.width - 20, y: 60 });
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
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    setIsDragging(true);
    setDragOffset({
      x: clientX - position.x,
      y: clientY - position.y,
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    } else if (isResizing) {
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;
      const newWidth = Math.max(250, Math.min(500, resizeStart.width + deltaX));
      const newHeight = Math.max(300, Math.min(700, resizeStart.height + deltaY));
      setSize({ width: newWidth, height: newHeight });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (isDragging) {
      const touch = e.touches[0];
      setPosition({
        x: touch.clientX - dragOffset.x,
        y: touch.clientY - dragOffset.y,
      });
      e.preventDefault();
    } else if (isResizing) {
      const touch = e.touches[0];
      const deltaX = touch.clientX - resizeStart.x;
      const deltaY = touch.clientY - resizeStart.y;
      const newWidth = Math.max(250, Math.min(500, resizeStart.width + deltaX));
      const newHeight = Math.max(300, Math.min(700, resizeStart.height + deltaY));
      setSize({ width: newWidth, height: newHeight });
      e.preventDefault();
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  // Resize handlers
  const handleResizeStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    setIsResizing(true);
    setResizeStart({
      x: clientX,
      y: clientY,
      width: size.width,
      height: size.height,
    });
  };

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, isResizing, dragOffset, resizeStart]);

  const handleAddNote = () => {
    if (newNoteText.trim()) {
      createMutation.mutate({ noteText: newNoteText.trim() });
    }
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
    <div
      ref={cardRef}
      className="fixed z-50 max-w-[calc(100vw-2rem)] select-none shadow-2xl rounded-lg transition-all duration-300"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${displayHeight}px`,
        backgroundColor: '#e9d5ff', // Light purple
        touchAction: 'none',
      }}
    >
      {/* Pushpin at top - draggable */}
      <div 
        className="absolute -top-12 left-1/2 -translate-x-1/2 cursor-grab active:cursor-grabbing z-10"
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
      >
        <img 
          src="/yellow-pushpin.png" 
          alt="Pushpin" 
          className="w-20 h-20 drop-shadow-lg pointer-events-none"
        />
      </div>

      {/* Invisible drag area for easier dragging */}
      <div 
        className="absolute top-0 left-0 right-0 h-8 cursor-grab active:cursor-grabbing"
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
      />

      {/* Content area */}
      <div className="h-full flex flex-col pt-6 px-4 pb-4">
        {/* Toggle button */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-purple-300/50"
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
                className="bg-white/50 border-purple-400/50 text-gray-900 placeholder:text-gray-600 text-sm font-bold"
                style={{ fontFamily: 'cursive' }}
              />
              <Button
                onClick={handleAddNote}
                disabled={!newNoteText.trim() || createMutation.isPending}
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 flex-shrink-0"
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
                  className="flex items-start gap-2 text-gray-900 bg-white/30 p-2 rounded"
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
                      className="flex items-start gap-2 text-gray-700 bg-white/20 p-2 rounded"
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
  );
}
