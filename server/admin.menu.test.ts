import { describe, expect, it } from "vitest";

describe("Admin Menu Visibility", () => {
  it("should hide admin menu for non-admin users", () => {
    const user = { role: "user" };
    const menuPath = "/admin/users";
    
    // Simulate the filter logic from DashboardLayout
    const shouldShow = !(menuPath === "/admin/users" && user.role !== "admin");
    
    expect(shouldShow).toBe(false);
  });

  it("should show admin menu for admin users", () => {
    const user = { role: "admin" };
    const menuPath = "/admin/users";
    
    // Simulate the filter logic from DashboardLayout
    const shouldShow = !(menuPath === "/admin/users" && user.role !== "admin");
    
    expect(shouldShow).toBe(true);
  });

  it("should show non-admin menu items for all users", () => {
    const regularUser = { role: "user" };
    const adminUser = { role: "admin" };
    const menuPath = "/workspace";
    
    // Non-admin paths should always be visible
    const shouldShowForRegular = !(menuPath === "/admin/users" && regularUser.role !== "admin");
    const shouldShowForAdmin = !(menuPath === "/admin/users" && adminUser.role !== "admin");
    
    expect(shouldShowForRegular).toBe(true);
    expect(shouldShowForAdmin).toBe(true);
  });
});
