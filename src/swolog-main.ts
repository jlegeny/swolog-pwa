import { LitElement, css, nothing, html, PropertyValues } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { provide } from '@lit/context';

import { IDB } from './lib/idb';
import { dbContext } from './indexdb-context';
import { Log } from './lib/data';

import * as color from './css/colors';

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
      ${this.currentLog ? this.renderCurrentLog() : this.renderLogSelect()}
    `
  }

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      background: black;
    }
    log-select {
      flex: 1;
      background: ${color.bg.base};
    }
    workout-view {
      flex: 1;
      background: ${color.bg.base};
    }
  `;

  private renderCurrentLog() {
    if (!this.currentLog) {
      return nothing;
    }
    return html`<workout-view .log=${this.currentLog} @close=${() => {
      this.currentLog = undefined;
      history.pushState(null, '', '/swolog');
    }}></workout-view>`;
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

  override connectedCallback(): void {
    super.connectedCallback();
    
    function updateViewportHeight() {
      const viewportHeight = window.innerHeight;
      document.documentElement.style.setProperty('--vh', `${viewportHeight}px`);
    }
    
    // Run on page load
    updateViewportHeight();

    window.addEventListener('resize', updateViewportHeight);
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
