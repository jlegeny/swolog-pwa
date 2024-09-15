import { LitElement, PropertyValues, css, html, nothing } from "lit";
import { customElement, property, query } from "lit/decorators.js";
import * as color from "./css/colors";
import * as dim from "./css/dimensions";
import "./card-container";

import { ifDefined } from "lit/directives/if-defined.js";

export interface Highlight {
  line?: number;
  lines?: number[];
  region?: {
    start: number;
    end: number;
  };
}

export interface Annotation {
  type: 'info'|'error'|'warning';
  text: string;
}

/**
 * Main App element.
 */
@customElement("history-log")
export class HistoryLog extends LitElement {
  @property({ attribute: false }) text = "";
  @property({ attribute: false }) highlight?: Highlight;
  @property({ attribute: false }) annotations? = new Map<
    number,
    Annotation[]
  >();

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
    .content div.hl {
      background-color: ${color.primary};
    }
    .content div.hl-region {
      background-color: ${color.bg.table.highlight};
    }
    .content div:nth-child(2n).hl-region {
      background-color: ${color.bg.table.highlightAlt};
    }
    .content div .error {
      background: ${color.bg.error};
      font-size: ${dim.text.aux};
    }
    .content div .warning {
      background: ${color.bg.warning};
      font-size: ${dim.text.aux};
    }
  `;

  public renderLine(index: number, text: string) {
    const line = index + 1;
    const highlightClass = () => {
      if (!this.highlight) {
        return nothing;
      }
      if (this.highlight.line === line) {
        return "hl";
      }
      const region = this.highlight.region;
      if (region && region.start <= line && line <= region.end) {
        return "hl-region";
      }
    };
    return html`<div
      class="${ifDefined(highlightClass())}"
      @click=${() => {
        this._dispatchSelected(line);
      }}
    >
      ${text === "" ? html`<br />` : text}
      ${this.annotations?.has(line)
        ? this.renderAnnotations(this.annotations.get(line) ?? [])
        : nothing}
    </div>`;
  }

  private renderAnnotations(annotations: Annotation[]) {
    return annotations.map(
      (annotation) =>
        html`<div class="${annotation.type}">${annotation.text}</div>`
    );
  }
  public scrollToBottom() {
    if (!this.container) {
      return;
    }
    this.container.scrollTop = this.container.scrollHeight;
  }

  private _dispatchSelected(line: number) {
    const options = {
      detail: {
        line,
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
