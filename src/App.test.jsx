import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import axe from "axe-core";
import App from "./App.jsx";
import { profile } from "./profile.js";

afterEach(() => {
  vi.restoreAllMocks();
  window.history.replaceState({}, "", "/");
});

describe("public professional profile", () => {
  it("presents the confirmed title, employer, and one main heading", () => {
    render(<App />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    const snapshot = screen.getByRole("complementary", { name: "Professional snapshot" });
    expect(within(snapshot).getByText(profile.name)).toBeVisible();
    expect(within(snapshot).getByText("Director of Software Engineering")).toBeVisible();
    expect(within(snapshot).getByText("FMG")).toBeVisible();
    expect(screen.getAllByRole("article")).toHaveLength(7);
  });

  it("provides navigation and skip links to real sections", () => {
    render(<App />);
    expect(screen.getByRole("link", { name: "Skip to content" })).toHaveAttribute("href", "#main");
    const navigation = screen.getByRole("navigation", { name: "Main navigation" });
    expect(within(navigation).getAllByRole("link")).toHaveLength(5);
    for (const link of screen.getAllByRole("link")) {
      const href = link.getAttribute("href");
      if (href.startsWith("#")) {
        expect(document.getElementById(href.slice(1))).not.toBeNull();
      }
    }
  });

  it("uses the owner-confirmed contact destinations", () => {
    render(<App />);
    expect(screen.getByRole("link", { name: `Email ${profile.email}` })).toHaveAttribute(
      "href", `mailto:${profile.email}`,
    );
    expect(screen.getByRole("link", { name: `Phone ${profile.phone}` })).toHaveAttribute(
      "href", "tel:+17316162153",
    );
    expect(screen.getByRole("link", { name: "Phone (731) 616-2153" })).toHaveAccessibleDescription(
      "Please leave a voicemail with your name and reason for calling. It helps me distinguish your call from spam.",
    );
    expect(screen.getByRole("link", { name: "LinkedIn Let's connect" })).toHaveAttribute(
      "href", profile.linkedin,
    );
  });

  it("shows the reviewed career chronology and confirmed FMG promotion without disputed claims", () => {
    render(<App page="experience" />);
    const timeline = screen.getByRole("region", { name: "Experience", exact: true });
    const entries = within(timeline).getAllByRole("listitem").filter((entry) => entry.classList.contains("experience-entry"));
    expect(entries.map((entry) => within(entry).getByRole("heading", { level: 2 }).textContent)).toEqual([
      "FMG", "Integrate", "Landry's Inc.", "Advanced Discovery", "Ready Logistics", "Greyhound", "SAIC",
    ]);
    const fmg = within(timeline).getByRole("list", { name: "FMG roles" });
    expect(fmg).toHaveTextContent("Director of Software EngineeringFebruary 2026 - Present");
    expect(fmg).toHaveTextContent("Engineering Manager, User Administration & ArchitectureSeptember 2024 - February 2026");
    expect(within(timeline).getByText("November 2018 - May 2021; April 2022 - October 2022")).toBeVisible();
    expect(within(timeline).getByRole("heading", { name: "B.S., Mathematics and Computer Science" })).toBeVisible();
    expect(timeline.textContent).not.toMatch(/\$1\.2M|40\+|16 months|performance improvement|SecureFrame|Cobalt/i);
    expect(screen.queryByRole("link", { name: /download.*resume/i })).not.toBeInTheDocument();
  });

  it("introduces the NFL background without adding the full timeline to the homepage", () => {
    render(<App />);
    expect(screen.getByText("Former NFL player. Engineering leader.")).toBeVisible();
    expect(screen.getByText(/Before engineering, I played in the NFL/)).toHaveTextContent(
      "Jacksonville Jaguars and Atlanta Falcons",
    );
    expect(screen.queryByRole("region", { name: "Experience", exact: true })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Explore my experience" })).toHaveAttribute("href", "/experience.html");
  });

  it("provides an independent experience page with one heading and links back to the profile", () => {
    render(<App page="experience" />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/^Experience$/);
    expect(screen.getByText("From the NFL to software engineering leadership—a career built on growth.")).toBeVisible();
    expect(screen.queryByText("Before software, a different field.")).not.toBeInTheDocument();
    const navigation = screen.getByRole("navigation");
    expect(within(navigation).getByRole("link", { name: "Experience", exact: true })).toHaveAttribute("aria-current", "page");
    expect(within(navigation).getByRole("link", { name: "About", exact: true })).toHaveAttribute("href", "/#about");
    expect(screen.getByRole("link", { name: "Back to profile" })).toHaveAttribute("href", "/#main");
    expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
  });

  it.each(["/about/childhood", "/about/college", "/about/nfl", "/about/wedding", "/about/it", "/hobbies/vlog"])(
    "shows only the professional profile when opened on a retired path: %s",
    (pathname) => {
      window.history.replaceState({}, "", pathname);
      render(<App />);
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Build with purpose.");
      expect(screen.getAllByRole("img").map((image) => image.getAttribute("src"))).toEqual([
        "/roddy-headshot.jpg", "/roddy-seated.jpg",
      ]);
      expect(document.querySelector("iframe")).not.toBeInTheDocument();
      expect(screen.queryByRole("link", { name: /read more|childhood|wedding|résumé/i })).not.toBeInTheDocument();
      for (const link of screen.getAllByRole("link")) {
        expect(link.getAttribute("href")).not.toMatch(/^\/(about|hobbies|football)/);
      }
    },
  );

  it("offers a printable profile without pretending it is the old resume", async () => {
    const print = vi.spyOn(window, "print").mockImplementation(() => {});
    render(<App />);
    await userEvent.setup().click(screen.getByRole("button", { name: "Print / save this profile" }));
    expect(print).toHaveBeenCalledOnce();
    expect(screen.queryByRole("link", { name: /download.*resume/i })).not.toBeInTheDocument();
  });

  it("loads only the two approved portraits with layout dimensions and accessible descriptions", () => {
    render(<App />);
    const headshot = screen.getByRole("img", { name: "Roddy Tomlin smiling in a navy jacket" });
    expect(headshot).toHaveAttribute("width", "721");
    expect(headshot).toHaveAttribute("height", "901");
    expect(headshot).toHaveAttribute("fetchpriority", "high");
    const seated = screen.getByRole("img", { name: "Roddy Tomlin seated on a park bench" });
    expect(seated).toHaveAttribute("loading", "lazy");
    expect(seated).toHaveAttribute("width", "600");
    expect(seated).toHaveAttribute("height", "900");
  });

  it.each(["home", "experience"])("passes layout-independent accessibility checks: %s", async (page) => {
    render(<App page={page} />);
    const result = await axe.run(document.body, {
      runOnly: {
        type: "rule",
        values: [
          "aria-allowed-attr", "aria-required-attr", "button-name", "link-name",
          "list", "listitem", "region", "landmark-one-main", "heading-order", "image-alt",
        ],
      },
    });
    expect(result.violations.map(({ id, description }) => ({ id, description }))).toEqual([]);
  });
});
