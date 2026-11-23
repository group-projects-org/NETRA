import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import AddExaminer from "../../src/components/admin/AddExaminer";

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
  import.meta.env.VITE_NODE_API_URL = "http://localhost:5000";
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("AddExaminer", () => {
  it("renders form fields correctly", () => {
    render(
      <MemoryRouter>
        <AddExaminer />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: /add new examiner/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter full name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/name@organization\.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter phone number/i)).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("validates empty fields on submission", () => {
    render(
      <MemoryRouter>
        <AddExaminer />
      </MemoryRouter>
    );

    fireEvent.submit(screen.getByRole("button", { name: /create examiner/i }).closest("form"));

    expect(screen.getByText("Please enter the examiner's full name.")).toBeInTheDocument();
    expect(screen.getByText("Email address is required.")).toBeInTheDocument();
    expect(screen.getByText("Phone number is required.")).toBeInTheDocument();
    expect(screen.getByText("Please select a department.")).toBeInTheDocument();
  });

  it("validates invalid email format and invalid phone number", () => {
    render(
      <MemoryRouter>
        <AddExaminer />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/enter full name/i), {
      target: { name: "fullName", value: "Examiner Test" },
    });
    fireEvent.change(screen.getByPlaceholderText(/name@organization\.com/i), {
      target: { name: "email", value: "bad-email" },
    });
    fireEvent.change(screen.getByPlaceholderText(/enter phone number/i), {
      target: { name: "phone", value: "123" },
    });
    fireEvent.change(screen.getByRole("combobox"), {
      target: { name: "department", value: "Computer Science" },
    });

    fireEvent.submit(screen.getByRole("button", { name: /create examiner/i }).closest("form"));

    expect(screen.getByText("Please enter a valid email address.")).toBeInTheDocument();
    expect(screen.getByText("Enter a valid phone number.")).toBeInTheDocument();
  });

  it("clears the form when Clear Form button is clicked", () => {
    render(
      <MemoryRouter>
        <AddExaminer />
      </MemoryRouter>
    );

    const nameInput = screen.getByPlaceholderText(/enter full name/i);
    fireEvent.change(nameInput, { target: { value: "Dr. Smith" } });
    expect(nameInput.value).toBe("Dr. Smith");

    fireEvent.click(screen.getByRole("button", { name: /clear form/i }));
    expect(nameInput.value).toBe("");
  });

  it("handles successful examiner creation and shows credentials", async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          id: 42,
          examinerId: "NETRA-88331122",
          fullName: "Dr. Arvind Kumar",
          email: "arvind@example.com",
          temporaryPassword: "tempPassword123",
          accountStatus: "ACTIVE",
          mustChangePassword: true,
        },
      }),
    });

    render(
      <MemoryRouter>
        <AddExaminer />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/enter full name/i), {
      target: { name: "fullName", value: "Dr. Arvind Kumar" },
    });
    fireEvent.change(screen.getByPlaceholderText(/name@organization\.com/i), {
      target: { name: "email", value: "arvind@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/enter phone number/i), {
      target: { name: "phone", value: "9876543210" },
    });
    fireEvent.change(screen.getByRole("combobox"), {
      target: { name: "department", value: "Computer Science" },
    });

    fireEvent.submit(screen.getByRole("button", { name: /create examiner/i }).closest("form"));

    await waitFor(() => {
      expect(screen.getByText(/examiner created successfully/i)).toBeInTheDocument();
      expect(screen.getByText("NETRA-88331122")).toBeInTheDocument();
      expect(screen.getByText("tempPassword123")).toBeInTheDocument();
    });

    // Reset with Add Another Examiner
    fireEvent.click(screen.getByRole("button", { name: /add another examiner/i }));
    expect(screen.getByRole("button", { name: /create examiner/i })).toBeInTheDocument();
  });
});
