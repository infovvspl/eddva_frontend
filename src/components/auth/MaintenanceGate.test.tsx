import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, useNavigate } from "react-router-dom";

const api = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock("@/lib/api/client", () => ({
  apiClient: api,
  extractData: (res: { data: { data?: unknown } }) => res.data.data ?? res.data,
}));
vi.mock("@/pages/MaintenancePage", () => ({ default: () => <div>Under maintenance</div> }));

import { useAuthStore } from "@/lib/auth-store";
import { MaintenanceGate, MAINTENANCE_FIRST_LOAD_CAP_MS, MAINTENANCE_POLL_MS } from "./MaintenanceGate";

const answer = (maintenanceMode: boolean) => ({
  data: { data: { maintenanceMode, platformName: "EDVA", supportEmail: "support@edva.in" } },
});

function GoTo({ to }: { to: string }) {
  const navigate = useNavigate();
  return <button onClick={() => navigate(to)}>go {to}</button>;
}

function mount(path = "/school/teacher") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <GoTo to="/school/teacher/classes" />
      <MaintenanceGate>
        <div>the app</div>
      </MaintenanceGate>
    </MemoryRouter>,
  );
}

const settle = () => act(async () => { await vi.advanceTimersByTimeAsync(0); });
const advance = (ms: number) => act(async () => { await vi.advanceTimersByTimeAsync(ms); });

function setVisibility(state: "visible" | "hidden") {
  Object.defineProperty(document, "visibilityState", { configurable: true, get: () => state });
  document.dispatchEvent(new Event("visibilitychange"));
}

describe("MaintenanceGate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    api.get.mockReset();
    api.get.mockResolvedValue(answer(false));
    useAuthStore.setState({ maintenanceMode: false, user: null, tenantType: null });
    setVisibility("visible");
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("asks once on load, without a cache-busting parameter, then shows the app", async () => {
    mount();
    await settle();
    expect(api.get).toHaveBeenCalledTimes(1);
    expect(api.get.mock.calls[0][0]).toBe("/tenants/public/platform-config?vertical=school");
    expect(screen.getByText("the app")).toBeInTheDocument();
  });

  it("does not ask again when the user moves to another page", async () => {
    mount();
    await settle();
    fireEvent.click(screen.getByText("go /school/teacher/classes"));
    await settle();
    expect(api.get).toHaveBeenCalledTimes(1);
  });

  it("re-checks once a minute, not every five seconds", async () => {
    mount();
    await settle();
    await advance(5_000);
    await advance(30_000);
    expect(api.get).toHaveBeenCalledTimes(1);
    await advance(MAINTENANCE_POLL_MS);
    expect(api.get).toHaveBeenCalledTimes(2);
  });

  it("does not poll while the tab is hidden, and re-checks when it is shown again", async () => {
    mount();
    await settle();
    setVisibility("hidden");
    await advance(MAINTENANCE_POLL_MS * 3);
    expect(api.get).toHaveBeenCalledTimes(1);
    setVisibility("visible");
    await settle();
    expect(api.get).toHaveBeenCalledTimes(2);
  });

  it("does not re-check on return if the last answer is still fresh", async () => {
    mount();
    await settle();
    setVisibility("hidden");
    await advance(1_000);
    setVisibility("visible");
    await settle();
    expect(api.get).toHaveBeenCalledTimes(1);
  });

  it("shows the maintenance page when it is switched on, but not to a super admin or on a login page", async () => {
    api.get.mockResolvedValue(answer(true));
    mount();
    await settle();
    expect(screen.getByText("Under maintenance")).toBeInTheDocument();
    expect(screen.queryByText("the app")).not.toBeInTheDocument();
    cleanup();

    useAuthStore.setState({ user: { role: "super_admin" } as never });
    mount();
    await settle();
    expect(screen.getByText("the app")).toBeInTheDocument();
    cleanup();

    useAuthStore.setState({ user: null });
    mount("/school/login");
    await settle();
    expect(screen.getByText("the app")).toBeInTheDocument();
  });

  it("unlocks by itself on the next check once maintenance is switched off", async () => {
    api.get.mockResolvedValueOnce(answer(true)).mockResolvedValue(answer(false));
    mount();
    await settle();
    expect(screen.getByText("Under maintenance")).toBeInTheDocument();
    await advance(MAINTENANCE_POLL_MS);
    expect(screen.getByText("the app")).toBeInTheDocument();
  });

  it("does not hold the app behind a spinner when the first answer is slow", async () => {
    api.get.mockReturnValue(new Promise(() => {}));
    mount();
    await settle();
    expect(screen.queryByText("the app")).not.toBeInTheDocument();
    await advance(MAINTENANCE_FIRST_LOAD_CAP_MS);
    expect(screen.getByText("the app")).toBeInTheDocument();
  });

  it("shows the app when the request fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    api.get.mockRejectedValue(new Error("network"));
    mount();
    await settle();
    expect(screen.getByText("the app")).toBeInTheDocument();
  });
});
