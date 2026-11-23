import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "../src/App";

describe("App Routes", () => {
  it("renders the Home route at /", () => {
    window.history.pushState({}, "Home", "/");
    render(<App />);
    expect(screen.getByRole("heading", { name: /ensuring confidentiality/i })).toBeInTheDocument();
  });

  it("renders the Login route at /login", () => {
    window.history.pushState({}, "Login", "/login");
    render(<App />);
    expect(screen.getByRole("heading", { name: /sign in/i })).toBeInTheDocument();
  });

  it("renders the About route at /about", () => {
    window.history.pushState({}, "About", "/about");
    render(<App />);
    expect(
      screen.getByRole("heading", {
        name: /a controlled route for sensitive examination material/i,
      })
    ).toBeInTheDocument();
  });

  it("renders the How It Works route at /how-it-works", () => {
    window.history.pushState({}, "How It Works", "/how-it-works");
    render(<App />);
    expect(screen.getByRole("heading", { name: /five stages/i })).toBeInTheDocument();
  });

  it("renders the Features route at /features", () => {
    window.history.pushState({}, "Features", "/features");
    render(<App />);
    expect(
      screen.getByRole("heading", {
        name: /security functions, with a clear purpose/i,
      })
    ).toBeInTheDocument();
  });

  it("renders the Contact route at /contact", () => {
    window.history.pushState({}, "Contact", "/contact");
    render(<App />);
    expect(
      screen.getByRole("heading", {
        name: /send a question to the netra team/i,
      })
    ).toBeInTheDocument();
  });
});
