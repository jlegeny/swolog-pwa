import { LitElement, css, nothing, html, PropertyValues } from "lit";
import { customElement, property } from "lit/decorators.js";


import { Session } from "./lib/data";
import { Muscle, exerciseCache } from "./lib/exercises";
import { inferSessionTitle } from "./lib/ai";

import * as color from "./css/colors";
import * as dim from "./css/dimensions";
import * as mixin from "./css/mixins";

@customElement("session-details")
export class SessionDetails extends LitElement {
  @property({ attribute: false }) session?: Session;
  @property({ type: Boolean }) expanded = false;

  sessionData = {
    mainGroups: new Set<Muscle>(),
    auxGroups: new Set<Muscle>(),
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
        <div>${this.renderDuration(this.session)}</div>
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
    return html`${session.date} -
    ${inferSessionTitle(
      this.sessionData.mainGroups,
      this.sessionData.auxGroups
    )}`;
  }

  renderDuration(session: Session) {
    if (!session.duration) {
      return nothing;
    }
    return html`${session.duration}`;
  }

  renderMuscleGroups() {
    if (!this.expanded) {
      return nothing;
    }
    const mainGroupsArray = Array.from(this.sessionData.mainGroups).sort();
    const auxGroupsArray = Array.from(this.sessionData.auxGroups).sort();
    return html`
      <h3>Targeted muscles</h3>
      <ul>
        ${mainGroupsArray.map((muscle) => html`<li>${muscle}</li>`)}
      </ul>
      <h3>Auxiliary muscles</h3>
      <ul>
        ${auxGroupsArray.map((muscle) => html`<li>${muscle}</li>`)}
      </ul>
    `;
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
      const mainGroups = new Set<Muscle>();
      const auxGroups = new Set<Muscle>();
      for (const lift of this.session?.lifts ?? []) {
        const exercise = exerciseCache.getExercise(lift.shorthand);
        if (!exercise) {
          continue;
        }
        for (const muscle of exercise.target) {
          mainGroups.add(muscle);
        }
        for (const muscle of exercise.auxiliary ?? []) {
          auxGroups.add(muscle);
        }
      }
      for (const muscle of mainGroups) {
        auxGroups.delete(muscle);
      }
      this.sessionData = {
        mainGroups,
        auxGroups,
      };
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "session-details": SessionDetails;
  }
}
