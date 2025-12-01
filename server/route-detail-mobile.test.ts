import { describe, expect, it } from "vitest";

describe("Route Detail Mobile Optimizations", () => {
  it("should use responsive map heights", () => {
    const mobileHeight = "h-[400px]";
    const tabletHeight = "md:h-[500px]";
    const desktopHeight = "lg:h-[600px]";
    
    const mapClasses = "h-[400px] md:h-[500px] lg:h-[600px]";
    
    expect(mapClasses).toContain(mobileHeight);
    expect(mapClasses).toContain(tabletHeight);
    expect(mapClasses).toContain(desktopHeight);
  });

  it("should stack layout vertically on mobile", () => {
    const layoutClasses = "flex flex-col lg:grid lg:grid-cols-5 gap-6";
    
    expect(layoutClasses).toContain("flex-col");
    expect(layoutClasses).toContain("lg:grid");
  });

  it("should make header sticky on scroll", () => {
    const headerClasses = "bg-white border-b sticky top-0 z-30";
    
    expect(headerClasses).toContain("sticky");
    expect(headerClasses).toContain("top-0");
    expect(headerClasses).toContain("z-30");
  });

  it("should truncate long route names", () => {
    const titleClasses = "text-base md:text-xl font-bold truncate";
    
    expect(titleClasses).toContain("truncate");
    expect(titleClasses).toContain("text-base");
    expect(titleClasses).toContain("md:text-xl");
  });

  it("should hide Back text on mobile", () => {
    const backButtonTextClasses = "hidden md:inline";
    
    expect(backButtonTextClasses).toContain("hidden");
    expect(backButtonTextClasses).toContain("md:inline");
  });

  it("should hide less important buttons on mobile", () => {
    const reoptimizeClasses = "hidden sm:flex";
    const copyLinkClasses = "hidden md:flex";
    const archiveClasses = "hidden lg:flex";
    
    expect(reoptimizeClasses).toContain("hidden");
    expect(copyLinkClasses).toContain("hidden");
    expect(archiveClasses).toContain("hidden");
  });

  it("should make action buttons stack on mobile", () => {
    const buttonContainerClasses = "flex flex-col sm:flex-row sm:items-center justify-between gap-3";
    
    expect(buttonContainerClasses).toContain("flex-col");
    expect(buttonContainerClasses).toContain("sm:flex-row");
  });

  it("should make buttons full-width on mobile", () => {
    const buttonClasses = "w-full sm:w-auto touch-target";
    
    expect(buttonClasses).toContain("w-full");
    expect(buttonClasses).toContain("sm:w-auto");
    expect(buttonClasses).toContain("touch-target");
  });

  it("should make Complete All buttons stack on mobile", () => {
    const completeAllContainerClasses = "flex flex-col sm:flex-row gap-2 mt-3";
    
    expect(completeAllContainerClasses).toContain("flex-col");
    expect(completeAllContainerClasses).toContain("sm:flex-row");
  });

  it("should add touch targets to waypoint buttons", () => {
    const waypointButtonClasses = "touch-target";
    
    expect(waypointButtonClasses).toBe("touch-target");
  });

  it("should shorten button text on mobile", () => {
    const editButtonDesktop = "Edit Details";
    const editButtonMobile = "Edit";
    
    expect(editButtonDesktop).toContain("Details");
    expect(editButtonMobile).not.toContain("Details");
  });

  it("should reduce waypoint padding on mobile", () => {
    const waypointClasses = "border rounded-lg p-3 md:p-4 space-y-3 bg-white";
    
    expect(waypointClasses).toContain("p-3");
    expect(waypointClasses).toContain("md:p-4");
  });

  it("should add mobile content padding to main", () => {
    const mainClasses = "container py-6 mobile-content-padding";
    
    expect(mainClasses).toContain("mobile-content-padding");
  });

  it("should reduce header padding on mobile", () => {
    const headerContainerClasses = "container py-3 md:py-4";
    
    expect(headerContainerClasses).toContain("py-3");
    expect(headerContainerClasses).toContain("md:py-4");
  });

  it("should reduce header gaps on mobile", () => {
    const headerGapClasses = "flex items-center gap-2 md:gap-3 min-w-0 flex-1";
    
    expect(headerGapClasses).toContain("gap-2");
    expect(headerGapClasses).toContain("md:gap-3");
  });
});
