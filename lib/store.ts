import AsyncStorage from "@react-native-async-storage/async-storage";

// ---- Types ----

export type MachineStatus = "active" | "retired" | "grounded";

export interface Machine {
  id: string;
  assetId: string;
  makeModel: string;
  serialNumber: string;
  hourMeter: number;
  status: MachineStatus;
  createdAt: string;
}

export type CheckResult = "pass" | "fail" | "pending";

export interface SafetyCheck {
  category: string;
  phase: number;
  result: CheckResult;
  notes: string;
  photoUri?: string; // Required when result is "fail"
  isCritical?: boolean;
}

export interface InspectionLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface Inspection {
  id: string;
  machineId: string;
  assetId: string;
  makeModel: string;
  date: string;
  timestamp: string; // ISO string with exact time
  inspector: string;
  hourMeter: number;
  checks: SafetyCheck[];
  signatureBase64: string;
  cleared: boolean;
  location?: InspectionLocation;
  groundedReason?: string; // Set when machine is grounded due to critical fail
}

export interface AppSettings {
  inspectorName: string;
  companyName: string;
}

// ---- Storage Keys ----

const MACHINES_KEY = "diggersafe_machines";
const INSPECTIONS_KEY = "diggersafe_inspections";
const SETTINGS_KEY = "diggersafe_settings";

// ---- Default Data ----

const DEFAULT_MACHINES: Machine[] = [];

const DEFAULT_SETTINGS: AppSettings = {
  inspectorName: "Darren Gray",
  companyName: "DiggerSafe Fleet & Safety",
};

// ---- WorkSafe Pre-Hire Check Phases ----

export interface CheckItem {
  id: string;
  label: string;
  description: string;
  phase: number;
  isCritical: boolean;
}

export interface InspectionPhase {
  id: number;
  title: string;
  subtitle: string;
  items: CheckItem[];
}

export const INSPECTION_PHASES: InspectionPhase[] = [
  {
    id: 1,
    title: "Phase 1: Structural & Fluid Checks",
    subtitle: "Engine OFF — Walk-around inspection",
    items: [
      {
        id: "logbook",
        label: "Logbook & Compliance Plates",
        description: "Confirm serial number matches, safety decals are legible, and previous day's defects were repaired.",
        phase: 1,
        isCritical: false,
      },
      {
        id: "fluids",
        label: "Fluid Levels & Leaks",
        description: "Check engine oil, hydraulic oil, and coolant levels. Inspect ground underneath for active puddles or drips.",
        phase: 1,
        isCritical: true,
      },
      {
        id: "undercarriage",
        label: "Undercarriage / Tracks",
        description: "Inspect track tension, rollers, idlers, sprockets, and final drives for excessive wear, damage, or packed mud/debris.",
        phase: 1,
        isCritical: false,
      },
      {
        id: "boom_arm_bucket",
        label: "Boom, Arm & Bucket",
        description: "Check for cracked welds, structural stress lines, and ensure all pins and retainers are locked tight.",
        phase: 1,
        isCritical: true,
      },
      {
        id: "hydraulics_visual",
        label: "Hydraulics",
        description: "Visually inspect all hoses, cylinders, and couplings for fraying, rubbing, or weeping oil.",
        phase: 1,
        isCritical: true,
      },
      {
        id: "battery",
        label: "Battery & Isolator",
        description: "Verify battery terminals are clean and tight, and that the physical battery isolator switch functions.",
        phase: 1,
        isCritical: false,
      },
    ],
  },
  {
    id: 2,
    title: "Phase 2: Cabin & Systems Checks",
    subtitle: "Engine ON — Internal electronics & safety",
    items: [
      {
        id: "rops_fops",
        label: "Structure Protection (ROPS/FOPS)",
        description: "Ensure Roll-Over and Falling-Object protective bars are structurally sound with no unapproved modifications or welds.",
        phase: 2,
        isCritical: true,
      },
      {
        id: "seat_seatbelt",
        label: "Seat & Seatbelt",
        description: "Seatbelt must be present, free of frays, and the latch mechanism must lock firmly.",
        phase: 2,
        isCritical: true,
      },
      {
        id: "visibility",
        label: "Visibility",
        description: "Check all cabin windows are clean, mirrors are intact and adjusted, and camera feeds (if equipped) display clearly.",
        phase: 2,
        isCritical: false,
      },
      {
        id: "gauges_warnings",
        label: "Gauges & Warning Lights",
        description: "Ensure dashboard gauges read correctly (fuel/temperature) and no critical fault warning lights remain on.",
        phase: 2,
        isCritical: true,
      },
      {
        id: "safety_equipment",
        label: "Safety Equipment",
        description: "Confirm an in-date, fully charged Fire Extinguisher is mounted in the cab and a First Aid Kit is present.",
        phase: 2,
        isCritical: true,
      },
    ],
  },
  {
    id: 3,
    title: "Phase 3: Operational & Functionality Tests",
    subtitle: "Moving — Low-speed control tests",
    items: [
      {
        id: "warning_devices",
        label: "Warning Devices",
        description: "Test the horn, travel alarms, reversing beepers, and the roof-mounted flashing amber beacon light.",
        phase: 3,
        isCritical: true,
      },
      {
        id: "travel_steering",
        label: "Travel & Steering",
        description: "Test forward and reverse tracking, track brakes, and ensure steering controls respond accurately without pulling.",
        phase: 3,
        isCritical: true,
      },
      {
        id: "hydraulic_controls",
        label: "Hydraulic Controls",
        description: "Raise, lower, and cycle the boom, dipper, bucket, and slew ring to check for stuttering, sticking, or pressure drop.",
        phase: 3,
        isCritical: true,
      },
      {
        id: "quick_hitch",
        label: "Quick-Hitch Safety Pin",
        description: "If using an attachment, physically check that the quick-hitch safety pin or automatic hydraulic locking hook is completely engaged.",
        phase: 3,
        isCritical: true,
      },
    ],
  },
];

// Flat list of all check items for convenience
export const ALL_CHECK_ITEMS: CheckItem[] = INSPECTION_PHASES.flatMap((p) => p.items);

// Legacy compatibility
export const SAFETY_CATEGORIES = ALL_CHECK_ITEMS.map((item) => item.label);

// ---- Storage Functions ----

export async function getMachines(): Promise<Machine[]> {
  try {
    const data = await AsyncStorage.getItem(MACHINES_KEY);
    if (data) return JSON.parse(data);
    // Initialize with default data (return a copy to prevent mutation)
    await AsyncStorage.setItem(MACHINES_KEY, JSON.stringify(DEFAULT_MACHINES));
    return [...DEFAULT_MACHINES];
  } catch {
    return [...DEFAULT_MACHINES];
  }
}

export async function saveMachines(machines: Machine[]): Promise<void> {
  await AsyncStorage.setItem(MACHINES_KEY, JSON.stringify(machines));
}

export async function addMachine(machine: Omit<Machine, "id" | "createdAt">): Promise<Machine> {
  const machines = await getMachines();
  const newMachine: Machine = {
    ...machine,
    id: Date.now().toString(),
    createdAt: new Date().toISOString().split("T")[0],
  };
  machines.push(newMachine);
  await saveMachines(machines);
  return newMachine;
}

export async function updateMachine(id: string, updates: Partial<Machine>): Promise<void> {
  const machines = await getMachines();
  const index = machines.findIndex((m) => m.id === id);
  if (index !== -1) {
    machines[index] = { ...machines[index], ...updates };
    await saveMachines(machines);
  }
}

export async function deleteMachine(id: string): Promise<void> {
  const machines = await getMachines();
  const filtered = machines.filter((m) => m.id !== id);
  await saveMachines(filtered);
}

export async function getInspections(): Promise<Inspection[]> {
  try {
    const data = await AsyncStorage.getItem(INSPECTIONS_KEY);
    if (data) return JSON.parse(data);
    return [];
  } catch {
    return [];
  }
}

export async function saveInspection(inspection: Omit<Inspection, "id">): Promise<Inspection> {
  const inspections = await getInspections();
  const newInspection: Inspection = {
    ...inspection,
    id: Date.now().toString(),
  };
  inspections.unshift(newInspection);
  await AsyncStorage.setItem(INSPECTIONS_KEY, JSON.stringify(inspections));

  // Update machine hour meter and status
  const machines = await getMachines();
  const machineIndex = machines.findIndex((m) => m.id === inspection.machineId);
  if (machineIndex !== -1) {
    machines[machineIndex].hourMeter = inspection.hourMeter;
    // If inspection has critical fails, auto-ground the machine
    if (!inspection.cleared) {
      machines[machineIndex].status = "grounded";
    }
    await saveMachines(machines);
  }
  return newInspection;
}

export async function getSettings(): Promise<AppSettings> {
  try {
    const data = await AsyncStorage.getItem(SETTINGS_KEY);
    if (data) return JSON.parse(data);
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
    return { ...DEFAULT_SETTINGS };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
