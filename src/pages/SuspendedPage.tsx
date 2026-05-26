import { useAuthStore } from "@/lib/auth-store";

export default function SuspendedPage() {
  const { clearAuth } = useAuthStore();

  const handleLogout = () => {
    clearAuth();
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="text-6xl mb-6">🚫</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Account Suspended</h1>
        <p className="text-gray-500 mb-2">
          Your institute's account has been suspended. You cannot access the platform at this time.
        </p>
        <p className="text-sm text-gray-400 mb-8">
          Please contact <strong>support@edva.in</strong> if you believe this is a mistake.
        </p>
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
