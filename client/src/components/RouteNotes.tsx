import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Loader2, MessageSquare, Pencil, Trash2, X, Check } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface RouteNotesProps {
  routeId: number;
}

export default function RouteNotes({ routeId }: RouteNotesProps) {
  const [newNote, setNewNote] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");

  const utils = trpc.useUtils();
  const notesQuery = trpc.routes.getNotes.useQuery({ routeId });
  const addNoteMutation = trpc.routes.addNote.useMutation({
    onSuccess: () => {
      utils.routes.getNotes.invalidate({ routeId });
      setNewNote("");
      toast.success("Note added");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add note");
    },
  });

  const updateNoteMutation = trpc.routes.updateNote.useMutation({
    onSuccess: () => {
      utils.routes.getNotes.invalidate({ routeId });
      setEditingNoteId(null);
      setEditingText("");
      toast.success("Note updated");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update note");
    },
  });

  const deleteNoteMutation = trpc.routes.deleteNote.useMutation({
    onSuccess: () => {
      utils.routes.getNotes.invalidate({ routeId });
      toast.success("Note deleted");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete note");
    },
  });

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    addNoteMutation.mutate({ routeId, note: newNote.trim() });
  };

  const handleStartEdit = (noteId: number, currentText: string) => {
    setEditingNoteId(noteId);
    setEditingText(currentText);
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditingText("");
  };

  const handleSaveEdit = (noteId: number) => {
    if (!editingText.trim()) return;
    updateNoteMutation.mutate({ noteId, note: editingText.trim() });
  };

  const handleDeleteNote = (noteId: number) => {
    if (confirm("Are you sure you want to delete this note?")) {
      deleteNoteMutation.mutate({ noteId });
    }
  };

  if (notesQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const notes = notesQuery.data || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-lg font-semibold">Notes</h3>
        <span className="text-sm text-muted-foreground">({notes.length})</span>
      </div>

      {/* Add new note */}
      <div className="space-y-2">
        <Textarea
          placeholder="Add a note (e.g., gate code, client preferences, delivery instructions...)"
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          className="min-h-[80px]"
        />
        <Button
          size="sm"
          onClick={handleAddNote}
          disabled={!newNote.trim() || addNoteMutation.isPending}
        >
          {addNoteMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <MessageSquare className="h-4 w-4 mr-2" />
          )}
          Add Note
        </Button>
      </div>

      {/* Notes list */}
      {notes.length === 0 ? (
        <Card className="p-6 text-center text-muted-foreground">
          <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-20" />
          <p>No notes yet. Add your first note above.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <Card key={note.id} className="p-4">
              {editingNoteId === note.id ? (
                <div className="space-y-2">
                  <Textarea
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    className="min-h-[80px]"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleSaveEdit(note.id)}
                      disabled={!editingText.trim() || updateNoteMutation.isPending}
                    >
                      {updateNoteMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4 mr-2" />
                      )}
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelEdit}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <p className="flex-1 whitespace-pre-wrap">{note.note}</p>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleStartEdit(note.id, note.note)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteNote(note.id)}
                        disabled={deleteNoteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
                  </p>
                </>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
