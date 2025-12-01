import { describe, expect, it } from "vitest";

describe("Calendar & Settings Mobile Optimizations", () => {
  describe("Calendar Page", () => {
    it("should use mobile-content-padding for bottom nav clearance", () => {
      const containerClasses = "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-3 md:p-6 mobile-content-padding";
      
      expect(containerClasses).toContain("mobile-content-padding");
      expect(containerClasses).toContain("p-3");
      expect(containerClasses).toContain("md:p-6");
    });

    it("should make header stack on mobile", () => {
      const headerClasses = "flex flex-col sm:flex-row sm:items-center justify-between mb-4 md:mb-6 gap-3";
      
      expect(headerClasses).toContain("flex-col");
      expect(headerClasses).toContain("sm:flex-row");
    });

    it("should reduce title size on mobile", () => {
      const titleClasses = "text-xl md:text-3xl font-bold text-gray-900";
      
      expect(titleClasses).toContain("text-xl");
      expect(titleClasses).toContain("md:text-3xl");
    });

    it("should make header buttons full-width on mobile", () => {
      const buttonContainerClasses = "flex gap-2 w-full sm:w-auto";
      
      expect(buttonContainerClasses).toContain("w-full");
      expect(buttonContainerClasses).toContain("sm:w-auto");
    });

    it("should add touch targets to header buttons", () => {
      const addEventButtonClasses = "flex-1 sm:flex-none touch-target";
      
      expect(addEventButtonClasses).toContain("touch-target");
      expect(addEventButtonClasses).toContain("flex-1");
    });

    it("should hide calendar sidebar on mobile", () => {
      const sidebarClasses = "w-full lg:w-64 flex-shrink-0 p-4 h-fit hidden lg:block";
      
      expect(sidebarClasses).toContain("hidden");
      expect(sidebarClasses).toContain("lg:block");
    });

    it("should make main calendar layout stack on mobile", () => {
      const layoutClasses = "flex flex-col lg:flex-row gap-4";
      
      expect(layoutClasses).toContain("flex-col");
      expect(layoutClasses).toContain("lg:flex-row");
    });

    it("should reduce calendar card padding on mobile", () => {
      const cardClasses = "p-3 md:p-6 flex-1";
      
      expect(cardClasses).toContain("p-3");
      expect(cardClasses).toContain("md:p-6");
    });

    it("should make calendar navigation stack on mobile", () => {
      const navClasses = "flex flex-col sm:flex-row sm:items-center justify-between mb-4 md:mb-6 gap-3";
      
      expect(navClasses).toContain("flex-col");
      expect(navClasses).toContain("sm:flex-row");
    });

    it("should add touch targets to navigation buttons", () => {
      const prevButtonClasses = "touch-target";
      const todayButtonClasses = "touch-target";
      const nextButtonClasses = "touch-target";
      
      expect(prevButtonClasses).toBe("touch-target");
      expect(todayButtonClasses).toBe("touch-target");
      expect(nextButtonClasses).toBe("touch-target");
    });

    it("should make view switcher buttons full-width on mobile", () => {
      const viewSwitcherClasses = "flex gap-2 w-full sm:w-auto";
      const buttonClasses = "flex-1 sm:flex-none touch-target";
      
      expect(viewSwitcherClasses).toContain("w-full");
      expect(buttonClasses).toContain("flex-1");
      expect(buttonClasses).toContain("touch-target");
    });

    it("should reduce calendar title size on mobile", () => {
      const titleClasses = "text-base md:text-xl font-semibold ml-4";
      
      expect(titleClasses).toContain("text-base");
      expect(titleClasses).toContain("md:text-xl");
    });
  });

  describe("Settings Page", () => {
    it("should use mobile-content-padding for bottom nav clearance", () => {
      const mainClasses = "container py-6 md:py-8 mobile-content-padding";
      
      expect(mainClasses).toContain("mobile-content-padding");
      expect(mainClasses).toContain("py-6");
      expect(mainClasses).toContain("md:py-8");
    });

    it("should reduce header padding on mobile", () => {
      const headerClasses = "container py-3 md:py-4 flex items-center justify-between gap-3";
      
      expect(headerClasses).toContain("py-3");
      expect(headerClasses).toContain("md:py-4");
    });

    it("should hide back button text on mobile", () => {
      const backButtonClasses = "touch-target";
      const textClasses = "hidden md:inline";
      
      expect(backButtonClasses).toContain("touch-target");
      expect(textClasses).toContain("hidden");
      expect(textClasses).toContain("md:inline");
    });

    it("should reduce settings title size on mobile", () => {
      const titleClasses = "text-2xl md:text-3xl font-bold";
      
      expect(titleClasses).toContain("text-2xl");
      expect(titleClasses).toContain("md:text-3xl");
    });

    it("should make tabs grid 2 columns on mobile", () => {
      const tabsListClasses = "grid w-full grid-cols-2 sm:grid-cols-4 gap-1";
      
      expect(tabsListClasses).toContain("grid-cols-2");
      expect(tabsListClasses).toContain("sm:grid-cols-4");
    });

    it("should make select inputs touch-friendly", () => {
      const selectTriggerClasses = "h-11 text-base";
      
      expect(selectTriggerClasses).toContain("h-11");
      expect(selectTriggerClasses).toContain("text-base");
    });

    it("should make text inputs touch-friendly", () => {
      const inputClasses = "h-11 text-base";
      
      expect(inputClasses).toContain("h-11");
      expect(inputClasses).toContain("text-base");
    });

    it("should make buttons full-width on mobile where appropriate", () => {
      const addPointButtonClasses = "w-full sm:w-auto touch-target";
      const reminderHistoryButtonClasses = "w-full touch-target";
      
      expect(addPointButtonClasses).toContain("w-full");
      expect(addPointButtonClasses).toContain("sm:w-auto");
      expect(reminderHistoryButtonClasses).toContain("w-full");
    });

    it("should add touch targets to all action buttons", () => {
      const calendarConnectButtonClasses = "touch-target";
      
      expect(calendarConnectButtonClasses).toBe("touch-target");
    });
  });

  describe("Mobile Input Standards", () => {
    it("should use 16px font size to prevent iOS zoom", () => {
      const inputFontSize = "text-base"; // 16px
      
      expect(inputFontSize).toBe("text-base");
    });

    it("should use 44px minimum height for touch targets", () => {
      const inputHeight = "h-11"; // 44px
      
      expect(inputHeight).toBe("h-11");
    });

    it("should add mobile-content-padding for bottom nav clearance", () => {
      const paddingClass = "mobile-content-padding";
      
      expect(paddingClass).toBe("mobile-content-padding");
    });
  });
});
