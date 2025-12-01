import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function SchedulerNotes() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [newNoteText, setNewNoteText] = useState("");
  const [position, setPosition] = useState({ x: 0, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  // Initialize position to top right on mount
  useEffect(() => {
    const updatePosition = () => {
      if (cardRef.current) {
        const cardWidth = cardRef.current.offsetWidth;
        const windowWidth = window.innerWidth;
        if (windowWidth < 640) {
          setPosition({ x: (windowWidth - cardWidth) / 2, y: 20 });
        } else {
          setPosition({ x: windowWidth - cardWidth - 20, y: 20 });
        }
      }
    };
    
    updatePosition();
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
      e.preventDefault();
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
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
        touchAction: 'none',
      }}
    >
      {/* Pushpin - draggable handle */}
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

      {/* Sticky note paper */}
      <div className="pt-14 pb-6 px-6 bg-gradient-to-br from-[#ffd89b] to-[#ffb347] shadow-2xl rounded-sm relative"
        style={{
          boxShadow: '0 10px 30px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.5)',
        }}
      >
        {/* Toggle button */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-black/10"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>

        {/* Title - handwritten style */}
        <h3 className="text-xl font-bold text-gray-800 mb-4 text-center" style={{ fontFamily: 'cursive' }}>
          Reminders
        </h3>

        {isExpanded && (
          <div className="space-y-3">
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
                className="bg-white/40 border-gray-400/50 text-gray-900 placeholder:text-gray-600"
                style={{ fontFamily: 'cursive' }}
              />
              <Button
                onClick={handleAddNote}
                disabled={!newNoteText.trim() || createMutation.isPending}
                size="sm"
                className="bg-orange-600 hover:bg-orange-700"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Pending notes - written on sticky note */}
            {pendingNotes.length > 0 && (
              <div className="space-y-2">
                {pendingNotes.map((note) => (
                  <div
                    key={note.id}
                    className="flex items-start gap-2 text-gray-900"
                    style={{ fontFamily: 'cursive' }}
                  >
                    <Checkbox
                      checked={false}
                      onCheckedChange={() => handleToggleComplete(note.id)}
                      className="mt-1 border-gray-700"
                    />
                    <span className="flex-1 text-base leading-relaxed">{note.noteText}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(note.id)}
                      className="h-5 w-5 p-0 text-red-700 hover:text-red-900 hover:bg-black/10"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Completed notes */}
            {completedNotes.length > 0 && (
              <div className="space-y-2 pt-3 border-t border-gray-400/30">
                <p className="text-xs text-gray-700 font-semibold">Done</p>
                {completedNotes.map((note) => (
                  <div
                    key={note.id}
                    className="flex items-start gap-2 text-gray-700"
                    style={{ fontFamily: 'cursive' }}
                  >
                    <Checkbox
                      checked={true}
                      onCheckedChange={() => handleToggleComplete(note.id)}
                      className="mt-1 border-gray-700"
                    />
                    <span className="flex-1 text-base line-through opacity-60">
                      {note.noteText}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(note.id)}
                      className="h-5 w-5 p-0 text-red-700 hover:text-red-900 hover:bg-black/10"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Empty state */}
            {notes.length === 0 && (
              <p className="text-sm text-center text-gray-700 py-4" style={{ fontFamily: 'cursive' }}>
                No reminders yet!
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
