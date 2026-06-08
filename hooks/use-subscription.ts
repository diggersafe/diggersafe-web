import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "@/server/routers";
import { getApiBaseUrl } from "@/constants/oauth";
import * as Auth from "@/lib/_core/auth";
import { useAuth } from "./use-auth";

export type SubscriptionStatus = "trial" | "active" | "expired" | "cancelled" | "unknown";

export interface SubscriptionState {
  status: SubscriptionStatus;
  isActive: boolean;
  trialEndsAt: string | null;
  periodEnd: string | null;
  loading: boolean;
  /** Days remaining in trial or subscription */
  daysRemaining: number | null;
}

const SUBSCRIPTION_CACHE_KEY = "diggersafe_subscription_cache";

const DEFAULT_STATE: SubscriptionState = {
  status: "unknown",
  isActive: true, // Default to active so app works offline without auth
  trialEndsAt: null,
  periodEnd: null,
  loading: true,
  daysRemaining: null,
};

function computeDaysRemaining(endDate: string | null): number | null {
  if (!endDate) return null;
  const end = new Date(endDate);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function useSubscription(): SubscriptionState & { refresh: () => Promise<void> } {
  const [state, setState] = useState<SubscriptionState>(DEFAULT_STATE);
  const { isAuthenticated, loading: authLoading } = useAuth();

  const loadCachedState = useCallback(async () => {
    try {
      const cached = await AsyncStorage.getItem(SUBSCRIPTION_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        setState({
          ...parsed,
          loading: false,
          daysRemaining: computeDaysRemaining(parsed.trialEndsAt || parsed.periodEnd),
        });
      } else {
        // No cache and not authenticated = assume active (local-only mode)
        setState({ ...DEFAULT_STATE, loading: false });
      }
    } catch {
      setState({ ...DEFAULT_STATE, loading: false });
    }
  }, []);

  const fetchFromServer = useCallback(async () => {
    try {
      const client = createTRPCProxyClient<AppRouter>({
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
      const result = await client.subscription.getStatus.query();
      const newState: SubscriptionState = {
        status: result.status as SubscriptionStatus,
        isActive: result.isActive,
        trialEndsAt: result.trialEndsAt,
        periodEnd: result.periodEnd,
        loading: false,
        daysRemaining: computeDaysRemaining(result.trialEndsAt || result.periodEnd),
      };
      setState(newState);
      // Cache for offline use
      await AsyncStorage.setItem(SUBSCRIPTION_CACHE_KEY, JSON.stringify(newState));
    } catch (error) {
      // If server is unreachable, use cached state
      await loadCachedState();
    }
  }, [loadCachedState]);

  const refresh = useCallback(async () => {
    if (isAuthenticated) {
      await fetchFromServer();
    } else {
      await loadCachedState();
    }
  }, [isAuthenticated, fetchFromServer, loadCachedState]);

  useEffect(() => {
    if (authLoading) return;

    if (isAuthenticated) {
      fetchFromServer();
    } else {
      // Not authenticated — app works in local-only mode (active by default)
      loadCachedState();
    }
  }, [isAuthenticated, authLoading, fetchFromServer, loadCachedState]);

  return { ...state, refresh };
}

/**
 * Check if subscription allows write operations (creating inspections, adding machines, etc.)
 * Returns true if user can perform write operations.
 * Local-only users (not authenticated) always have write access.
 */
export function canPerformWriteOps(state: SubscriptionState): boolean {
  // If still loading or unknown, allow writes (graceful degradation)
  if (state.loading || state.status === "unknown") return true;
  return state.isActive;
}
