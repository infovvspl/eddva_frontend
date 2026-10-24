import { useCallback } from "react"

import { apiClient } from "@/lib/api/client"
import { uploadAvatar } from "@/lib/api/auth"
import { useAuthStore } from "@/lib/auth-store"

/**
 * Uploads a profile photo and updates the signed-in user so every avatar refreshes.
 * `portal: "school"` posts to the school backend instead of the coaching one.
 */
export function useAvatarRemove(portal: "coaching" | "school" = "school") {
  return useCallback(async () => {
    await apiClient.delete(portal === "school" ? "/school/auth/profile/avatar" : "/auth/profile/avatar")
    const { user, setUser } = useAuthStore.getState()
    if (user) setUser({ ...user, profileImage: null, profilePictureUrl: null } as typeof user)
  }, [portal])
}

export function useAvatarUpload(portal: "coaching" | "school" = "coaching") {
  return useCallback(
    async (file: File) => {
      let avatarUrl: string
      if (portal === "school") {
        const fd = new FormData()
        fd.append("file", file)
        const res = await apiClient.post("/school/auth/profile/avatar", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        avatarUrl = (res.data?.data ?? res.data)?.avatarUrl
      } else {
        avatarUrl = (await uploadAvatar(file)).avatarUrl
      }
      const { user, setUser } = useAuthStore.getState()
      if (user) setUser({ ...user, profileImage: avatarUrl, profilePictureUrl: avatarUrl } as typeof user)
      return avatarUrl
    },
    [portal],
  )
}
