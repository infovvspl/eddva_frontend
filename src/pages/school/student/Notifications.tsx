import React from "react";
import NotificationCenterContent from "@/components/school/NotificationCenterContent";
import { useAuth } from "@/context/SchoolAuthContext";

export default function StudentNotifications() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="flex size-full flex-col">
      <NotificationCenterContent currentUser={user} />
    </div>
  );
}
