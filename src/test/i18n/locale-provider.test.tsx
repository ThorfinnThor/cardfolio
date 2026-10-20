import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LanguageMenu } from "@/components/foundation/LanguageMenu";
import { LocaleProvider } from "@/i18n/locale";

describe("LocaleProvider", () => {
  beforeEach(() => {
    window.localStorage.clear();
    /* The app follows the visitor's language; the landing page at "/" is fixed to German. */
    window.history.replaceState({}, "", "/app/");
    vi.spyOn(window.navigator, "languages", "get").mockReturnValue(["en-GB", "de-DE"]);
  });

  afterEach(() => {
    cleanup();
    window.history.replaceState({}, "", "/");
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

  it("keeps the German landing page German whatever the browser prefers", async () => {
    window.history.replaceState({}, "", "/");
    window.localStorage.setItem("cardfolio-locale", "en");
    render(<LocaleProvider><p>Ein Binder</p></LocaleProvider>);
    await waitFor(() => expect(document.documentElement.lang).toBe("de"));
    expect(screen.getByText("Ein Binder")).toBeInTheDocument();
  });
});
