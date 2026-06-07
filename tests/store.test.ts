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
  SAFETY_CATEGORIES,
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

  it("should save an inspection", async () => {
    const machine = await addMachine({
      assetId: "DIG-001",
      makeModel: "CAT 320F Excavator",
      serialNumber: "CAT0320F78921",
      hourMeter: 740,
      status: "active",
    });

    const inspection = await saveInspection({
      machineId: machine.id,
      assetId: "DIG-001",
      makeModel: "CAT 320F Excavator",
      date: "2026-06-08T10:00:00.000Z",
      inspector: "Darren Gray",
      hourMeter: 767,
      checks: SAFETY_CATEGORIES.map((cat) => ({
        category: cat,
        result: "pass" as const,
        notes: "",
      })),
      signatureBase64: "test-signature",
      cleared: true,
    });

    expect(inspection.id).toBeDefined();
    expect(inspection.cleared).toBe(true);
    expect(inspection.inspector).toBe("Darren Gray");
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

    await saveInspection({
      machineId: machine.id,
      assetId: "DIG-001",
      makeModel: "CAT 320F Excavator",
      date: "2026-06-08T10:00:00.000Z",
      inspector: "Darren Gray",
      hourMeter: 767,
      checks: SAFETY_CATEGORIES.map((cat) => ({
        category: cat,
        result: "pass" as const,
        notes: "",
      })),
      signatureBase64: "test-signature",
      cleared: true,
    });

    const machines = await getMachines();
    expect(machines[0].hourMeter).toBe(767);
  });

  it("should store inspections in reverse chronological order", async () => {
    const machine = await addMachine({
      assetId: "DIG-001",
      makeModel: "CAT 320F Excavator",
      serialNumber: "CAT0320F78921",
      hourMeter: 740,
      status: "active",
    });

    await saveInspection({
      machineId: machine.id,
      assetId: "DIG-001",
      makeModel: "CAT 320F Excavator",
      date: "2026-06-07T10:00:00.000Z",
      inspector: "Darren Gray",
      hourMeter: 740,
      checks: SAFETY_CATEGORIES.map((cat) => ({
        category: cat,
        result: "pass" as const,
        notes: "",
      })),
      signatureBase64: "sig1",
      cleared: true,
    });

    await saveInspection({
      machineId: machine.id,
      assetId: "DIG-001",
      makeModel: "CAT 320F Excavator",
      date: "2026-06-08T10:00:00.000Z",
      inspector: "Darren Gray",
      hourMeter: 767,
      checks: SAFETY_CATEGORIES.map((cat) => ({
        category: cat,
        result: "pass" as const,
        notes: "",
      })),
      signatureBase64: "sig2",
      cleared: true,
    });

    const inspections = await getInspections();
    expect(inspections).toHaveLength(2);
    expect(inspections[0].hourMeter).toBe(767);
    expect(inspections[1].hourMeter).toBe(740);
  });
});

describe("Store - Settings", () => {
  beforeEach(() => {
    clearData();
  });

  it("should return default settings", async () => {
    const settings = await getSettings();
    expect(settings.inspectorName).toBe("Darren Gray");
    expect(settings.companyName).toBe("DiggerSafe Fleet & Safety");
  });

  it("should save and retrieve custom settings", async () => {
    await saveSettings({
      inspectorName: "John Smith",
      companyName: "Smith Excavations",
    });

    const settings = await getSettings();
    expect(settings.inspectorName).toBe("John Smith");
    expect(settings.companyName).toBe("Smith Excavations");
  });
});

describe("Safety Categories", () => {
  it("should have 5 safety categories", () => {
    expect(SAFETY_CATEGORIES).toHaveLength(5);
  });

  it("should include all required categories", () => {
    expect(SAFETY_CATEGORIES).toContain("Structural Integrity");
    expect(SAFETY_CATEGORIES).toContain("Mechanical & Fluids");
    expect(SAFETY_CATEGORIES).toContain("Safety Features");
    expect(SAFETY_CATEGORIES).toContain("Protective Structures (ROPS/FOPS)");
    expect(SAFETY_CATEGORIES).toContain("Attachments");
  });
});
