import { useCallback, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "@/server/routers";
import { getApiBaseUrl } from "@/constants/oauth";
import * as Auth from "@/lib/_core/auth";
import { useAuth } from "./use-auth";
import {
  getMachines,
  getInspections,
  getServiceRecords,
  saveMachines,
  type Machine,
  type Inspection,
  type ServiceRecord,
} from "@/lib/store";

const LAST_SYNC_KEY = "diggersafe_last_sync";

function createClient() {
  return createTRPCProxyClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `${getApiBaseUrl()}/api/trpc`,
        transformer: superjson,
        async headers() {
          const token = await Auth.getSessionToken();
          return token ? { Authorization: `Bearer ${token}` } : {};
        },
        fetch(url, options) {
          return fetch(url, { ...options, credentials: "include" });
        },
      }),
    ],
  });
}

export interface CloudSyncState {
  syncing: boolean;
  lastSyncAt: string | null;
  error: string | null;
}

export function useCloudSync() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [state, setState] = useState<CloudSyncState>({
    syncing: false,
    lastSyncAt: null,
    error: null,
  });
  const syncInProgress = useRef(false);

  // Load last sync timestamp from cache
  useEffect(() => {
    AsyncStorage.getItem(LAST_SYNC_KEY).then((val) => {
      if (val) setState((s) => ({ ...s, lastSyncAt: val }));
    });
  }, []);

  const pushToCloud = useCallback(async () => {
    if (syncInProgress.current) return;
    if (!isAuthenticated) return;

    syncInProgress.current = true;
    setState((s) => ({ ...s, syncing: true, error: null }));

    try {
      const client = createClient();

      const [machines, inspections, serviceRecords] = await Promise.all([
        getMachines(),
        getInspections(),
        getServiceRecords(),
      ]);

      await client.backup.push.mutate({
        machines: machines.map((m) => ({
          localId: m.id,
          assetId: m.assetId,
          makeModel: m.makeModel,
          serialNumber: m.serialNumber,
          hourMeter: m.hourMeter,
          status: m.status,
          machineCreatedAt: m.createdAt,
        })),
        inspections: inspections.map((i) => ({
          localId: i.id,
          machineLocalId: i.machineId,
          assetId: i.assetId,
          makeModel: i.makeModel,
          date: i.date,
          timestamp: i.timestamp,
          operator: i.operator,
          hourMeter: i.hourMeter,
          checks: i.checks,
          signatureBase64: i.signatureBase64,
          cleared: i.cleared,
          location: i.location,
          groundedReason: i.groundedReason,
        })),
        serviceRecords: serviceRecords.map((s) => ({
          localId: s.id,
          machineLocalId: s.machineId,
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
      });

      const now = new Date().toISOString();
      await AsyncStorage.setItem(LAST_SYNC_KEY, now);
      setState({ syncing: false, lastSyncAt: now, error: null });
    } catch (error: any) {
      console.warn("[CloudSync] Push failed:", error?.message);
      setState((s) => ({ ...s, syncing: false, error: error?.message || "Sync failed" }));
    } finally {
      syncInProgress.current = false;
    }
  }, [isAuthenticated]);

  const pullFromCloud = useCallback(async (): Promise<boolean> => {
    if (!isAuthenticated) return false;

    setState((s) => ({ ...s, syncing: true, error: null }));

    try {
      const client = createClient();
      const data = await client.backup.pull.query();

      // Merge cloud data with local data (cloud wins for conflicts based on localId)
      const localMachines = await getMachines();
      const localMachineIds = new Set(localMachines.map((m) => m.id));

      // Add machines from cloud that don't exist locally
      const newMachines: Machine[] = [];
      for (const cm of data.machines) {
        if (!localMachineIds.has(cm.localId)) {
          newMachines.push({
            id: cm.localId,
            assetId: cm.assetId,
            makeModel: cm.makeModel,
            serialNumber: cm.serialNumber,
            hourMeter: cm.hourMeter,
            status: cm.status as Machine["status"],
            createdAt: cm.machineCreatedAt,
          });
        }
      }

      if (newMachines.length > 0) {
        await saveMachines([...localMachines, ...newMachines]);
      }

      // Add inspections from cloud that don't exist locally
      const localInspections = await getInspections();
      const localInspectionIds = new Set(localInspections.map((i) => i.id));

      const newInspections: Inspection[] = [];
      for (const ci of data.inspections) {
        if (!localInspectionIds.has(ci.localId)) {
          newInspections.push({
            id: ci.localId,
            machineId: ci.machineLocalId,
            assetId: ci.assetId,
            makeModel: ci.makeModel,
            date: ci.date,
            timestamp: ci.timestamp,
            operator: ci.operator,
            hourMeter: ci.hourMeter,
            checks: ci.checks as any,
            signatureBase64: ci.signatureBase64,
            cleared: ci.cleared,
            location: ci.location as any,
            groundedReason: ci.groundedReason ?? undefined,
          });
        }
      }

      if (newInspections.length > 0) {
        const allInspections = [...newInspections, ...localInspections];
        await AsyncStorage.setItem("diggersafe_inspections", JSON.stringify(allInspections));
      }

      // Add service records from cloud that don't exist locally
      const localServices = await getServiceRecords();
      const localServiceIds = new Set(localServices.map((s) => s.id));

      const newServices: ServiceRecord[] = [];
      for (const cs of data.serviceRecords) {
        if (!localServiceIds.has(cs.localId)) {
          newServices.push({
            id: cs.localId,
            machineId: cs.machineLocalId,
            assetId: cs.assetId,
            date: cs.date,
            serviceType: cs.serviceType as ServiceRecord["serviceType"],
            description: cs.description,
            hourMeter: cs.hourMeter,
            nextServiceHours: cs.nextServiceHours ?? undefined,
            technician: cs.technician,
            cost: cs.cost ?? undefined,
            notes: cs.notes ?? undefined,
          });
        }
      }

      if (newServices.length > 0) {
        const allServices = [...newServices, ...localServices];
        await AsyncStorage.setItem("diggersafe_services", JSON.stringify(allServices));
      }

      const now = new Date().toISOString();
      await AsyncStorage.setItem(LAST_SYNC_KEY, now);
      setState({ syncing: false, lastSyncAt: now, error: null });
      return true;
    } catch (error: any) {
      console.warn("[CloudSync] Pull failed:", error?.message);
      setState((s) => ({ ...s, syncing: false, error: error?.message || "Restore failed" }));
      return false;
    }
  }, [isAuthenticated]);

  // Auto-sync on mount when authenticated
  useEffect(() => {
    if (authLoading) return;
    if (isAuthenticated) {
      // Push local data to cloud on app start
      pushToCloud();
    }
  }, [isAuthenticated, authLoading, pushToCloud]);

  return {
    ...state,
    pushToCloud,
    pullFromCloud,
    isAuthenticated,
  };
}
