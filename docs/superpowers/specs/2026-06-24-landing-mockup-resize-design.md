# Spec: Resize Landing Page Dashboard Preview Mockup

**Date**: 2026-06-24  
**Status**: Draft  

## Problem Description
The interactive dashboard preview mockup on the CasaNest landing page is currently too large, occupying excessive screen space on desktop devices. We want to scale it down, limit its height, and make it look clean and visually balanced—like a polished product screenshot rather than a full-size embedded dashboard. Additionally, we want to hide extra clutter on mobile/tablet screens to keep the presentation compact.

## Proposed Design

### 1. Parent Wrapper Updates in `LandingPage.tsx`
* **Section Position**: Update the interactive preview section to offset using `-mt-28 bg-white px-4 pb-24 relative z-20`.
* **Width Constraint**: Wrap the dashboard component in a `max-w-5xl` container.
* **Responsive Height Container**: Add a wrapper with `md:h-[560px] h-auto` to handle the empty gap below the scaled element on desktop, and disable scaling/fixed-height on smaller devices.
* **Scale, Rounded corners, Shadow**: Add `origin-top md:scale-[0.9] scale-100 rounded-[28px] border border-[#E5E7EB] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.06)] overflow-hidden max-h-[620px]` to the wrapper containing `LandingDashboardPreview`.

### 2. Inner Component Updates in `LandingDashboardPreview.tsx`
* **Avoid Style Redundancy**: Simplify the main wrapper div to not duplicate borders, shadows, or rounded corners, since they are now handled by the parent wrapper.
* **Mobile / Tablet Clutter Reduction**:
  - Hide the **Connected Storage Drives** card on screens below the `md` breakpoint (`hidden md:block`).
  - Hide the **Right Column** (containing the Warning Card and Security Status checklist) on screens below the `md` breakpoint (`hidden md:block`).

## Verification Plan
* Run `npm run build` inside `frontend/` to ensure Vite successfully compiles the project.
