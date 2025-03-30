import { consume } from "@lit/context";
import { LitElement, PropertyValues, css, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import { cacheContext, LiftCache } from "./lift-cache-context";

import * as dim from "./css/dimensions";
import * as mixin from "./css/mixins";

import { Temporal } from "temporal-polyfill";
import { Exercise, exerciseCache, Muscle } from "./lib/exercises";
import { sessionFractionalSets } from "./lib/ai";
import { DisplayStyle, Effort } from "./muscle-chart";

const PERIOD_LENGTH = 7;

const WEEKLY_TARGET = new Map<Muscle, number>([
  [Muscle.pectorals, 16],
  [Muscle.lats, 16],
  [Muscle.quads, 16],
  [Muscle.hamstrings, 16],
  [Muscle.glutes, 16],

  [Muscle.frontDeltoids, 14],
  [Muscle.sideDeltoids, 14],
  [Muscle.rearDeltoids, 14],
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

      h1, h2 {
        font-size: ${dim.text.default};
        width: 100%;
      }
      ul {
        align-self: flex-start;
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
        ${Array.from(this.lastPeriod.effort)
          .sort((a, b) => {
            return (a[1].fractionalSets ?? 0) - (b[1].fractionalSets ?? 0);
          })
          .map(([muscle, effort]) => {
            return html`<li>
              ${muscle} - ${effort.fractionalSets} / ${effort.target}
            </li>`;
          })}
      </ul>
      ${this.renderAdvice()}
    `;
  }

  renderMuscleChart() {
    return html`<muscle-chart
      .displayStyle=${DisplayStyle.COMPLETION}
      .effort=${this.lastPeriod.effort}
    ></muscle-chart>`;
  }

  renderAdvice() {
    const muscles = Array.from(this.lastPeriod.effort)
      .sort((a, b) => {
        return (a[1].fractionalSets ?? 0) - (b[1].fractionalSets ?? 0);
      })
      .map(([muscle, _effort]) => muscle);
    const exerciseScore = new Map<Exercise, number>();
    for (const muscle of muscles) {
      const fractionalSets = this.lastPeriod.effort.get(muscle)?.fractionalSets ?? 0;
      const target = this.lastPeriod.effort.get(muscle)?.target ?? 1;
      const coefficient = (target - fractionalSets) / target;
      for (const exercise of exerciseCache.exercisesForMuscle(muscle)) {
        console.log(`${exercise.shorthand} for ${muscle} coeff ${coefficient}`);
        exerciseScore.set(exercise, (exerciseScore.get(exercise) ?? 0) + 1 * coefficient);
      }
      for (const exercise of exerciseCache.auxiliaryExercisesForMuscle(
        muscle
      )) {
        console.log(`aux ${exercise.shorthand} for ${muscle} coeff ${coefficient}`);
        exerciseScore.set(exercise, (exerciseScore.get(exercise) ?? 0) + 0.5 * coefficient);
      }
    }
    console.log(
      Array.from(exerciseScore)
        .sort((a, b) => {
          return b[1] - a[1];
        })
        .map(([exercise, score]) => `${exercise.shorthand} -> ${score}`)
    );
    return html`
      <h2>Recommended exercises</h2>
      <ul>
        ${Array.from(exerciseScore)
          .sort((a, b) => {
            return b[1] - a[1];
          })
          .slice(0, 4)
          .map(([exercise, _score]) => html`<li>${exercise.name}</li>`)}
      </ul>
    `;
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
