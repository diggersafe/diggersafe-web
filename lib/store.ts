import AsyncStorage from "@react-native-async-storage/async-storage";

// ---- Types ----

export type MachineStatus = "active" | "retired";

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
  result: CheckResult;
  notes: string;
}

export interface Inspection {
  id: string;
  machineId: string;
  assetId: string;
  makeModel: string;
  date: string;
  inspector: string;
  hourMeter: number;
  checks: SafetyCheck[];
  signatureBase64: string;
  cleared: boolean;
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

// ---- Safety Check Categories ----

export const SAFETY_CATEGORIES = [
  "Structural Integrity",
  "Mechanical & Fluids",
  "Safety Features",
  "Protective Structures (ROPS/FOPS)",
  "Attachments",
];

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
  // Update machine hour meter
  const machines = await getMachines();
  const machineIndex = machines.findIndex((m) => m.id === inspection.machineId);
  if (machineIndex !== -1) {
    machines[machineIndex].hourMeter = inspection.hourMeter;
    await saveMachines(machines);
  }
  return newInspection;
}

export async function getSettings(): Promise<AppSettings> {
  try {
    const data = await AsyncStorage.getItem(SETTINGS_KEY);
    if (data) return JSON.parse(data);
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
    return DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
