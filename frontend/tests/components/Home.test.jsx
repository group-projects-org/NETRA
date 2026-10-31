import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { describe, expect, it } from "vitest";
import Home from "../../src/components/Home";

function CurrentPath() {
  const location = useLocation();
  return <output>{location.pathname}</output>;
}

describe("Home", () => {
  it("renders the NETRA identity and feature navigation", () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: /ensuring confidentiality/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Features" })).toHaveAttribute("href", "/features");
    expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
  });

  it("navigates to login when the login button is selected", () => {
    render(
      <MemoryRouter>
        <Home />
        <CurrentPath />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    expect(screen.getByText("/login")).toBeInTheDocument();
  });
});