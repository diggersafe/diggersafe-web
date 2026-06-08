import { describe, it, expect, beforeEach, vi } from "vitest";

// The mock storage - a single object whose keys are cleared between tests.
// IMPORTANT: Never reassign `data` itself (e.g., `data = {}`), because
// the vi.mock factory closure captures the reference. Only delete keys.
const data: Record<string, string> = {};

const clearData = () => {
  for (const key of Object.keys(data)) {
    delete data[key];
  }
};

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: async (key: string) => data[key] ?? null,
    setItem: async (key: string, value: string) => { data[key] = value; },
    removeItem: async (key: string) => { delete data[key]; },
  },
}));

import {
  getMachines,
  addMachine,
  updateMachine,
  deleteMachine,
  getInspections,
  saveInspection,
  getSettings,
  saveSettings,
  INSPECTION_PHASES,
  ALL_CHECK_ITEMS,
  type SafetyCheck,
} from "../lib/store";

describe("Store - Machines", () => {
  beforeEach(() => {
    clearData();
  });

  it("should return empty array when no machines exist", async () => {
    const machines = await getMachines();
    expect(machines).toEqual([]);
  });

  it("should add a new machine", async () => {
    const machine = await addMachine({
      assetId: "DIG-001",
      makeModel: "CAT 320F Excavator",
      serialNumber: "CAT0320F78921",
      hourMeter: 740,
      status: "active",
    });

    expect(machine.assetId).toBe("DIG-001");
    expect(machine.makeModel).toBe("CAT 320F Excavator");
    expect(machine.serialNumber).toBe("CAT0320F78921");
    expect(machine.hourMeter).toBe(740);
    expect(machine.status).toBe("active");
    expect(machine.id).toBeDefined();
    expect(machine.createdAt).toBeDefined();
  });

  it("should retrieve added machines", async () => {
    await addMachine({
      assetId: "DIG-001",
      makeModel: "CAT 320F Excavator",
      serialNumber: "CAT0320F78921",
      hourMeter: 740,
      status: "active",
    });

    await addMachine({
      assetId: "DIG-002",
      makeModel: "Komatsu PC200-8",
      serialNumber: "KMTPC20045612",
      hourMeter: 1250,
      status: "active",
    });

    const machines = await getMachines();
    expect(machines).toHaveLength(2);
    expect(machines[0].assetId).toBe("DIG-001");
    expect(machines[1].assetId).toBe("DIG-002");
  });

  it("should update a machine", async () => {
    const machine = await addMachine({
      assetId: "DIG-001",
      makeModel: "CAT 320F Excavator",
      serialNumber: "CAT0320F78921",
      hourMeter: 740,
      status: "active",
    });

    await updateMachine(machine.id, { hourMeter: 800, status: "retired" });

    const machines = await getMachines();
    expect(machines[0].hourMeter).toBe(800);
    expect(machines[0].status).toBe("retired");
  });

  it("should delete a machine", async () => {
    const machine = await addMachine({
      assetId: "DIG-001",
      makeModel: "CAT 320F Excavator",
      serialNumber: "CAT0320F78921",
      hourMeter: 740,
      status: "active",
    });

    await deleteMachine(machine.id);
    const machines = await getMachines();
    expect(machines).toHaveLength(0);
  });
});

describe("Store - Inspections", () => {
  beforeEach(() => {
    clearData();
  });

  it("should return empty array when no inspections exist", async () => {
    const inspections = await getInspections();
    expect(inspections).toEqual([]);
  });

  it("should save a cleared inspection", async () => {
    const machine = await addMachine({
      assetId: "DIG-001",
      makeModel: "CAT 320F Excavator",
      serialNumber: "CAT0320F78921",
      hourMeter: 740,
      status: "active",
    });

    const checks: SafetyCheck[] = ALL_CHECK_ITEMS.map((item) => ({
      category: item.label,
      phase: item.phase,
      result: "pass" as const,
      notes: "",
      isCritical: item.isCritical,
    }));

    const inspection = await saveInspection({
      machineId: machine.id,
      assetId: "DIG-001",
      makeModel: "CAT 320F Excavator",
      date: "2026-06-08",
      timestamp: "2026-06-08T08:00:00.000Z",
      operator: "Darren Gray",
      hourMeter: 767,
      checks,
      signatureBase64: "test-signature",
      cleared: true,
    });

    expect(inspection.id).toBeDefined();
    expect(inspection.cleared).toBe(true);
    expect(inspection.operator).toBe("Darren Gray");
    expect(inspection.hourMeter).toBe(767);
  });

  it("should update machine hour meter after inspection", async () => {
    const machine = await addMachine({
      assetId: "DIG-001",
      makeModel: "CAT 320F Excavator",
      serialNumber: "CAT0320F78921",
      hourMeter: 740,
      status: "active",
    });

    const checks: SafetyCheck[] = ALL_CHECK_ITEMS.map((item) => ({
      category: item.label,
      phase: item.phase,
      result: "pass" as const,
      notes: "",
      isCritical: item.isCritical,
    }));

    await saveInspection({
      machineId: machine.id,
      assetId: "DIG-001",
      makeModel: "CAT 320F Excavator",
      date: "2026-06-08",
      timestamp: "2026-06-08T08:00:00.000Z",
      operator: "Darren Gray",
      hourMeter: 767,
      checks,
      signatureBase64: "test-signature",
      cleared: true,
    });

    const machines = await getMachines();
    expect(machines[0].hourMeter).toBe(767);
  });

  it("should auto-ground machine on failed inspection", async () => {
    const machine = await addMachine({
      assetId: "DIG-004",
      makeModel: "CAT 320F Excavator",
      serialNumber: "CAT0320F99999",
      hourMeter: 400,
      status: "active",
    });

    const checks: SafetyCheck[] = ALL_CHECK_ITEMS.map((item) => ({
      category: item.label,
      phase: item.phase,
      result: item.id === "seat_seatbelt" ? ("fail" as const) : ("pass" as const),
      notes: item.id === "seat_seatbelt" ? "Seatbelt latch broken" : "",
      isCritical: item.isCritical,
    }));

    await saveInspection({
      machineId: machine.id,
      assetId: "DIG-004",
      makeModel: "CAT 320F Excavator",
      date: "2026-06-08",
      timestamp: "2026-06-08T09:00:00.000Z",
      operator: "Darren Gray",
      hourMeter: 410,
      checks,
      signatureBase64: "test-signature",
      cleared: false,
      groundedReason: "Seat & Seatbelt: Seatbelt latch broken",
    });

    const machines = await getMachines();
    const updated = machines.find((m) => m.id === machine.id);
    expect(updated?.status).toBe("grounded");
  });
});

describe("Store - Settings", () => {
  beforeEach(() => {
    clearData();
  });

  it("should return default settings", async () => {
    const settings = await getSettings();
    expect(settings.operatorName).toBe("");
    expect(settings.companyName).toBe("");
  });

  it("should save and retrieve custom settings", async () => {
    await saveSettings({
      operatorName: "John Smith",
      companyName: "Smith Excavations",
    });

    const settings = await getSettings();
    expect(settings.operatorName).toBe("John Smith");
    expect(settings.companyName).toBe("Smith Excavations");
  });
});

describe("Inspection Phases", () => {
  it("should have 3 phases", () => {
    expect(INSPECTION_PHASES).toHaveLength(3);
  });

  it("should have 15 total check items across all phases", () => {
    expect(ALL_CHECK_ITEMS).toHaveLength(15);
  });

  it("Phase 1 should have 6 items (Structural & Fluid Checks)", () => {
    expect(INSPECTION_PHASES[0].items).toHaveLength(6);
    expect(INSPECTION_PHASES[0].title).toContain("Structural & Fluid");
  });

  it("Phase 2 should have 5 items (Cabin & Systems Checks)", () => {
    expect(INSPECTION_PHASES[1].items).toHaveLength(5);
    expect(INSPECTION_PHASES[1].title).toContain("Cabin & Systems");
  });

  it("Phase 3 should have 4 items (Operational & Functionality Tests)", () => {
    expect(INSPECTION_PHASES[2].items).toHaveLength(4);
    expect(INSPECTION_PHASES[2].title).toContain("Operational & Functionality");
  });

  it("should mark critical items correctly", () => {
    const criticalItems = ALL_CHECK_ITEMS.filter((item) => item.isCritical);
    // Should have multiple critical items across phases
    expect(criticalItems.length).toBeGreaterThanOrEqual(8);
  });

  it("should include key WorkSafe items", () => {
    const labels = ALL_CHECK_ITEMS.map((item) => item.label);
    expect(labels).toContain("Logbook & Compliance Plates");
    expect(labels).toContain("Fluid Levels & Leaks");
    expect(labels).toContain("Structure Protection (ROPS/FOPS)");
    expect(labels).toContain("Seat & Seatbelt");
    expect(labels).toContain("Quick-Hitch Safety Pin");
  });
});
