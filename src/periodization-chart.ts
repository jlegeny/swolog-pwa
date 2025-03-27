import { consume } from "@lit/context";
import { LitElement, PropertyValues, css, html } from "lit";
import { customElement, property, state, query } from "lit/decorators.js";
import { cacheContext, LiftCache } from "./lift-cache-context";

import * as dim from "./css/dimensions";
import * as mixin from "./css/mixins";

import { Temporal } from "temporal-polyfill";
import { exerciseCache, Muscle } from "./lib/exercises";
import { sessionFractionalSets } from "./lib/ai";
import { DisplayStyle, Effort } from "./muscle-chart";

const PERIOD_LENGTH = 7;

const WEEKLY_TARGET = new Map<Muscle, number>([
  [Muscle.pectorals, 16],
  [Muscle.lats, 16],
  [Muscle.quads, 16],
  [Muscle.hamstrings, 16],
  [Muscle.glutes, 16],
  [Muscle.upperBack, 16],

  [Muscle.frontDeltoids, 14],
  [Muscle.sideDeltoids, 14],
  [Muscle.backDeltoids, 14],
  [Muscle.traps, 14],
  [Muscle.triceps, 14],
  [Muscle.biceps, 14],
  [Muscle.calves, 14],
  [Muscle.abs, 14],

  [Muscle.forearms, 12],
  [Muscle.obliques, 12],
  [Muscle.lowerBack, 12],
  [Muscle.adductor, 12],
]);

@customElement("periodization-chart")
export class PeriodizationChart extends LitElement {
  @consume({ context: cacheContext })
  @state()
  private cache?: LiftCache;

  @state() lastPeriod = { effort: new Map<Muscle, Effort>() };

  static styles = css`
    :host {
      display: flex;
      height: 100%;
      flex-direction: column;
    }
    ${mixin.reset}
    ${mixin.header}
    main {
      display: flex;
      flex-direction: column;
      align-items: center;
      overflow-y: scroll;
      padding: ${dim.spacing.s};

      h1 {
        font-size: ${dim.text.default};
        width: 100%;
      }
      ul {
        width: 100%;
      }
    }
  `;

  render() {
    return html`<header>
        <div class="left">
          <button
            @click=${() => {
              const options = {
                bubbles: false,
                composed: true,
              };
              this.dispatchEvent(new CustomEvent("closed", options));
            }}
          >
            Close
          </button>
        </div>
        <div class="right"></div>
      </header>
      <main>${this.renderLastPeriod()}</main>`;
  }

  renderLastPeriod() {
    return html`
      <h1>Muscle groups for last ${PERIOD_LENGTH} days.</h1>
      ${this.renderMuscleChart()}
      <ul>
        ${Array.from(this.lastPeriod.effort).map(([muscle, effort]) => {
          return html`<li>
            ${muscle} - ${effort.fractionalSets} / ${effort.target}
          </li>`;
        })}
      </ul>
    `;
  }

  renderMuscleChart() {
    return html`<muscle-chart
      .displayStyle=${DisplayStyle.COMPLETION}
      .effort=${this.lastPeriod.effort}
    ></muscle-chart>`;
  }

  protected willUpdate(_changedProperties: PropertyValues): void {
    if (!this.cache) {
      return;
    }

    const fractionalSets = new Map<Muscle, number>();
    Object.values(Muscle).forEach((muscle) => fractionalSets.set(muscle, 0));

    for (const session of (this.cache?.sessions ?? []).reversed()) {
      const now = Temporal.Now.instant();
      const date = Temporal.Instant.from(`${session.date}T00Z`);
      const sinceDays = now.since(date).seconds / (60 * 60 * 24);
      if (sinceDays > PERIOD_LENGTH) {
        break;
      }
      const sets = sessionFractionalSets(session);
      for (const muscle of sets.keys()) {
        fractionalSets.set(
          muscle,
          fractionalSets.get(muscle)! + sets.get(muscle)!
        );
      }
    }
    const effort = new Map<Muscle, Effort>();
    fractionalSets.forEach((fractionalSets, muscle) => {
      effort.set(muscle, { fractionalSets, target: WEEKLY_TARGET.get(muscle) });
    });
    this.lastPeriod.effort = effort;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "periodization-chart": PeriodizationChart;
  }
}
