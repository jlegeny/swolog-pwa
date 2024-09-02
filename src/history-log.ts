import { LitElement, PropertyValues, css, html, nothing } from "lit";
import { customElement, property, query } from "lit/decorators.js";
import * as color from "./css/colors";
import * as dim from "./css/dimensions";
import "./card-container";

export interface Highlight {
  line?: number;
  lines?: number[];
  region?: {
    start: number;
    end: number;
  };
}

/**
 * Main App element.
 */
@customElement("history-log")
export class HistoryLog extends LitElement {
  @property({ attribute: false }) text = "";
  @property({ attribute: false }) highlight?: Highlight;
  @property({ attribute: false }) errors? = new Map<number, string>();

  @query(".container") container?: HTMLDivElement;

  render() {
    return html`
      <div class="container">
        <div class="content">
          ${this.text
            .split(/\n/)
            .map((text, index) => this.renderLine(index, text))}
        </div>
      </div>
    `;
  }

  static styles = css`
    :host {
      display: block;
      min-height: 0;
    }
    .container {
      overflow-y: scroll;
      height: 100%;
    }
    .content div {
      background-color: ${color.bg.table.default};
    }
    .content div:nth-child(2n) {
      background-color: ${color.bg.table.alt};
    }
    .content div.highlight {
      background-color: ${color.primary};
    }
    .content div .error {
      background: ${color.bg.error};
      font-size: ${dim.text.aux};
    }
  `;

  public renderLine(index: number, text: string) {
    const line = index + 1;
    return html`<div
      class="${index === this.highlight?.line && "highlight"}"
      @click=${() => {
        this._dispatchSelected(index, text);
      }}
    >
      ${text === "" ? html`<br />` : text}
      ${this.errors?.has(line)
        ? html`<div class="error">${this.errors.get(line)}</div>`
        : nothing}
    </div>`;
  }

  public scrollToBottom() {
    if (!this.container) {
      return;
    }
    this.container.scrollTop = this.container.scrollHeight;
  }

  private _dispatchSelected(line: number, text: string) {
    const options = {
      detail: {
        line,
        text,
      },
      bubbles: true,
      composed: true,
    };
    this.dispatchEvent(new CustomEvent("selected", options));
  }

  protected firstUpdated(_changedProperties: PropertyValues): void {
    this.scrollToBottom();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "history-log": HistoryLog;
  }
}
