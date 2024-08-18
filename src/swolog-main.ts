import { LitElement, css, html, PropertyValues } from 'lit'
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
      return html`<header><h1>Swolog </h1></header>`;
    }
    return html`<h1>Swolog : ${this.currentLog.id}</h1><button
    @click=${() => {
        this.currentLog = undefined;
        history.pushState(null, '', '/');
      }}
    >Close</button>`
  }

  private renderLogSelect() {
    return html`
      <log-select @selected-log=${(e: { detail: { log: Log } }) => {
        console.debug(`Selected workout ${e.detail.log.id}`);
        this.currentLog = e.detail.log;
        history.pushState(null, '', `#${this.currentLog.id}`);
      }}></log-select>
    `;
  }

  protected override async firstUpdated(_changedProperties: PropertyValues): Promise<void> {
    if (location.hash) {
      const logId = location.hash.replace(/^#/, '');
      console.debug(`Loading workout log ${logId}`);
      const log = await this.db.selectById<Log>('Log', logId);
      console.debug(`Loaded`, log);
      if (log) {
        this.currentLog = log;
      }
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'swolog-main': SwologMain
  }
}
