import { useEffect, useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import schoolApi from "@/lib/api/school-client";

type NoticeItem = {
  id?: string;
  title?: string;
  content?: string;
  body?: string;
  category?: string;
  createdAt?: string;
  postedDate?: string;
  expiryDate?: string;
};

function isActiveNotice(notice: NoticeItem) {
  if (!notice?.expiryDate) return true;
  const expiry = new Date(notice.expiryDate).getTime();
  if (Number.isNaN(expiry)) return true;
  return expiry >= Date.now();
}

export default function MaintenanceBroadcastBanner() {
  const [notices, setNotices] = useState<NoticeItem[]>([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await schoolApi.get("/notices");
        const items = res.data?.data ?? res.data ?? [];
        if (mounted) setNotices(Array.isArray(items) ? items : []);
      } catch {
        if (mounted) setNotices([]);
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const maintenanceNotice = useMemo(() => {
    return [...notices]
      .filter((notice) => String(notice?.category || "").toUpperCase() === "MAINTENANCE")
      .filter(isActiveNotice)
      .sort((a, b) => {
        const aTime = new Date(a.createdAt || a.postedDate || 0).getTime();
        const bTime = new Date(b.createdAt || b.postedDate || 0).getTime();
        return bTime - aTime;
      })[0];
  }, [notices]);

  if (!maintenanceNotice) return null;

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
          <AlertTriangle className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold tracking-tight">
            {maintenanceNotice.title || "Maintenance Notice"}
          </p>
          <p className="mt-0.5 text-sm font-medium leading-6 text-amber-800">
            {maintenanceNotice.content || maintenanceNotice.body || "We are currently under maintenance."}
          </p>
        </div>
      </div>
    </div>
  );
}
