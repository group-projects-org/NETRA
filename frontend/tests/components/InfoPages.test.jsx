import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { About, HowItWorks, FeaturesPage, Contact } from "../../src/components/InfoPages";

describe("InfoPages", () => {
  describe("About", () => {
    it("renders the About page heading and overview", () => {
      render(
        <MemoryRouter>
          <About />
        </MemoryRouter>
      );

      expect(
        screen.getByRole("heading", {
          name: /a controlled route for sensitive examination material/i,
        })
      ).toBeInTheDocument();
      expect(screen.getByText(/examination security is a process/i)).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /view workflow/i })).toHaveAttribute(
        "href",
        "/how-it-works"
      );
    });
  });

  describe("HowItWorks", () => {
    it("renders five stages and stage outcomes", () => {
      render(
        <MemoryRouter>
          <HowItWorks />
        </MemoryRouter>
      );

      expect(
        screen.getByRole("heading", { name: /five stages/i })
      ).toBeInTheDocument();
      expect(screen.getByText("Prepare the examination paper")).toBeInTheDocument();
      expect(screen.getByText("Encrypt and protect")).toBeInTheDocument();
      expect(screen.getByText("Release access at the right time")).toBeInTheDocument();
      expect(screen.getByText("Retrieve and print securely")).toBeInTheDocument();
      expect(screen.getByText("Support forensic investigation")).toBeInTheDocument();
    });
  });

  describe("FeaturesPage", () => {
    it("renders all security capabilities", () => {
      render(
        <MemoryRouter>
          <FeaturesPage />
        </MemoryRouter>
      );

      expect(
        screen.getByRole("heading", {
          name: /security functions, with a clear purpose/i,
        })
      ).toBeInTheDocument();
      expect(screen.getByText("Encrypted paper handling")).toBeInTheDocument();
      expect(screen.getByText("Time-controlled access")).toBeInTheDocument();
      expect(screen.getByText("Controlled printing")).toBeInTheDocument();
      expect(screen.getByText("Forensic watermarking")).toBeInTheDocument();
      expect(screen.getByText("Activity records")).toBeInTheDocument();
      expect(screen.getByText("Authorised retrieval")).toBeInTheDocument();
    });
  });

  describe("Contact", () => {
    it("renders contact form and handles submission, copying and email app actions", async () => {
      // Mock clipboard and window.location
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      vi.stubGlobal("navigator", {
        ...navigator,
        clipboard: { writeText: writeTextMock },
      });

      render(
        <MemoryRouter>
          <Contact />
        </MemoryRouter>
      );

      expect(
        screen.getByRole("heading", { name: /send a question to the netra team/i })
      ).toBeInTheDocument();

      const nameInput = screen.getByPlaceholderText(/your name/i);
      const emailInput = screen.getByPlaceholderText(/you@example\.com/i);
      const subjectInput = screen.getByPlaceholderText(/what is this about\?/i);
      const messageInput = screen.getByPlaceholderText(/describe your question or feedback/i);

      fireEvent.change(nameInput, { target: { value: "Test User" } });
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(subjectInput, { target: { value: "Project Query" } });
      fireEvent.change(messageInput, { target: { value: "This is a detailed feedback message." } });

      fireEvent.click(screen.getByRole("button", { name: /prepare message/i }));

      expect(screen.getByText(/message prepared/i)).toBeInTheDocument();

      const copyBtn = screen.getByRole("button", { name: /copy message/i });
      fireEvent.click(copyBtn);
      expect(writeTextMock).toHaveBeenCalled();

      const emailBtn = screen.getByRole("button", { name: /open email app/i });
      fireEvent.click(emailBtn);
    });
  });
});
