import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, ChevronUp, Plus, Trash2, Maximize2 } from "lucide-react";
import { toast } from "sonner";

export function SchedulerNotes() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [newNoteText, setNewNoteText] = useState("");
  const [position, setPosition] = useState({ x: 0, y: 20 });
  const [size, setSize] = useState({ width: 320, height: 320 });
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
          setPosition({ x: (windowWidth - size.width) / 2, y: 20 });
        } else {
          setPosition({ x: windowWidth - size.width - 20, y: 20 });
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
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
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
      const newWidth = Math.max(250, resizeStart.width + deltaX);
      const newHeight = Math.max(250, resizeStart.height + deltaY);
      setSize({ width: newWidth, height: newHeight });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setIsDragging(true);
    setDragOffset({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y,
    });
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
      const newWidth = Math.max(250, resizeStart.width + deltaX);
      const newHeight = Math.max(250, resizeStart.height + deltaY);
      setSize({ width: newWidth, height: newHeight });
      e.preventDefault();
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  // Resize handlers
  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
    });
  };

  const handleResizeTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    const touch = e.touches[0];
    setIsResizing(true);
    setResizeStart({
      x: touch.clientX,
      y: touch.clientY,
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

  return (
    <div
      ref={cardRef}
      className="fixed z-50 max-w-[calc(100vw-2rem)] cursor-grab active:cursor-grabbing select-none"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        backgroundImage: 'url(/sticky-note-pushpin.png)',
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        touchAction: 'none',
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {/* Content overlay on the sticky note */}
      <div className="absolute inset-0 pt-[110px] px-6 pb-8 flex flex-col">
        {/* Toggle button */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-[100px] right-3 h-6 w-6 p-0 hover:bg-black/10"
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

        {/* Resize handle */}
        <div
          className="absolute bottom-1 right-1 cursor-nwse-resize p-1 hover:bg-black/10 rounded"
          onMouseDown={handleResizeStart}
          onTouchStart={handleResizeTouchStart}
          onClick={(e) => e.stopPropagation()}
        >
          <Maximize2 className="h-3 w-3 text-gray-600" />
        </div>

        {isExpanded && (
          <div className="space-y-2 overflow-y-auto flex-1" onClick={(e) => e.stopPropagation()}>
            {/* Add new note */}
            <div className="flex gap-1">
              <Input
                placeholder="Add..."
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddNote();
                  }
                }}
                className="bg-transparent border-gray-600/30 text-gray-900 placeholder:text-gray-600 text-xs h-6 px-2 font-bold"
                style={{ fontFamily: 'cursive' }}
              />
              <Button
                onClick={handleAddNote}
                disabled={!newNoteText.trim() || createMutation.isPending}
                size="sm"
                className="bg-orange-600 hover:bg-orange-700 h-6 w-6 p-0 flex-shrink-0"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            {/* Pending notes */}
            {pendingNotes.map((note) => (
              <div
                key={note.id}
                className="flex items-start gap-1 text-gray-900"
                style={{ fontFamily: 'cursive' }}
              >
                <Checkbox
                  checked={false}
                  onCheckedChange={() => handleToggleComplete(note.id)}
                  className="mt-0.5 h-4 w-4 border-gray-700"
                />
                <span className="flex-1 text-sm leading-tight font-bold">{note.noteText}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(note.id)}
                  className="h-4 w-4 p-0 text-red-700 hover:text-red-900 hover:bg-black/10"
                >
                  <Trash2 className="h-2.5 w-2.5" />
                </Button>
              </div>
            ))}

            {/* Completed notes */}
            {completedNotes.length > 0 && (
              <div className="space-y-1 pt-2 border-t border-gray-600/20">
                <p className="text-[10px] text-gray-700 font-bold">Done</p>
                {completedNotes.map((note) => (
                  <div
                    key={note.id}
                    className="flex items-start gap-1 text-gray-700"
                    style={{ fontFamily: 'cursive' }}
                  >
                    <Checkbox
                      checked={true}
                      onCheckedChange={() => handleToggleComplete(note.id)}
                      className="mt-0.5 h-4 w-4 border-gray-700"
                    />
                    <span className="flex-1 text-sm line-through opacity-60 leading-tight font-bold">
                      {note.noteText}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(note.id)}
                      className="h-4 w-4 p-0 text-red-700 hover:text-red-900 hover:bg-black/10"
                    >
                      <Trash2 className="h-2.5 w-2.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Empty state */}
            {notes.length === 0 && (
              <p className="text-xs text-center text-gray-700 py-2 font-bold" style={{ fontFamily: 'cursive' }}>
                No reminders yet!
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
