# PROJECT PROPOSAL
**SYSTEM DEVELOPMENT & INVENTORY DIGITIZATION**

**Prepared For:** Management, Victorious Residence  
**Prepared By:** [Your Name / Agency Name]  
**Date:** October 26, 2026  
**Target Launch:** Last week of November 2026  

---

### 1. Executive Summary
Victorious Residence currently manages its room allocation and payment tracking via human-dependent processes. This proposal outlines the deployment of a custom, multi-tenant-ready web application designed to streamline resident acquisition, showcase room inventory publicly, and digitize the proof-of-payment review workflow.

By launching production ahead of the December intake, Victorious Residence will significantly reduce administrative overhead, eliminate accidental bed over-allocations, and establish a foundation ready for automated payment gateway integrations in a follow-on phase.

---

### 2. Core Project Scope

| Module | Features Included | Business Objective |
| :--- | :--- | :--- |
| **Public Showcase Portal** | • Public-facing landing page (unauthenticated).<br>• Media galleries highlighting hostel location & amenities.<br>• Real-time counters of available beds, grouped by admin-defined room types (e.g. 1-person, 2-in-1, 4-in-1). | Removes the logistical burden of organizing manual, in-person room tours for prospective applicants. |
| **Resident Ledger System** | • Secure resident registration & login.<br>• Room selection by flexible room type, price, and live availability.<br>• Proof-of-payment portal for uploading MoMo/Bank receipts and payment references. | Consolidates incoming applications and files into a single repository instead of scattered messaging channels. |
| **Management Control Panel** | • Secure manager/admin dashboard.<br>• Review queue for uploaded payment screenshots.<br>• Single-click Approve / Reject to lock or release bed inventory.<br>• Admin CMS to define room types and provision rooms & bed spaces as inventory changes.<br>• Audit logs of historical allocations and reviews. | Empowers staff to maintain a single source of truth for occupancy and revenue logs as the residence grows. |

### 3. Inventory model (flexible)

Room layouts are **not hardcoded**. Administrators define room types in the CMS (name, beds-per-room capacity, price per bed, description/media), then provision how many physical rooms of each type exist. The system generates bed spaces automatically. Public and resident views always reflect live `AVAILABLE` / `PENDING_PAYMENT` / `OCCUPIED` counts.

### 4. Out of Scope (Follow-on phase)
The following are excluded from the November launch but the database and app structure are designed so they can be added without a rewrite:
* Direct bank API connectivity or live commercial network integrations.
* Direct in-app automated Mobile Money (MTN MoMo/Telecel/AirtelTigo) payment processing.
* General ticketing and resident maintenance request modules.

### 5. Technical foundation
* **Next.js** application with role-based access (`RESIDENT`, `MANAGER`, `ADMIN`).
* **PostgreSQL** via **Drizzle ORM**, multi-tenant-ready (`Residence` → `RoomType` → `Room` → `BedSpace`, plus `Booking` ledger).
* Manual payment verification workflow with time-limited bed holds to prevent double-booking.
