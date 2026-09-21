import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import KevAiChat from "./KevAiChat";
import { askKevAi } from "../../lib/kevaiClient";
import { ApiError } from "../../lib/api";

vi.mock("../../lib/kevaiClient", () => ({ askKevAi: vi.fn() }));

describe("KevAiChat", () => {
  it("shows the request's error message in the chat when KevAi fails", async () => {
    askKevAi.mockRejectedValueOnce(
      new ApiError("The server took too long to respond. Please try again.", { code: "TIMEOUT" })
    );
    vi.spyOn(console, "error").mockImplementation(() => {});
    const user = userEvent.setup();
    render(<KevAiChat />);

    await user.type(screen.getByPlaceholderText("Ask KevAi anything..."), "hello");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The server took too long to respond. Please try again."
    );
  });
});
