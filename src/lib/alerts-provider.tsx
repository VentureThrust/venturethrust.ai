// contexts/AlertsProvider.tsx
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { supabase } from "../lib/supabaseClient"; // adjust path to your existing client

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Alert {
  id: string;
  user_id: string;
  created_at: string;
  read_at: string | null;
  [key: string]: unknown; // extend with your own columns as needed
}

interface AlertsContextValue {
  alerts: Alert[];
  unreadCount: number;
  markAsRead: (alertId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

// ── Context ───────────────────────────────────────────────────────────────────

const AlertsContext = createContext<AlertsContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

export function AlertsProvider({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    let subscription: ReturnType<typeof supabase.channel> | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;
    let userId: string | null = null;

    // Refetch the full list and merge - new rows appear, existing ones keep
    // their read_at. This is the polling fallback for when Supabase Realtime
    // isn't enabled on the `alerts` table (which would otherwise mean the
    // bell only updates on a hard refresh).
    async function refetch() {
      if (!userId) return;
      const { data, error } = await supabase
        .from("alerts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .returns<Alert[]>();
      if (!error && data && !cancelled) {
        setAlerts((prev) => {
          // Preserve any locally-applied read_at that the server hasn't
          // caught up on yet, but otherwise trust the server list.
          const readMap = new Map(prev.map((a) => [a.id, a.read_at]));
          return data.map((a) =>
            a.read_at == null && readMap.get(a.id) ? { ...a, read_at: readMap.get(a.id)! } : a,
          );
        });
      }
    }

    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      userId = user.id;

      await refetch();

      // Real-time: instant updates when Realtime IS enabled. Dedupe by id.
      subscription = supabase
        .channel("public:alerts")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "alerts",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const next = payload.new as Alert;
            setAlerts((prev) => (prev.some((a) => a.id === next.id) ? prev : [next, ...prev]));
          }
        )
        .subscribe();

      // Polling fallback - every 10s. Cheap (one indexed query) and means
      // notifications + new visitors show up within ~10s even if Realtime
      // is off, with no manual refresh.
      pollTimer = setInterval(refetch, 10_000);
    }

    init();

    // Also refetch when the tab regains focus (instant catch-up after the
    // owner switches back from another tab/window).
    const onFocus = () => { refetch(); };
    window.addEventListener('focus', onFocus);

    return () => {
      cancelled = true;
      if (subscription) supabase.removeChannel(subscription);
      if (pollTimer) clearInterval(pollTimer);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  // ── Derived state ──────────────────────────────────────────────────────────

  const unreadCount = alerts.filter((a) => !a.read_at).length;

  // ── Actions ────────────────────────────────────────────────────────────────

  const markAsRead = useCallback(async (alertId: string): Promise<void> => {
    const readAt = new Date().toISOString();

    const { error } = await supabase
      .from("alerts")
      .update({ read_at: readAt })
      .eq("id", alertId);

    if (!error) {
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, read_at: readAt } : a))
      );
    }
  }, []);

  const markAllAsRead = useCallback(async (): Promise<void> => {
    const readAt = new Date().toISOString();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("alerts")
      .update({ read_at: readAt })
      .eq("user_id", user.id)
      .is("read_at", null);

    if (!error) {
      setAlerts((prev) =>
        prev.map((a) => (a.read_at ? a : { ...a, read_at: readAt }))
      );
    }
  }, []);

  return (
    <AlertsContext.Provider value={{ alerts, unreadCount, markAsRead, markAllAsRead }}>
      {children}
    </AlertsContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAlerts(): AlertsContextValue {
  const ctx = useContext(AlertsContext);
  if (!ctx) {
    throw new Error("useAlerts must be used within an <AlertsProvider>");
  }
  return ctx;
}