import { LitElement, PropertyValues, css, html, nothing } from 'lit'
import { customElement, property, state, query } from 'lit/decorators.js'
import * as color from './css/colors';
import './card-container';

export interface Highlight {
  line?: number;
  lines?: number[];
  region?: {
    start: number;
    end: number;
  }
}

/**
 * Main App element.
 */
@customElement('history-log')
export class HistoryLog extends LitElement {
  @property({ attribute: false }) text = '';
  @property({ attribute: false }) highlight?: Highlight;

  render() {
    return html`
      <div class="container">
        <div class="content">
        ${this.text.split(/\n/).map(
      (line, index) => html`
          <div class="${index === this.highlight?.line && '' }"
            @click=${() => {
          this._dispatchSelected(index, line)
        }}>${line === '' ? html`<br>` : line}</div>`
    )}
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
  `;

  private _dispatchSelected(line: number, text: string) {
    const options = {
      detail: {
        line, text,
      },
      bubbles: true,
      composed: true,
    };
    this.dispatchEvent(new CustomEvent('selected', options));
  }

  protected firstUpdated(_changedProperties: PropertyValues): void {

  }
}

declare global {
  interface HTMLElementTagNameMap {
    'history-log': HistoryLog
  }
}