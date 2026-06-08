import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ---- Subscription Routes ----
  subscription: router({
    getStatus: protectedProcedure.query(async ({ ctx }) => {
      const sub = await db.getSubscription(ctx.user.id);
      if (!sub) {
        // New users get a 14-day trial automatically
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + 14);
        await db.upsertSubscription({
          userId: ctx.user.id,
          status: "trial",
          platform: "web",
          trialEndsAt: trialEnd,
        });
        return {
          status: "trial" as const,
          trialEndsAt: trialEnd.toISOString(),
          periodEnd: null,
          isActive: true,
        };
      }

      // Check if trial/subscription has expired
      const now = new Date();
      let isActive = false;

      if (sub.status === "trial") {
        isActive = sub.trialEndsAt ? now < sub.trialEndsAt : false;
        if (!isActive && sub.status === "trial") {
          await db.upsertSubscription({
            userId: ctx.user.id,
            status: "expired",
            platform: sub.platform,
            trialEndsAt: sub.trialEndsAt,
          });
          return {
            status: "expired" as const,
            trialEndsAt: sub.trialEndsAt?.toISOString() ?? null,
            periodEnd: null,
            isActive: false,
          };
        }
      } else if (sub.status === "active") {
        isActive = sub.periodEnd ? now < sub.periodEnd : true;
        if (!isActive) {
          await db.upsertSubscription({
            userId: ctx.user.id,
            status: "expired",
            platform: sub.platform,
            periodStart: sub.periodStart,
            periodEnd: sub.periodEnd,
          });
          return {
            status: "expired" as const,
            trialEndsAt: sub.trialEndsAt?.toISOString() ?? null,
            periodEnd: sub.periodEnd?.toISOString() ?? null,
            isActive: false,
          };
        }
      } else if (sub.status === "cancelled" || sub.status === "expired") {
        isActive = false;
      }

      return {
        status: sub.status,
        trialEndsAt: sub.trialEndsAt?.toISOString() ?? null,
        periodEnd: sub.periodEnd?.toISOString() ?? null,
        isActive,
      };
    }),

    /** Called after a successful IAP purchase to activate the subscription */
    activate: protectedProcedure
      .input(
        z.object({
          platform: z.enum(["ios", "android", "web"]),
          transactionId: z.string().optional(),
          periodMonths: z.number().default(1),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const periodStart = new Date();
        const periodEnd = new Date();
        periodEnd.setMonth(periodEnd.getMonth() + input.periodMonths);

        await db.upsertSubscription({
          userId: ctx.user.id,
          status: "active",
          platform: input.platform,
          storeTransactionId: input.transactionId ?? null,
          periodStart,
          periodEnd,
        });

        return { success: true, periodEnd: periodEnd.toISOString() };
      }),
  }),

  // ---- Cloud Backup Routes ----
  backup: router({
    /** Push local data to cloud */
    push: protectedProcedure
      .input(
        z.object({
          machines: z.array(
            z.object({
              localId: z.string(),
              assetId: z.string(),
              makeModel: z.string(),
              serialNumber: z.string(),
              hourMeter: z.number(),
              status: z.enum(["active", "retired", "grounded"]),
              machineCreatedAt: z.string(),
              deleted: z.boolean().optional(),
            })
          ),
          inspections: z.array(
            z.object({
              localId: z.string(),
              machineLocalId: z.string(),
              assetId: z.string(),
              makeModel: z.string(),
              date: z.string(),
              timestamp: z.string(),
              operator: z.string(),
              hourMeter: z.number(),
              checks: z.any(),
              signatureBase64: z.string(),
              cleared: z.boolean(),
              location: z.any().optional(),
              groundedReason: z.string().optional(),
            })
          ),
          serviceRecords: z.array(
            z.object({
              localId: z.string(),
              machineLocalId: z.string(),
              assetId: z.string(),
              date: z.string(),
              serviceType: z.string(),
              description: z.string(),
              hourMeter: z.number(),
              nextServiceHours: z.number().optional(),
              technician: z.string(),
              cost: z.number().optional(),
              notes: z.string().optional(),
              deleted: z.boolean().optional(),
            })
          ),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user.id;

        // Upsert machines
        for (const m of input.machines) {
          if (m.deleted) {
            await db.softDeleteCloudMachine(userId, m.localId);
          } else {
            await db.upsertCloudMachine({
              userId,
              localId: m.localId,
              assetId: m.assetId,
              makeModel: m.makeModel,
              serialNumber: m.serialNumber,
              hourMeter: m.hourMeter,
              status: m.status,
              machineCreatedAt: m.machineCreatedAt,
            });
          }
        }

        // Upsert inspections
        for (const i of input.inspections) {
          await db.upsertCloudInspection({
            userId,
            localId: i.localId,
            machineLocalId: i.machineLocalId,
            assetId: i.assetId,
            makeModel: i.makeModel,
            date: i.date,
            timestamp: i.timestamp,
            operator: i.operator,
            hourMeter: i.hourMeter,
            checks: i.checks,
            signatureBase64: i.signatureBase64,
            cleared: i.cleared ? 1 : 0,
            location: i.location ?? null,
            groundedReason: i.groundedReason ?? null,
          });
        }

        // Upsert service records
        for (const s of input.serviceRecords) {
          if (s.deleted) {
            await db.softDeleteCloudServiceRecord(userId, s.localId);
          } else {
            await db.upsertCloudServiceRecord({
              userId,
              localId: s.localId,
              machineLocalId: s.machineLocalId,
              assetId: s.assetId,
              date: s.date,
              serviceType: s.serviceType,
              description: s.description,
              hourMeter: s.hourMeter,
              nextServiceHours: s.nextServiceHours ?? null,
              technician: s.technician,
              cost: s.cost ?? null,
              notes: s.notes ?? null,
            });
          }
        }

        return { success: true, syncedAt: new Date().toISOString() };
      }),

    /** Pull cloud data to restore on a new device */
    pull: protectedProcedure.query(async ({ ctx }) => {
      const userId = ctx.user.id;

      const machines = await db.getCloudMachines(userId);
      const inspections = await db.getCloudInspections(userId);
      const serviceRecords = await db.getCloudServiceRecords(userId);

      return {
        machines: machines.map((m) => ({
          localId: m.localId,
          assetId: m.assetId,
          makeModel: m.makeModel,
          serialNumber: m.serialNumber,
          hourMeter: m.hourMeter,
          status: m.status,
          machineCreatedAt: m.machineCreatedAt,
        })),
        inspections: inspections.map((i) => ({
          localId: i.localId,
          machineLocalId: i.machineLocalId,
          assetId: i.assetId,
          makeModel: i.makeModel,
          date: i.date,
          timestamp: i.timestamp,
          operator: i.operator,
          hourMeter: i.hourMeter,
          checks: i.checks,
          signatureBase64: i.signatureBase64,
          cleared: i.cleared === 1,
          location: i.location,
          groundedReason: i.groundedReason,
        })),
        serviceRecords: serviceRecords.map((s) => ({
          localId: s.localId,
          machineLocalId: s.machineLocalId,
          assetId: s.assetId,
          date: s.date,
          serviceType: s.serviceType,
          description: s.description,
          hourMeter: s.hourMeter,
          nextServiceHours: s.nextServiceHours,
          technician: s.technician,
          cost: s.cost,
          notes: s.notes,
        })),
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;
