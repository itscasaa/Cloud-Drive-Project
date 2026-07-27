# CasaNest Landing Product Story Redesign Report

This report outlines the landing page changes made to CasaNest and documents how they successfully clarify the product's value proposition, security guarantees, target users, and safe-by-default architecture.

## Product Narrative Alignments

### 1. What CasaNest Is (Product Definition)
- **Problem:** Previously, visitors did not understand whether CasaNest replaced Google Drive or acted as a new storage system.
- **Redesign Solution:**
  - The **Hero Section** clarifies that CasaNest is a secure dashboard layer.
  - The **Product Explanation Section** (*"What is CasaNest?"*) introduces the product as a *"secure dashboard layer for Google Drive"* and includes a dedicated clarification block explaining that:
    - CasaNest does *not* replace Google Drive.
    - Your actual files stay in Google Drive.
    - CasaNest only stores encrypted access tokens and file metadata.

### 2. Who It Is For (Target Users)
- **Problem:** Unclear audience segmentation.
- **Redesign Solution:**
  - The copywriting outlines simple cloud storage dashboard functions for creators, students, small teams, and users who want to manage multiple connected Drive accounts (up to 4) easily without dealing with developer configuration dashboards.

### 3. What Problem It Solves (The Setup Headache & Privacy Concerns)
- **Problem:** Many SaaS storage layers require users to create their own Google API credentials (Client ID, Client Secret) or request broad access permissions.
- **Redesign Solution:**
  - The **Problem Section** (*"Cloud file management should not feel risky"*) explicitly addresses these 4 pain points:
    1. *Manual setup is confusing* (no API credentials needed).
    2. *Broad Drive access is scary* (only accessing files created/opened by CasaNest).
    3. *Disconnected accounts create confusion* (where metadata goes when unlinked).
    4. *Multi-user access must be isolated* (owner account constraints).

### 4. Why Google Drive Connection is Safe (Permissions Scope)
- **Problem:** Fear of third-party apps scanning personal folders.
- **Redesign Solution:**
  - Explicitly documents that CasaNest uses the limited Google `drive.file` scope.
  - The **Security Section** (*"Built for trust and safer access"*) highlights that CasaNest *does not scan* existing personal folders and only manages documents created or uploaded via CasaNest.

### 5. Encrypted Tokens & User Isolation
- **Problem:** Trusting a database with OAuth credentials.
- **Redesign Solution:**
  - Discloses that access and refresh tokens are encrypted at-rest using AES-256 before database storage.
  - Explains the strict 1-to-1 account mapping (preventing the same Drive account from being connected to multiple CasaNest users) and user-tenant isolation checks.

### 6. The 3-Day Backup Buffer (Unlink Behavior)
- **Problem:** Fear of losing metadata mapping logs or accidentally deleting real files during disconnect.
- **Redesign Solution:**
  - The **3-Day Backup Section** (*"Disconnected Drive? You still have 3 days."*) lists a step-by-step unlinking overview:
    - Active files vanish from the dashboard but remain safe in the user's actual Google Drive.
    - CasaNest holds metadata mappings for 3 days inside Recovery & Backup.
    - Reconnecting the same Google account restores active indexing.
    - Mappings are permanently cleared after 3 days.
    - Explicitly assures: *"Real Google Drive files are never modified or deleted by this cleanup."*

### 7. Feature Breakdown & Side-by-Side Comparison
- **Problem:** Hard to distinguish CasaNest from typical, insecure, or poorly documented Drive integrations.
- **Redesign Solution:**
  - The **Comparison Section** maps a direct table comparison between a typical file connector (broad permissions, unclear unlinking behavior, multi-account messiness) and CasaNest's safe-by-default implementations.

---

## Technical Verification

- **Code Soundness:** The React application compiles cleanly under `vite` and passes all `tsc` type safety checks.
- **Assets:** Logo references utilize `/brand/logos.png` as required.
- **Routes:** Route `/` remains public and auth CTAs route cleanly to `/register` and `/login`.
