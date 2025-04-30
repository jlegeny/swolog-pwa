import { LitElement, css, nothing, html, PropertyValues } from "lit";
import { customElement, state, query } from "lit/decorators.js";
import { provide } from "@lit/context";

import { IDB } from "./lib/idb";
import { dbContext } from "./indexdb-context";
import { Log } from "./lib/data";
import { LogConfig } from "./lib/log-config";

import * as color from "./css/colors";
import * as dim from "./css/dimensions";

import "./log-select";
import "./log-view";
import "./pwa-badge";
import { PwaBadge } from "./pwa-badge";
import { getConfigForLog } from "./lib/log-config";

const VERSION = "0.0.22";

/**
 * Main App element.
 */
@customElement("swolog-main")
export class SwologMain extends LitElement {
  @provide({ context: dbContext })
  db = new IDB();

  @state() currentLog?: Log;
  @state() currentConfig?: LogConfig;

  @query("pwa-badge") pwaBadge?: PwaBadge;

  constructor() {
    super();
  }

  render() {
    const renderContent = () => {
      if (!this.currentLog) {
        return html`
          ${this.renderLogSelect()}
          <div class="version">${VERSION}</div>
        `;
      }
      return this.renderLog();
    };
    return html`
      ${renderContent()}
      <pwa-badge></pwa-badge>
    `;
  }

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      width: 100vw;
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
    .version {
      position: fixed;
      bottom: 0;
      padding: ${dim.spacing.xs};
      text-align: center;
      width: 100%;
    }
  `;

  private renderLog() {
    if (!this.currentLog || !this.currentConfig) {
      return nothing;
    }
    return html`<log-view
      .log=${this.currentLog}
      .config=${this.currentConfig}
      @close=${() => {
        this.currentLog = undefined;
        this.currentConfig = undefined;
        history.pushState(null, "", "/swolog");
      }}
    ></log-view>`;
  }

  private renderLogSelect() {
    return html`
      <log-select
        @selected-log=${(e: { detail: { log: Log; config: LogConfig } }) => {
          console.debug(`Selected workout ${e.detail.log.id}`);
          this.currentLog = e.detail.log;
          this.currentConfig = e.detail.config;
          history.pushState(null, "", `/swolog/#${this.currentLog.id}`);
        }}
      ></log-select>
    `;
  }

  override connectedCallback(): void {
    super.connectedCallback();

    function updateViewportHeight() {
      const viewportHeight = window.innerHeight;
      document.documentElement.style.setProperty("--vh", `${viewportHeight}px`);
    }

    // Run on page load
    updateViewportHeight();

    window.addEventListener("resize", updateViewportHeight);
  }

  protected override async firstUpdated(
    _changedProperties: PropertyValues
  ): Promise<void> {
    if (location.hash) {
      const logId = location.hash.replace(/^#/, "");
      console.debug(`Loading workout log ${logId}`);
      const log = await this.db.selectById<Log>("Log", logId);
      console.debug(`Loaded`, log);
      const config = await getConfigForLog(logId);
      if (log && config) {
        this.currentLog = log;
        this.currentConfig = config;
      }
    }
    this.pwaBadge?.forceRefresh();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "swolog-main": SwologMain;
  }
}
