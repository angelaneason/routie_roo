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

  // Mouse and touch event handlers
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
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
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
      className="fixed z-50 w-[320px] h-[320px] max-w-[calc(100vw-2rem)] cursor-grab active:cursor-grabbing select-none"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
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
      <div className="absolute inset-0 pt-[85px] px-6 pb-8 flex flex-col">
        {/* Toggle button */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-[75px] right-3 h-6 w-6 p-0 hover:bg-black/10"
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
                className="bg-transparent border-gray-600/30 text-gray-900 placeholder:text-gray-600 text-xs h-6 px-2"
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
                <span className="flex-1 text-sm leading-tight">{note.noteText}</span>
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
                <p className="text-[10px] text-gray-700 font-semibold">Done</p>
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
                    <span className="flex-1 text-sm line-through opacity-60 leading-tight">
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
              <p className="text-xs text-center text-gray-700 py-2" style={{ fontFamily: 'cursive' }}>
                No reminders yet!
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
