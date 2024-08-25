import { LitElement, css, html, PropertyValues } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { provide } from '@lit/context';

import { IDB } from './lib/idb';
import { dbContext } from './indexdb-context';
import { Log } from './lib/data';

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
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
    }
    header {
      display: flex;
      justify-content: space-between;
      background: var(--color-primary);
      color: var(--color-text-default);
      h1 {
        padding: 0;
        margin: 0;
        font-size: 1rem;
      }
    }
    log-select {
      flex: 1;
    }
    workout-view {
      flex: 1;
    }
  `;

  private renderStatus() {
    if (this.currentLog === undefined) {
      return html`<header><span></span><h1>Swolog</h1><span></span></header>`;
    }
    return html`<header><span  @click=${() => {
      this.currentLog = undefined;
      history.pushState(null, '', '/');
    }}>< Back</span><h1>Swolog</h1><span></span>
   
    </header>`
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
