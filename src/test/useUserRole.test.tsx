import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";

// Controllable auth state: the test pushes new values and re-renders.
let authState: { user: { id: string } | null; loading: boolean } = { user: null, loading: true };
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => authState }));

// Role queries resolve only when the test says so, to reproduce the startup race.
const pending: Array<(v: { data: { role: string }[]; error: null }) => void> = [];
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          then: (onOk: (v: unknown) => void, onErr?: (e: unknown) => void) =>
            new Promise((resolve) => pending.push(resolve)).then(onOk, onErr),
        }),
      }),
    }),
  },
}));

import { RoleProvider, useUserRole } from "@/hooks/useUserRole";

function Probe() {
  const { loading, primaryRole } = useUserRole();
  return <div>{loading ? "loading" : `role:${primaryRole}`}</div>;
}

const ui = () => (
  <RoleProvider>
    <Probe />
  </RoleProvider>
);

describe("RoleProvider on app relaunch", () => {
  beforeEach(() => {
    pending.length = 0;
    sessionStorage.clear();
    localStorage.clear();
    authState = { user: null, loading: true };
  });

  it("finishes loading when the restored session is reported twice as different user objects", async () => {
    const { rerender } = render(ui());

    // INITIAL_SESSION from onAuthStateChange...
    authState = { user: { id: "u1" }, loading: false };
    rerender(ui());
    // ...then getSession() resolves with a separate copy of the same user.
    authState = { user: { id: "u1" }, loading: false };
    rerender(ui());

    await act(async () => {
      pending.forEach((resolve) => resolve({ data: [{ role: "owner" }], error: null }));
    });

    expect(screen.getByText("role:owner")).toBeTruthy();
  });

  it("stops loading if the roles request fails (e.g. offline)", async () => {
    const { rerender } = render(ui());
    authState = { user: { id: "u1" }, loading: false };
    rerender(ui());

    await act(async () => {
      pending.forEach((resolve) => resolve({ data: null as never, error: { message: "offline" } as never }));
    });

    expect(screen.queryByText("loading")).toBeNull();
  });
});
