import { LitElement, css, nothing, html, PropertyValues } from "lit";
import { customElement, state, property } from "lit/decorators.js";
import { consume } from "@lit/context";
import { Task } from "@lit/task";

import { cacheContext } from "./lift-cache-context";

import { Temporal } from "temporal-polyfill";
import { Lift, Session } from "./lib/data";
import { LiftCache } from "./lift-cache-context";
import { exerciseCache } from './lib/exercises';

import * as color from "./css/colors";
import * as dim from "./css/dimensions";
import * as mixin from "./css/mixins";

@customElement("session-details")
export class SessionDetails extends LitElement {
  @consume({ context: cacheContext })
  @state()
  private cache?: LiftCache;

  @property({ attribute: false }) session?: Session;
  @property({ type: Boolean }) expanded = false;

  override render() {
    if (!this.session) {
      return nothing;
    }
    return html`
      <div ?data-expanded=${this.expanded} class="summary">
        <div class="title">
          <span>${this.renderTitle(this.session)}</span
          ><span @click=${this._dispatchExpandCollapse}
            >${this.expanded ? "Less" : "More"}</span
          >
        </div>
        <div>${this.renderDuration(this.session)}</div>
      </div>
    `;
  }

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      min-height: 0;
      height: 100%;
    }

    ${mixin.reset}

    .summary {
      flex: 0 0;
      padding: ${dim.spacing.xs};
      background-color: ${color.bg.card.default};
      transition: background-color 0.2s ease-in-out;
    }
    .summary[data-expanded] {
      box-shadow: 0 4px 20px -5px ${color.shadow};
      position: sticky;
      background-color: ${color.bg.card.header};
    }
    .title {
      display: flex;
      justify-content: space-between;
    }
  `;

  renderTitle(session: Session) {
    return html`${session.date}`;
  }

  renderDuration(session: Session) {
    if (!session.duration) {
      return nothing;
    }
    return html`${session.duration}`;
  }

  // Events

  private _dispatchExpandCollapse() {
    const options = {
      bubbles: true,
      composed: true,
    };
    if (this.expanded) {
      this.dispatchEvent(new CustomEvent("collapse", options));
    } else {
      this.dispatchEvent(new CustomEvent("expand", options));
    }
  }

}

declare global {
  interface HTMLElementTagNameMap {
    "session-details": SessionDetails;
  }
}
