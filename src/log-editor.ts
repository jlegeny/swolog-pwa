import {
  LitElement,
  PropertyValues,
  css,
  html,
} from "lit";
import { customElement, property, state, query } from "lit/decorators.js";

import { Log } from "./lib/data";

import * as mixin from "./css/mixins";

@customElement("log-editor")
export class LogEditor extends LitElement {
  @property({ attribute: false }) log!: Log;

  @state() modified = false;

  @query("textarea") textArea?: HTMLTextAreaElement;

  static styles = css`
    :host {
      display: flex;
      height: 100%;
      flex-direction: column;
    }
    ${mixin.reset}
    ${mixin.header}
    ${mixin.textarea}

    textarea {
      height: 100%;
    }
    textarea:focus {
      outline: none;
    }
  `;

  render() {
    return html` <header>
        <div class="left">
          <button
            @click=${() => {
              const options = {
                bubbles: false,
                composed: true,
              };
              this.dispatchEvent(new CustomEvent("closeeditor", options));
            }}
          >
            Close
          </button>
        </div>
        <div class="right">
          <button
            @click=${() => {
              const options = {
                detail: {
                  text: this.textArea?.value ?? "",
                },
                bubbles: true,
                composed: true,
              };
              this.dispatchEvent(new CustomEvent("save", options));
            }}
          >
            Save
          </button>
        </div>
      </header>
      <textarea
        autocorrect="off"
        autocapitalize="off"
        autocomplete="off"
        spellcheck="false"
        @keyup=${async () => {
          this.modified = true;
        }}
        @paste=${() => {
          this.modified = true;
        }}
        class="editor"
      >
${this.log.text.replace(/\n\n$/, "\n")}</textarea
      >`;
  }

  protected override firstUpdated(_changedProperties: PropertyValues): void {
    setTimeout(() => {
      if (!this.textArea) {
        return;
      }
      this.textArea.focus();
      this.textArea.setSelectionRange(
        this.textArea.value.length,
        this.textArea.value.length
      );
      this.textArea.scrollTop = this.textArea.scrollHeight;
    }, 300);
  }
}
