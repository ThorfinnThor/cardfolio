import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LanguageMenu } from "@/components/foundation/LanguageMenu";
import { LocaleProvider } from "@/i18n/locale";

describe("LocaleProvider", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.spyOn(window.navigator, "languages", "get").mockReturnValue(["en-GB", "de-DE"]);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("detects English, lets the user switch to German and stores that choice", async () => {
    const user = userEvent.setup();
    render(
      <LocaleProvider>
        <LanguageMenu />
        <p>Meine Binder</p>
      </LocaleProvider>,
    );

    await waitFor(() => expect(screen.getByText("My binders")).toBeInTheDocument());
    expect(document.documentElement.lang).toBe("en");

    await user.click(screen.getByRole("button", { name: "DE" }));
    await waitFor(() => expect(screen.getByText("Meine Binder")).toBeInTheDocument());
    expect(document.documentElement.lang).toBe("de");
    expect(window.localStorage.getItem("cardfolio-locale")).toBe("de");
  });
});
