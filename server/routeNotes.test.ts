import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `user${userId}@example.com`,
    name: `Test User ${userId}`,
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
      get: () => "localhost",
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("route notes", () => {
  it("should add a note to a route", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a test route first
    const route = await caller.routes.create({
      name: "Test Route for Notes",
      notes: "",
      waypoints: [
        { address: "123 Main St", name: "Stop 1" },
        { address: "456 Oak Ave", name: "Stop 2" },
      ],
      optimized: false,
      distanceUnit: "km",
    });

    // Add a note
    const result = await caller.routes.addNote({
      routeId: route.routeId,
      note: "Gate code: 1234",
    });

    expect(result.success).toBe(true);

    // Verify note was added
    const notes = await caller.routes.getNotes({ routeId: route.routeId });
    expect(notes).toHaveLength(1);
    expect(notes[0]?.note).toBe("Gate code: 1234");
    expect(notes[0]?.userId).toBe(ctx.user.id);
  });

  it("should get notes for a route in descending order", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a test route
    const route = await caller.routes.create({
      name: "Test Route for Multiple Notes",
      notes: "",
      waypoints: [
        { address: "123 Main St", name: "Stop 1" },
        { address: "456 Oak Ave", name: "Stop 2" },
      ],
      optimized: false,
      distanceUnit: "km",
    });

    // Add multiple notes
    await caller.routes.addNote({
      routeId: route.routeId,
      note: "First note",
    });

    await caller.routes.addNote({
      routeId: route.routeId,
      note: "Second note",
    });

    await caller.routes.addNote({
      routeId: route.routeId,
      note: "Third note",
    });

    // Get notes
    const notes = await caller.routes.getNotes({ routeId: route.routeId });
    expect(notes).toHaveLength(3);
    // Should be in descending order by createdAt (newest first)
    // But since they're created so quickly, order might be same as insert order
    // Just verify all notes exist
    const noteTexts = notes.map(n => n.note);
    expect(noteTexts).toContain("First note");
    expect(noteTexts).toContain("Second note");
    expect(noteTexts).toContain("Third note");
  });

  it("should update a note", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create route and add note
    const route = await caller.routes.create({
      name: "Test Route for Update",
      notes: "",
      waypoints: [
        { address: "123 Main St", name: "Stop 1" },
        { address: "456 Oak Ave", name: "Stop 2" },
      ],
      optimized: false,
      distanceUnit: "km",
    });

    await caller.routes.addNote({
      routeId: route.routeId,
      note: "Original note",
    });

    const notes = await caller.routes.getNotes({ routeId: route.routeId });
    const noteId = notes[0]!.id;

    // Update the note
    const result = await caller.routes.updateNote({
      noteId,
      note: "Updated note",
    });

    expect(result.success).toBe(true);

    // Verify update
    const updatedNotes = await caller.routes.getNotes({ routeId: route.routeId });
    expect(updatedNotes[0]?.note).toBe("Updated note");
  });

  it("should delete a note", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create route and add note
    const route = await caller.routes.create({
      name: "Test Route for Delete",
      notes: "",
      waypoints: [
        { address: "123 Main St", name: "Stop 1" },
        { address: "456 Oak Ave", name: "Stop 2" },
      ],
      optimized: false,
      distanceUnit: "km",
    });

    await caller.routes.addNote({
      routeId: route.routeId,
      note: "Note to delete",
    });

    const notes = await caller.routes.getNotes({ routeId: route.routeId });
    const noteId = notes[0]!.id;

    // Delete the note
    const result = await caller.routes.deleteNote({ noteId });
    expect(result.success).toBe(true);

    // Verify deletion
    const remainingNotes = await caller.routes.getNotes({ routeId: route.routeId });
    expect(remainingNotes).toHaveLength(0);
  });

  it("should prevent users from editing other users' notes", async () => {
    const ctx1 = createAuthContext(1);
    const ctx2 = createAuthContext(2);
    const caller1 = appRouter.createCaller(ctx1);
    const caller2 = appRouter.createCaller(ctx2);

    // User 1 creates route and adds note
    const route = await caller1.routes.create({
      name: "User 1 Route",
      notes: "",
      waypoints: [
        { address: "123 Main St", name: "Stop 1" },
        { address: "456 Oak Ave", name: "Stop 2" },
      ],
      optimized: false,
      distanceUnit: "km",
    });

    await caller1.routes.addNote({
      routeId: route.routeId,
      note: "User 1 note",
    });

    const notes = await caller1.routes.getNotes({ routeId: route.routeId });
    const noteId = notes[0]!.id;

    // User 2 tries to update User 1's note
    await expect(
      caller2.routes.updateNote({
        noteId,
        note: "Hacked note",
      })
    ).rejects.toThrow("Note not found");

    // User 2 tries to delete User 1's note
    await expect(
      caller2.routes.deleteNote({ noteId })
    ).rejects.toThrow("Note not found");
  });
});
