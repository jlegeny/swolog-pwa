import { LitElement, css, nothing, html, PropertyValues } from "lit";
import { customElement, property } from "lit/decorators.js";

import { Session } from "./lib/data";
import { Muscle, exerciseCache } from "./lib/exercises";
import {
  inferSessionTitle,
  sessionFractionalSets,
  sessionTotalSets,
} from "./lib/ai";
import { DisplayStyle, Effort } from './muscle-chart';

import * as color from "./css/colors";
import * as dim from "./css/dimensions";
import * as mixin from "./css/mixins";

import "./muscle-chart";

@customElement("session-details")
export class SessionDetails extends LitElement {
  @property({ attribute: false }) session?: Session;
  @property({ type: Boolean }) expanded = false;

  sessionData = {
    fractionalSets: new Map<Muscle, number>(),
    totalSets: 0,
  };

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
        <div>
          ${this.sessionData.totalSets}
          set${this.sessionData.totalSets === 1 ? "" : "s"}
        </div>
        <div>${this.renderDuration(this.session)}</div>
        ${this.renderMuscleChart()}
      </div>
      <div class="details">${this.renderMuscleGroups()}</div>
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
    muscle-chart {
      margin: 0 auto;
      transform: scale(0.75) translate(0, -4em);
      transform-origin: top;
      transition: transform 0.2s ease-in-out;
    }
    .summary[data-expanded] muscle-chart {
      transform: scale(1) translate(0, 0);
      transition: transform 0.2s ease-in-out;
    }
    .title {
      display: flex;
      justify-content: space-between;
    }
    .details {
      flex: 1 1;
      overflow-y: auto;
      padding: ${dim.spacing.xs};
    }
  `;

  renderTitle(session: Session) {
    return html`<div>${session.date}</div>
      <div>${inferSessionTitle(this.sessionData.fractionalSets)}</div>`;
  }

  renderDuration(session: Session) {
    if (!session.duration) {
      return nothing;
    }
    return html`${session.duration}'`;
  }

  renderMuscleGroups() {
    if (!this.expanded) {
      return nothing;
    }
    return html`
      <h3>Fractional Sets</h3>
      <ul>
        ${[...this.sessionData.fractionalSets.entries()]
          .filter(([, sets]) => {
            return sets !== 0;
          })
          .sort(([, a], [, b]) => {
            return b - a;
          })
          .map(([muscle, sets]) => html`<li>${muscle} : ${sets}</li>`)}
      </ul>
    `;
  }

  renderMuscleChart() {
    const effort = new Map<Muscle, Effort>();
    this.sessionData.fractionalSets.forEach((fractionalSets, muscle) => {
      effort.set(muscle, { fractionalSets });
    });
    return html`<muscle-chart
      .displayStyle=${DisplayStyle.FRACTIONAL_SETS}
      .effort=${effort}
    ></muscle-chart>`;
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

  protected override willUpdate(_changedProperties: PropertyValues): void {
    if (_changedProperties.has("session")) {
      if (!this.session) {
        return;
      }
      for (const lift of this.session.lifts ?? []) {
        const exercise = exerciseCache.getExercise(lift.shorthand);
        if (!exercise) {
          continue;
        }
      }
      this.sessionData = {
        fractionalSets: sessionFractionalSets(this.session),
        totalSets: sessionTotalSets(this.session),
      };
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "session-details": SessionDetails;
  }
}
