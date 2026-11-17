import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LanguageMenu } from "@/components/foundation/LanguageMenu";
import { LocaleProvider } from "@/i18n/locale";

describe("LocaleProvider", () => {
  beforeEach(() => {
    window.localStorage.clear();
    /* The app is German unless the visitor switched to English; the browser language is ignored. */
    window.history.replaceState({}, "", "/app/");
    vi.spyOn(window.navigator, "languages", "get").mockReturnValue(["en-GB", "de-DE"]);
  });

  afterEach(() => {
    cleanup();
    window.history.replaceState({}, "", "/");
    vi.restoreAllMocks();
  });

  it("stays German for an English browser, lets the user switch to English and remembers that choice", async () => {
    const user = userEvent.setup();
    render(
      <LocaleProvider>
        <LanguageMenu />
        <p>Meine Binder</p>
      </LocaleProvider>,
    );

    await waitFor(() => expect(document.documentElement.lang).toBe("de"));
    expect(screen.getByText("Meine Binder")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "EN" }));
    await waitFor(() => expect(screen.getByText("My binders")).toBeInTheDocument());
    expect(document.documentElement.lang).toBe("en");
    expect(window.localStorage.getItem("cardfolio-locale")).toBe("en");
  });

  it("keeps the German landing page German whatever the browser prefers", async () => {
    window.history.replaceState({}, "", "/");
    window.localStorage.setItem("cardfolio-locale", "en");
    render(<LocaleProvider><p>Ein Binder</p></LocaleProvider>);
    await waitFor(() => expect(document.documentElement.lang).toBe("de"));
    expect(screen.getByText("Ein Binder")).toBeInTheDocument();
  });

  it("translates a sentence that React renders as several adjacent text nodes, also after an update and when switching back", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem("cardfolio-locale", "en");
    function Counter({ planned }: { planned: number }) {
      return <p data-testid="sentence">{planned} von {10} Karten</p>;
    }
    const { rerender } = render(<LocaleProvider><LanguageMenu /><Counter planned={3} /></LocaleProvider>);

    await waitFor(() => expect(screen.getByTestId("sentence")).toHaveTextContent("3 of 10 cards"));
    rerender(<LocaleProvider><LanguageMenu /><Counter planned={4} /></LocaleProvider>);
    await waitFor(() => expect(screen.getByTestId("sentence")).toHaveTextContent("4 of 10 cards"));

    await user.click(screen.getByRole("button", { name: "DE" }));
    await waitFor(() => expect(screen.getByTestId("sentence")).toHaveTextContent("4 von 10 Karten"));
  });
});
