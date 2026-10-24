import React from "react";
import { Siren } from "lucide-react";
import { useSchoolNotification } from "@/context/SchoolNotificationContext";

/**
 * Always-visible, deliberately un-dismissable banner for any ACTIVE Emergency
 * SOS alert targeting this parent. It only clears when the sender (teacher or
 * institute admin) marks the alert resolved — see EmergencySos.jsx's "Stop
 * Alert" action — which pushes `emergency_sos_resolved` down the same socket
 * this reads from (SchoolNotificationContext). No dismiss button here on
 * purpose: a parent silencing their own emergency alert would defeat the
 * point of the feature.
 *
 * Rendered as a normal in-flow block above the sidebar/content row (mounted
 * once, before that row, in ParentLayout) rather than `position: fixed` —
 * fixed positioning overlaid the header's profile/logout button and made it
 * unclickable while an alert was active.
 */
export default function EmergencyAlertBanner() {
  const { activeEmergencyAlerts } = useSchoolNotification();

  if (!activeEmergencyAlerts.length) return null;

  return (
    <div className="relative z-10 w-full shrink-0 space-y-1 bg-rose-600 px-4 py-3 shadow-lg animate-pulse">
      {activeEmergencyAlerts.map((alert) => (
        <div key={alert.id} className="mx-auto flex max-w-5xl items-start gap-3 text-white">
          <Siren className="mt-0.5 size-5 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black leading-tight">
              Emergency Alert — {alert.studentName}
              {alert.className ? ` (${alert.className}${alert.sectionName ? ` - ${alert.sectionName}` : ""})` : ""}
            </p>
            <p className="mt-0.5 text-xs font-semibold text-rose-50">{alert.message}</p>
            <p className="mt-0.5 text-[11px] font-semibold text-rose-100">
              From {alert.senderName} ({alert.senderRole}) — please contact the school immediately.
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
