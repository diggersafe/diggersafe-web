import { int, json, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ---- Subscription Table ----

export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  /** Subscription status: trial, active, expired, cancelled */
  status: mysqlEnum("status", ["trial", "active", "expired", "cancelled"]).default("trial").notNull(),
  /** Platform where subscription was purchased */
  platform: mysqlEnum("platform", ["ios", "android", "web"]).default("web").notNull(),
  /** Store transaction/receipt ID for verification */
  storeTransactionId: varchar("storeTransactionId", { length: 255 }),
  /** When the current subscription period started */
  periodStart: timestamp("periodStart"),
  /** When the current subscription period ends */
  periodEnd: timestamp("periodEnd"),
  /** Trial end date */
  trialEndsAt: timestamp("trialEndsAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

// ---- Cloud Machines Table ----

export const cloudMachines = mysqlTable("cloudMachines", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  /** Local device ID for sync reconciliation */
  localId: varchar("localId", { length: 64 }).notNull(),
  assetId: varchar("assetId", { length: 128 }).notNull(),
  makeModel: varchar("makeModel", { length: 255 }).notNull(),
  serialNumber: varchar("serialNumber", { length: 128 }).notNull(),
  hourMeter: int("hourMeter").default(0).notNull(),
  status: mysqlEnum("status", ["active", "retired", "grounded"]).default("active").notNull(),
  machineCreatedAt: varchar("machineCreatedAt", { length: 32 }).notNull(),
  syncedAt: timestamp("syncedAt").defaultNow().notNull(),
  deletedAt: timestamp("deletedAt"),
});

export type CloudMachine = typeof cloudMachines.$inferSelect;
export type InsertCloudMachine = typeof cloudMachines.$inferInsert;

// ---- Cloud Inspections Table ----

export const cloudInspections = mysqlTable("cloudInspections", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  /** Local device ID for sync reconciliation */
  localId: varchar("localId", { length: 64 }).notNull(),
  machineLocalId: varchar("machineLocalId", { length: 64 }).notNull(),
  assetId: varchar("assetId", { length: 128 }).notNull(),
  makeModel: varchar("makeModel", { length: 255 }).notNull(),
  date: varchar("date", { length: 32 }).notNull(),
  timestamp: varchar("timestamp", { length: 64 }).notNull(),
  operator: varchar("operator", { length: 255 }).notNull(),
  hourMeter: int("hourMeter").default(0).notNull(),
  /** Full checks array stored as JSON */
  checks: json("checks").notNull(),
  signatureBase64: text("signatureBase64").notNull(),
  cleared: int("cleared").default(0).notNull(),
  /** GPS location as JSON */
  location: json("location"),
  groundedReason: text("groundedReason"),
  syncedAt: timestamp("syncedAt").defaultNow().notNull(),
});

export type CloudInspection = typeof cloudInspections.$inferSelect;
export type InsertCloudInspection = typeof cloudInspections.$inferInsert;

// ---- Cloud Service Records Table ----

export const cloudServiceRecords = mysqlTable("cloudServiceRecords", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  /** Local device ID for sync reconciliation */
  localId: varchar("localId", { length: 64 }).notNull(),
  machineLocalId: varchar("machineLocalId", { length: 64 }).notNull(),
  assetId: varchar("assetId", { length: 128 }).notNull(),
  date: varchar("date", { length: 32 }).notNull(),
  serviceType: varchar("serviceType", { length: 64 }).notNull(),
  description: text("description").notNull(),
  hourMeter: int("hourMeter").default(0).notNull(),
  nextServiceHours: int("nextServiceHours"),
  technician: varchar("technician", { length: 255 }).notNull(),
  cost: int("cost"),
  notes: text("notes"),
  syncedAt: timestamp("syncedAt").defaultNow().notNull(),
  deletedAt: timestamp("deletedAt"),
});

export type CloudServiceRecord = typeof cloudServiceRecords.$inferSelect;
export type InsertCloudServiceRecord = typeof cloudServiceRecords.$inferInsert;
