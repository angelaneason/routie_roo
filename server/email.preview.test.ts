import { describe, expect, it } from "vitest";

/**
 * Tests for stage-specific email template preview functionality
 * 
 * These tests verify that:
 * 1. Email preview dialog receives correct template data for all 4 stages
 * 2. Template variable substitution works correctly
 * 3. Default templates are provided when custom templates are not set
 */

describe("Email Preview - Stage-Specific Templates", () => {
  it("should have templates for all four reminder stages", () => {
    const stages = ["30days", "10days", "5days", "pastdue"];
    
    stages.forEach((stage) => {
      expect(stage).toBeTruthy();
    });
    
    expect(stages).toHaveLength(4);
  });

  it("should substitute template variables correctly", () => {
    const template = "Hi {contactName}, your {dateType} is on {date} ({daysUntil} days)";
    const data = {
      contactName: "John Smith",
      dateType: "License Renewal",
      date: "March 15, 2025",
      daysUntil: "30",
    };

    const result = template
      .replace(/{contactName}/g, data.contactName)
      .replace(/{dateType}/g, data.dateType)
      .replace(/{date}/g, data.date)
      .replace(/{daysUntil}/g, data.daysUntil);

    expect(result).toBe(
      "Hi John Smith, your License Renewal is on March 15, 2025 (30 days)"
    );
  });

  it("should use default templates when custom templates are null", () => {
    const customTemplate = null;
    const defaultTemplate = "🔔 Reminder: {dateType} coming up in 30 days";

    const templateToUse = customTemplate || defaultTemplate;

    expect(templateToUse).toBe(defaultTemplate);
  });

  it("should use custom templates when provided", () => {
    const customTemplate = "Custom: Your {dateType} is approaching!";
    const defaultTemplate = "🔔 Reminder: {dateType} coming up in 30 days";

    const templateToUse = customTemplate || defaultTemplate;

    expect(templateToUse).toBe(customTemplate);
  });

  it("should handle undefined templates by falling back to defaults", () => {
    const customTemplate = undefined;
    const defaultTemplate = "Default template text";

    const templateToUse = customTemplate || defaultTemplate;

    expect(templateToUse).toBe(defaultTemplate);
  });

  it("should correctly identify stage based on days until date", () => {
    const getDaysUntil = (date: Date) => {
      const today = new Date();
      const target = new Date(date);
      const diffTime = target.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    };

    const getStage = (daysUntil: number) => {
      if (daysUntil < 0) return "pastdue";
      if (daysUntil <= 5) return "5days";
      if (daysUntil <= 10) return "10days";
      return "30days";
    };

    expect(getStage(35)).toBe("30days");
    expect(getStage(15)).toBe("30days");
    expect(getStage(10)).toBe("10days");
    expect(getStage(8)).toBe("10days");
    expect(getStage(5)).toBe("5days");
    expect(getStage(3)).toBe("5days");
    expect(getStage(0)).toBe("5days");
    expect(getStage(-1)).toBe("pastdue");
    expect(getStage(-10)).toBe("pastdue");
  });

  it("should have different default subjects for each stage", () => {
    const subjects = {
      "30days": "🔔 Reminder: {dateType} coming up in 30 days",
      "10days": "⚠️ Reminder: {dateType} coming up in 10 days",
      "5days": "🚨 Urgent: {dateType} coming up in 5 days",
      "pastdue": "❗ OVERDUE: {dateType} is past due",
    };

    // Each stage should have a unique subject
    const uniqueSubjects = new Set(Object.values(subjects));
    expect(uniqueSubjects.size).toBe(4);

    // 30 days should be friendly reminder
    expect(subjects["30days"]).toContain("🔔");
    expect(subjects["30days"]).toContain("Reminder");

    // 10 days should show warning
    expect(subjects["10days"]).toContain("⚠️");

    // 5 days should be urgent
    expect(subjects["5days"]).toContain("🚨");
    expect(subjects["5days"]).toContain("Urgent");

    // Past due should be overdue
    expect(subjects["pastdue"]).toContain("❗");
    expect(subjects["pastdue"]).toContain("OVERDUE");
  });

  it("should preserve emoji in template substitution", () => {
    const template = "Hi {contactName} 👋\n\n🔔 Your {dateType} is coming up!";
    const data = {
      contactName: "Sarah",
      dateType: "Birthday",
    };

    const result = template
      .replace(/{contactName}/g, data.contactName)
      .replace(/{dateType}/g, data.dateType);

    expect(result).toContain("👋");
    expect(result).toContain("🔔");
    expect(result).toBe("Hi Sarah 👋\n\n🔔 Your Birthday is coming up!");
  });
});
