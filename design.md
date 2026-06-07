# DiggerSafe Mobile App — Interface Design

## Overview

DiggerSafe is a fleet management and safety inspection app for heavy machinery (excavators, loaders, etc.). It enables operators and inspectors to manage their fleet, perform pre-hire safety checks, capture signatures, and maintain inspection history — all from a mobile device.

The app is designed for **mobile portrait orientation (9:16)** and **one-handed usage**, following Apple Human Interface Guidelines (HIG).

---

## Screen List

| # | Screen | Purpose |
|---|--------|---------|
| 1 | **Fleet (Home)** | List of all registered machines with status badges |
| 2 | **Machine Details** | Full machine info, inspection history, and action buttons |
| 3 | **Add/Edit Machine** | Form to register or edit a machine |
| 4 | **Pre-Hire Inspection** | Step-by-step safety checklist with Pass/Fail toggles |
| 5 | **Signature Capture** | Full-screen signature pad before submitting inspection |
| 6 | **Inspection Complete** | "Machine Cleared" success confirmation |
| 7 | **Inspection Report** | Read-only view of a completed inspection |
| 8 | **History (Tab)** | Chronological list of all inspections across the fleet |
| 9 | **Settings** | App preferences (inspector name, company info) |

---

## Primary Content and Functionality

### 1. Fleet (Home) — Tab 1

- **Header:** "Fleet" title with machine count ("5 machines registered")
- **Action:** "+ Add Machine" button (top right)
- **Content:** FlatList of machine cards showing:
  - Machine icon/avatar (gear icon on yellow circle)
  - Asset ID (e.g., "DIG-001")
  - Make/Model (e.g., "CAT 320F Excavator")
  - Status badge: Active (green), In Use (orange), Retired (gray)
  - Last inspection date
- **Interaction:** Tap card → Machine Details

### 2. Machine Details

- **Header:** Asset ID as title
- **Tabs/Segments:** Info | Schedule | Maintenance (3 segments)
- **Info Tab:**
  - Machine avatar with status badge
  - Make/Model
  - Serial Number
  - Current Hour Meter reading
  - Last inspection summary
- **Actions:**
  - "Start Pre-Hire Check" (large yellow CTA button)
  - "QR Tag" button (generates/shows QR code)
  - "Edit" button
  - "Delete" button (red, with confirmation)

### 3. Add/Edit Machine

- **Form fields:**
  - Asset ID (text input, required)
  - Make/Model (text input, required)
  - Serial Number (text input, required)
  - Hour Meter (numeric input)
  - Status (picker: Active / Retired)
- **Actions:** Save / Cancel

### 4. Pre-Hire Inspection

- **Header:** Machine name + Asset ID
- **Hour Meter Input:** Numeric field to record current hours
- **Safety Check Categories (each with Pass/Fail toggle):**
  1. Structural Integrity
  2. Mechanical & Fluids
  3. Safety Features
  4. Protective Structures (ROPS/FOPS)
  5. Attachments
- **Notes field:** Optional text for each category
- **Photo capture:** Button to attach photo evidence per category
- **Footer:** "Next: Signature" button (disabled until all checks completed)

### 5. Signature Capture

- **Full-width signature canvas** (white background, dark stroke)
- **Clear button** to reset
- **"Submit Inspection" button** below signature

### 6. Inspection Complete

- **Large green checkmark** in a rounded card
- **"MACHINE CLEARED"** bold heading
- **"READY FOR HIRE"** subtitle in green
- **Actions:**
  - "Share / Email Report" button
  - "Back to Fleet" button
  - "View Report" button

### 7. Inspection Report (Read-only)

- **DiggerSafe header/branding**
- **Summary:** Date, Inspector, Asset ID, Make/Model, Hour Meter
- **Safety Checks:** List with Pass/Fail badges (green/red)
- **Signature image** at bottom
- **Share button** in header

### 8. History — Tab 2

- **FlatList of past inspections** sorted by date (newest first)
- Each row shows: Date, Asset ID, Machine name, Result (Cleared/Failed), Inspector
- Tap → Inspection Report

### 9. Settings

- **Inspector Name** (text input, persisted)
- **Company Name** (text input, persisted)
- **App version info**

---

## Key User Flows

### Flow 1: Perform a Pre-Hire Inspection
1. User opens app → Fleet screen
2. Taps a machine card → Machine Details
3. Taps "Start Pre-Hire Check" → Inspection Form
4. Enters hour meter reading
5. Marks each safety category as Pass or Fail
6. Taps "Next: Signature" → Signature screen
7. Signs on canvas → Taps "Submit Inspection"
8. Sees "Machine Cleared" success screen
9. Can share report or return to fleet

### Flow 2: Add a New Machine
1. User taps "+ Add Machine" on Fleet screen
2. Fills in Asset ID, Make/Model, Serial Number
3. Taps "Save" → Returns to Fleet with new machine listed

### Flow 3: View Inspection History
1. User taps "History" tab
2. Scrolls through past inspections
3. Taps an entry → Full inspection report view

---

## Color Choices

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| **primary** | `#F5C518` (Yellow) | `#F5C518` | CTA buttons, active states, brand accent |
| **background** | `#FFFFFF` | `#1A1A1A` | Screen backgrounds |
| **surface** | `#F5F5F0` | `#2A2A2A` | Cards, elevated surfaces |
| **foreground** | `#1A1A1A` | `#F5F5F0` | Primary text |
| **muted** | `#6B7280` | `#9CA3AF` | Secondary text, labels |
| **border** | `#E5E7EB` | `#374151` | Dividers, card borders |
| **success** | `#22C55E` | `#4ADE80` | Pass badges, cleared status |
| **warning** | `#F59E0B` | `#FBBF24` | In-use status, alerts |
| **error** | `#EF4444` | `#F87171` | Fail badges, delete actions |

The dark theme is the primary experience (matching the base44 screenshots), with a light theme available.

---

## Typography

- **Headings:** Bold, 24-32pt
- **Body:** Regular, 16pt
- **Labels/Captions:** Medium, 12-14pt, muted color
- **Monospace:** Hour meter readings (for clarity)

---

## Navigation Structure

- **Tab Bar (3 tabs):**
  1. Fleet (house icon)
  2. Inspections/History (clipboard icon)
  3. Settings (gear icon)

- **Stack navigation** within each tab for detail screens
