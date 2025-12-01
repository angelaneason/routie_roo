import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { ChevronDown, ChevronUp, Plus, Trash2, GripVertical } from "lucide-react";
import { toast } from "sonner";

export function SchedulerNotes() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [newNoteText, setNewNoteText] = useState("");
  const [position, setPosition] = useState({ x: 0, y: 20 }); // Start at top right
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  // Initialize position to top right on mount
  useEffect(() => {
    const updatePosition = () => {
      if (cardRef.current) {
        const cardWidth = cardRef.current.offsetWidth;
        const windowWidth = window.innerWidth;
        // On mobile, center it instead of top right
        if (windowWidth < 640) {
          setPosition({ x: (windowWidth - cardWidth) / 2, y: 20 });
        } else {
          setPosition({ x: windowWidth - cardWidth - 20, y: 20 });
        }
      }
    };
    
    // Set initial position
    updatePosition();
    
    // Update on window resize
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, []);

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

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.drag-handle')) {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch events for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('.drag-handle')) {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragOffset({
        x: touch.clientX - position.x,
        y: touch.clientY - position.y,
      });
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (isDragging) {
      const touch = e.touches[0];
      setPosition({
        x: touch.clientX - dragOffset.x,
        y: touch.clientY - dragOffset.y,
      });
      e.preventDefault(); // Prevent scrolling while dragging
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      // Mouse events
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      // Touch events
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, dragOffset]);

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
      className="fixed z-50 w-80 max-w-[calc(100vw-2rem)]"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? 'grabbing' : 'auto',
        touchAction: 'none', // Prevent default touch behaviors
      }}
    >
      <Card className="relative overflow-hidden bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 border-red-200 dark:border-red-800 shadow-xl">
        {/* Pushpin graphic - draggable */}
        <div 
          className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 cursor-grab active:cursor-grabbing drag-handle touch-none"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          <img 
            src="/sticky-note-pushpin.png" 
            alt="Pushpin" 
            className="w-16 h-16 drop-shadow-lg pointer-events-none select-none"
          />
        </div>

        {/* Header with toggle - also draggable */}
        <div 
          className="pt-12 pb-3 px-4 flex items-center justify-between drag-handle cursor-grab active:cursor-grabbing touch-none"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          <h3 className="text-lg font-bold text-red-900 dark:text-red-100 flex items-center gap-2 select-none">
            <GripVertical className="h-4 w-4 text-red-400" />
            Scheduler Reminders
          </h3>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Content */}
        {isExpanded && (
          <div className="px-4 pb-4 space-y-4">
            {/* Add new note */}
            <div className="flex gap-2">
              <Input
                placeholder="Add a reminder..."
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddNote();
                  }
                }}
                className="bg-white dark:bg-gray-900"
              />
              <Button
                onClick={handleAddNote}
                disabled={!newNoteText.trim() || createMutation.isPending}
                size="sm"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Pending notes */}
            {pendingNotes.length > 0 && (
              <div className="space-y-2">
                {pendingNotes.map((note) => (
                  <div
                    key={note.id}
                    className="flex items-start gap-2 p-2 rounded bg-white/50 dark:bg-gray-900/50"
                  >
                    <Checkbox
                      checked={false}
                      onCheckedChange={() => handleToggleComplete(note.id)}
                      className="mt-0.5"
                    />
                    <span className="flex-1 text-sm">{note.noteText}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(note.id)}
                      className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Completed notes */}
            {completedNotes.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-red-200 dark:border-red-800">
                <p className="text-xs text-muted-foreground">Completed</p>
                {completedNotes.map((note) => (
                  <div
                    key={note.id}
                    className="flex items-start gap-2 p-2 rounded bg-white/30 dark:bg-gray-900/30"
                  >
                    <Checkbox
                      checked={true}
                      onCheckedChange={() => handleToggleComplete(note.id)}
                      className="mt-0.5"
                    />
                    <span className="flex-1 text-sm line-through text-muted-foreground">
                      {note.noteText}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(note.id)}
                      className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Empty state */}
            {notes.length === 0 && (
              <p className="text-sm text-center text-muted-foreground py-4">
                No reminders yet. Add one above!
              </p>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
