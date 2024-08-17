import { LitElement, css, html } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { provide } from '@lit/context';

import { IDB } from './idb';
import { dbContext } from './indexdb-context';
import { Log } from './data';

import './log-select';
import './workout-view';

/**
 * Main App element.
 */
@customElement('swolog-main')
export class SwologMain extends LitElement {

  @provide({ context: dbContext })
  db = new IDB();

  @state() currentLog?: Log;

  constructor() {
    super();
  }

  render() {
    return html`
      <div class="status">${this.renderStatus()}</div>
      ${this.currentLog ? html`<workout-view .log=${this.currentLog}></workout-view>` : this.renderLogSelect()}
    `
  }

  static styles = css`
    :host {
      display: block;
    }
  `;

  private renderStatus() {
    if (this.currentLog === undefined) {
      return html`<h1>Swolog</h1>`;
    }
    return html`<h1>Swolog : ${this.currentLog.id}</h1><button
    @click=${() => this.currentLog = undefined}
    >Close</button>`
  }

  private renderLogSelect() {
    return html`
      <log-select @selected-log=${(e: { detail: { log: Log } }) => {
        console.info(`Selected workout ${e.detail.log.id}`);
      this.currentLog = e.detail.log;
      }}></log-select>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'swolog-main': SwologMain
  }
}
