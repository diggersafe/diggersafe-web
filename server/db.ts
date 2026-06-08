import { eq, and, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  subscriptions,
  cloudMachines,
  cloudInspections,
  cloudServiceRecords,
  type InsertSubscription,
  type InsertCloudMachine,
  type InsertCloudInspection,
  type InsertCloudServiceRecord,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ---- Subscription Helpers ----

export async function getSubscription(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function upsertSubscription(data: InsertSubscription): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const existing = await getSubscription(data.userId);
  if (existing) {
    await db
      .update(subscriptions)
      .set({
        status: data.status,
        platform: data.platform,
        storeTransactionId: data.storeTransactionId,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        trialEndsAt: data.trialEndsAt,
      })
      .where(eq(subscriptions.userId, data.userId));
  } else {
    await db.insert(subscriptions).values(data);
  }
}

// ---- Cloud Machine Helpers ----

export async function getCloudMachines(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(cloudMachines)
    .where(and(eq(cloudMachines.userId, userId), isNull(cloudMachines.deletedAt)));
}

export async function upsertCloudMachine(data: InsertCloudMachine): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const existing = await db
    .select()
    .from(cloudMachines)
    .where(and(eq(cloudMachines.userId, data.userId), eq(cloudMachines.localId, data.localId)))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(cloudMachines)
      .set({
        assetId: data.assetId,
        makeModel: data.makeModel,
        serialNumber: data.serialNumber,
        hourMeter: data.hourMeter,
        status: data.status,
        syncedAt: new Date(),
        deletedAt: data.deletedAt ?? null,
      })
      .where(and(eq(cloudMachines.userId, data.userId), eq(cloudMachines.localId, data.localId)));
  } else {
    await db.insert(cloudMachines).values(data);
  }
}

export async function softDeleteCloudMachine(userId: number, localId: string): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db
    .update(cloudMachines)
    .set({ deletedAt: new Date() })
    .where(and(eq(cloudMachines.userId, userId), eq(cloudMachines.localId, localId)));
}

// ---- Cloud Inspection Helpers ----

export async function getCloudInspections(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(cloudInspections)
    .where(eq(cloudInspections.userId, userId));
}

export async function upsertCloudInspection(data: InsertCloudInspection): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const existing = await db
    .select()
    .from(cloudInspections)
    .where(and(eq(cloudInspections.userId, data.userId), eq(cloudInspections.localId, data.localId)))
    .limit(1);

  if (existing.length > 0) {
    // Inspections are immutable after creation, skip update
    return;
  } else {
    await db.insert(cloudInspections).values(data);
  }
}

// ---- Cloud Service Record Helpers ----

export async function getCloudServiceRecords(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(cloudServiceRecords)
    .where(and(eq(cloudServiceRecords.userId, userId), isNull(cloudServiceRecords.deletedAt)));
}

export async function upsertCloudServiceRecord(data: InsertCloudServiceRecord): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const existing = await db
    .select()
    .from(cloudServiceRecords)
    .where(and(eq(cloudServiceRecords.userId, data.userId), eq(cloudServiceRecords.localId, data.localId)))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(cloudServiceRecords)
      .set({
        assetId: data.assetId,
        date: data.date,
        serviceType: data.serviceType,
        description: data.description,
        hourMeter: data.hourMeter,
        nextServiceHours: data.nextServiceHours ?? null,
        technician: data.technician,
        cost: data.cost ?? null,
        notes: data.notes ?? null,
        syncedAt: new Date(),
        deletedAt: data.deletedAt ?? null,
      })
      .where(and(eq(cloudServiceRecords.userId, data.userId), eq(cloudServiceRecords.localId, data.localId)));
  } else {
    await db.insert(cloudServiceRecords).values(data);
  }
}

export async function softDeleteCloudServiceRecord(userId: number, localId: string): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db
    .update(cloudServiceRecords)
    .set({ deletedAt: new Date() })
    .where(and(eq(cloudServiceRecords.userId, userId), eq(cloudServiceRecords.localId, localId)));
}
