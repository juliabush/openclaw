import { html, type TemplateResult } from "lit";

const COPIED_FOR_MS = 1500;
const ERROR_FOR_MS = 2000;
const COPY_LABEL = "Copy as markdown";
const COPY_PLAIN_LABEL = "Copy as plain text";
const COPIED_LABEL = "Copied";
const ERROR_LABEL = "Copy failed";

type CopyButtonOptions = {
  text: () => string;
  label?: string;
};

async function copyTextToClipboard(text: string): Promise<boolean> {
  if (!text) {
    return false;
  }

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function setButtonLabel(button: HTMLButtonElement, label: string) {
  button.title = label;
  button.setAttribute("aria-label", label);
}

function createCopyButton(options: CopyButtonOptions): TemplateResult {
  const idleLabel = options.label ?? COPY_LABEL;
  return html`
    <button
      class="chat-copy-btn"
      type="button"
      title=${idleLabel}
      aria-label=${idleLabel}
      @click=${async (e: Event) => {
        const btn = e.currentTarget as HTMLButtonElement | null;

        if (!btn || btn.dataset.copying === "1") {
          return;
        }

        btn.dataset.copying = "1";
        btn.setAttribute("aria-busy", "true");
        btn.disabled = true;

        const copied = await copyTextToClipboard(options.text());
        if (!btn.isConnected) {
          return;
        }

        delete btn.dataset.copying;
        btn.removeAttribute("aria-busy");
        btn.disabled = false;

        if (!copied) {
          btn.dataset.error = "1";
          setButtonLabel(btn, ERROR_LABEL);

          window.setTimeout(() => {
            if (!btn.isConnected) {
              return;
            }
            delete btn.dataset.error;
            setButtonLabel(btn, idleLabel);
          }, ERROR_FOR_MS);
          return;
        }

        btn.dataset.copied = "1";
        setButtonLabel(btn, COPIED_LABEL);

        window.setTimeout(() => {
          if (!btn.isConnected) {
            return;
          }
          delete btn.dataset.copied;
          setButtonLabel(btn, idleLabel);
        }, COPIED_FOR_MS);
      }}
    >
      <span class="chat-copy-btn__label">
        ${idleLabel}
      </span>
    </button>
  `;
}

export function renderCopyAsMarkdownButton(markdown: string): TemplateResult {
  return createCopyButton({ text: () => markdown, label: COPY_LABEL });
}

export function renderCopyAsPlainTextButton(html: string): TemplateResult {
  return createCopyButton({
    text: () => {
      const tmp = document.createElement("div");
      tmp.innerHTML = html;

      tmp.querySelectorAll(".code-block-wrapper").forEach((el) => {
        const code = el.querySelector("code");
        el.replaceWith(document.createTextNode(code?.textContent || ""));
      });

      tmp.querySelectorAll("pre").forEach((el) => {
        el.replaceWith(document.createTextNode(el.textContent || ""));
      });

      tmp.querySelectorAll("code").forEach((el) => {
        el.replaceWith(document.createTextNode(el.textContent || ""));
      });

      return tmp.innerText.replace(/\n{3,}/g, "\n\n").trim();
    },
    label: COPY_PLAIN_LABEL,
  });
}
