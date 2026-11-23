import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ThemeToggle from "../../src/components/ThemeToggle";
import { ThemeProvider } from "../../src/context/ThemeContext";

describe("ThemeToggle", () => {
  it("renders light mode state by default with Dark mode label", () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    const button = screen.getByRole("button", {
      name: /switch to dark mode/i,
    });
    expect(button).toBeInTheDocument();
    expect(screen.getByText("Dark mode")).toBeInTheDocument();
  });

  it("toggles theme between light and dark when clicked", () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    const button = screen.getByRole("button", {
      name: /switch to dark mode/i,
    });

    fireEvent.click(button);

    expect(screen.getByRole("button", {
      name: /switch to light mode/i,
    })).toBeInTheDocument();
    expect(screen.getByText("Light mode")).toBeInTheDocument();

    fireEvent.click(button);

    expect(screen.getByRole("button", {
      name: /switch to dark mode/i,
    })).toBeInTheDocument();
    expect(screen.getByText("Dark mode")).toBeInTheDocument();
  });
});
