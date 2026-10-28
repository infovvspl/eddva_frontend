import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import useLiveRefresh from "./useLiveRefresh";

const advance = (ms: number) => act(async () => { await vi.advanceTimersByTimeAsync(ms); });

function setVisibility(state: "visible" | "hidden") {
  Object.defineProperty(document, "visibilityState", { configurable: true, get: () => state });
}

describe("useLiveRefresh", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setVisibility("visible");
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("refreshes on mount and then on every interval while the tab is visible", async () => {
    const refresh = vi.fn().mockResolvedValue(undefined);
    renderHook(() => useLiveRefresh(refresh, [], 20_000));
    await advance(0);
    expect(refresh).toHaveBeenCalledTimes(1);
    await advance(20_000);
    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it("does not wake a hidden tab", async () => {
    const refresh = vi.fn().mockResolvedValue(undefined);
    renderHook(() => useLiveRefresh(refresh, [], 20_000));
    await advance(0);
    setVisibility("hidden");
    await advance(100_000);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("merges the focus and visibilitychange that fire together on returning to a tab", async () => {
    const refresh = vi.fn().mockResolvedValue(undefined);
    renderHook(() => useLiveRefresh(refresh, [], 600_000));
    await advance(5_000);
    expect(refresh).toHaveBeenCalledTimes(1);
    act(() => {
      window.dispatchEvent(new Event("focus"));
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await advance(0);
    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it("never runs two refreshes at once, and reruns once after a change that arrived meanwhile", async () => {
    let release: () => void = () => {};
    const refresh = vi
      .fn()
      .mockImplementationOnce(() => new Promise<void>((resolve) => { release = resolve; }))
      .mockResolvedValue(undefined);
    renderHook(() => useLiveRefresh(refresh, [], 600_000));
    await advance(0);
    expect(refresh).toHaveBeenCalledTimes(1);

    act(() => {
      window.dispatchEvent(new Event("eddva:data-changed"));
      window.dispatchEvent(new Event("eddva:data-changed"));
    });
    await advance(0);
    expect(refresh).toHaveBeenCalledTimes(1);

    release();
    await advance(0);
    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it("refreshes straight away when data changed, even right after the last refresh", async () => {
    const refresh = vi.fn().mockResolvedValue(undefined);
    renderHook(() => useLiveRefresh(refresh, [], 600_000));
    await advance(0);
    act(() => { window.dispatchEvent(new Event("eddva:data-changed")); });
    await advance(0);
    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it("keeps working after a refresh fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const refresh = vi.fn().mockRejectedValueOnce(new Error("boom")).mockResolvedValue(undefined);
    renderHook(() => useLiveRefresh(refresh, [], 20_000));
    await advance(0);
    await advance(20_000);
    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it("stops everything on unmount", async () => {
    const refresh = vi.fn().mockResolvedValue(undefined);
    const { unmount } = renderHook(() => useLiveRefresh(refresh, [], 20_000));
    await advance(0);
    unmount();
    await advance(100_000);
    act(() => { window.dispatchEvent(new Event("eddva:data-changed")); });
    await advance(0);
    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
