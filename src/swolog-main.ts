import { LitElement, css, nothing, html, PropertyValues } from "lit";
import { customElement, state, query } from "lit/decorators.js";
import { provide } from "@lit/context";

import { IDB } from "./lib/idb";
import { dbContext } from "./indexdb-context";
import { Log } from "./lib/data";

import * as color from "./css/colors";
import * as dim from "./css/dimensions";

import "./log-select";
import "./workout-view";
import "./pwa-badge";
import { PwaBadge } from "./pwa-badge";

const VERSION = "0.0.10";

/**
 * Main App element.
 */
@customElement("swolog-main")
export class SwologMain extends LitElement {
  @provide({ context: dbContext })
  db = new IDB();

  @state() currentLog?: Log;

  @query("pwa-badge") pwaBadge?: PwaBadge;

  constructor() {
    super();
  }

  render() {
    return html`
      ${this.currentLog
        ? this.renderCurrentLog()
        : html`
            ${this.renderLogSelect()}
            <div class="version">${VERSION}</div>
          `}
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

  private renderCurrentLog() {
    if (!this.currentLog) {
      return nothing;
    }
    return html`<workout-view
      .log=${this.currentLog}
      @close=${() => {
        this.currentLog = undefined;
        history.pushState(null, "", "/swolog");
      }}
    ></workout-view>`;
  }

  private renderLogSelect() {
    return html`
      <log-select
        @selected-log=${(e: { detail: { log: Log } }) => {
          console.debug(`Selected workout ${e.detail.log.id}`);
          this.currentLog = e.detail.log;
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
      if (log) {
        this.currentLog = log;
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
