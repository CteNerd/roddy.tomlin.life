import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import axe from "axe-core";
import App from "./App.jsx";

afterEach(() => {
  window.history.replaceState({}, "", "/");
});

function createAuth(configured, token = null) {
  return {
    configured,
    getAccessToken: vi.fn(() => token),
    completeSignIn: vi.fn(async () => null),
    beginSignIn: vi.fn(async () => {}),
    signOut: vi.fn(),
  };
}

describe("Founder reporting UI", () => {
  it("does not request or render metrics before an authenticated session", async () => {
    const loadMetrics = vi.fn();
    render(<App auth={createAuth(false)} loadMetrics={loadMetrics} />);

    expect(screen.getByRole("heading", { name: "Founder dashboard" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent("Sign-in is not configured");
    expect(loadMetrics).not.toHaveBeenCalled();
  });

  it("loads the selected month after sign-in and renders aggregates without inventing missing totals", async () => {
    const auth = createAuth(true, "in-memory-access-token");
    const loadMetrics = vi.fn(async () => ({
      month: new Date().toISOString().slice(0, 7),
      metrics: [{
        key: "consulting#inboundLeads",
        label: "Consulting inbound leads",
        total: 3,
        latestOccurredAt: "2026-11-05T16:00:00.000Z",
        processedAt: "2026-11-05T16:01:00.000Z",
      }],
    }));
    render(<App auth={auth} loadMetrics={loadMetrics} />);

    expect(await screen.findByText("3")).toBeVisible();
    expect(screen.getByText("Consulting inbound leads")).toBeVisible();
    expect(screen.getByText("Community mentor approvals")).toBeVisible();
    expect(screen.getByText("No projection is recorded for this month.")).toBeVisible();
    expect(loadMetrics).toHaveBeenCalledWith(expect.objectContaining({
      accessToken: "in-memory-access-token",
      month: new Date().toISOString().slice(0, 7),
    }));
    await userEvent.click(screen.getByRole("button", { name: "Sign out" }));
    expect(auth.signOut).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeEnabled();
  });

  it("shows owner authorization failures explicitly", async () => {
    const loadMetrics = vi.fn(async () => {
      throw new Error("This account is not authorized to view Founder reports.");
    });
    render(<App auth={createAuth(true, "wrong-owner-token")} loadMetrics={loadMetrics} />);

    expect(await screen.findByRole("alert")).toHaveTextContent("This account is not authorized");
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("passes layout-independent accessibility checks", async () => {
    render(<App auth={createAuth(false)} />);
    const result = await axe.run(document.body, {
      runOnly: {
        type: "rule",
        values: ["button-name", "link-name", "landmark-one-main", "heading-order"],
      },
    });
    expect(result.violations.map(({ id }) => id)).toEqual([]);
  });
});
