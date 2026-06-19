import React from "react";
import NotificationCenterContent from "@/components/school/NotificationCenterContent";
import { useAuth } from "@/context/SchoolAuthContext";

export default function ParentNotifications() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="flex h-full w-full flex-col">
      <NotificationCenterContent currentUser={user} />
    </div>
  );
}
