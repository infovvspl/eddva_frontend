export type XpToastPayload = {
  xpEarned: number;
  isMockXp?: boolean;
};

export const XP_TOAST_EVENT = "eddva:xp-toast";

export function triggerXPToast(xpEarned: number, isMockXp = false) {
  if (typeof window === "undefined" || xpEarned <= 0) return;
  window.dispatchEvent(new CustomEvent<XpToastPayload>(XP_TOAST_EVENT, {
    detail: { xpEarned, isMockXp },
  }));
}
