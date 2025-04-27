import { consume } from "@lit/context";
import { LitElement, PropertyValues, css, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { cacheContext, LiftCache } from "./lift-cache-context";

import * as dim from "./css/dimensions";
import * as color from "./css/colors";
import * as mixin from "./css/mixins";

import { Temporal } from "temporal-polyfill";
import { Exercise, exerciseCache, Muscle } from "./lib/exercises";
import { sessionFractionalSets } from "./lib/ai";
import { DisplayStyle, Effort } from "./muscle-chart";
import { DEFAULT_CONFIG, LogConfig, MuscleGroup } from "./lib/log-config";

@customElement("periodization-chart")
export class PeriodizationChart extends LitElement {
  @consume({ context: cacheContext })
  @state()
  private cache?: LiftCache;

  @property({ attribute: false }) config: LogConfig = DEFAULT_CONFIG;

  @state() lastPeriod = {
    effort: new Map<Muscle, Effort>(),
    recommendedExercisesPerMuscle: new Map<Muscle, Exercise[]>(),
  };

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
      background: ${color.bg.card.dark};

      h1,
      h2 {
        font-size: ${dim.text.default};
        width: 100%;
      }
      ul {
        align-self: flex-start;
      }
      .muscle-groups {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: ${dim.spacing.m};
        > div {
          background: ${color.bg.card.alt};
          border-radius: ${dim.radius};
          h2 {
            text-align: center;
          }
          > div {
            > div {
              padding: ${dim.spacing.xs} ${dim.spacing.s};
              display: flex;
              justify-content: space-between;
            }
            > div:nth-child(2n + 1) {
              background: ${color.bg.card.default};
            }
            > div:last-child {
              border-bottom-left-radius: ${dim.radius};
              border-bottom-right-radius: ${dim.radius};
            }
          }
        }
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
    const groupedMuscles = new Set(
      this.config.muscleGroups.flatMap((x) => Array.from(x.muscles))
    );
    const ungroupedMuscles = Object.values(Muscle).filter(
      (muscle) => !groupedMuscles.has(muscle)
    );
    return html`
      <h1>Muscle groups for last ${this.config.periodLength} days.</h1>
      ${this.renderMuscleChart()}
      <div class="muscle-groups">
        ${this.config.muscleGroups.map(
          (x) => html`
            <div>
              <h2>${x.name}</h2>
              ${this.renderLastPeriodMuscleGroup(x)}
            </div>
          `
        )}
        ${ungroupedMuscles.length > 0
          ? html` <div>
              <h2>Ungrouped</h2>
              ${this.renderLastPeriodMuscleGroup({
                name: "Ungrouped",
                muscles: new Set(ungroupedMuscles),
              })}
            </div>`
          : nothing}
      </div>
      ${this.renderAdvice()}
    `;
  }

  renderLastPeriodMuscleGroup(group: MuscleGroup) {
    return html`<div>
      ${Array.from(this.lastPeriod.effort)
        .filter((x) => group.muscles.has(x[0]))
        .sort((a, b) => {
          return (a[1].fractionalSets ?? 0) - (b[1].fractionalSets ?? 0);
        })
        .map(([muscle, effort]) => {
          return html`<div>
            <div>${muscle} - ${effort.fractionalSets} / ${effort.target}</div>
            <div>${this.renderAdviceForMuscle(muscle)}</div>
          </div>`;
        })}
    </div>`;
  }

  renderMuscleChart() {
    return html`<muscle-chart
      .displayStyle=${DisplayStyle.COMPLETION}
      .effort=${this.lastPeriod.effort}
    ></muscle-chart>`;
  }

  renderAdviceForMuscle(muscle: Muscle) {
    const recommendedExercises =
      this.lastPeriod.recommendedExercisesPerMuscle.get(muscle);
    if (!recommendedExercises?.length) {
      return nothing;
    }
    return html`${recommendedExercises[0].shorthand}`;
  }

  renderAdvice() {
    const muscles = Array.from(this.lastPeriod.effort)
      .sort((a, b) => {
        return (a[1].fractionalSets ?? 0) - (b[1].fractionalSets ?? 0);
      })
      .map(([muscle, _effort]) => muscle);
    const exerciseScore = new Map<Exercise, number>();
    for (const muscle of muscles) {
      const fractionalSets =
        this.lastPeriod.effort.get(muscle)?.fractionalSets ?? 0;
      const target = this.lastPeriod.effort.get(muscle)?.target ?? 1;
      const coefficient = (target - fractionalSets) / target;
      for (const exercise of exerciseCache.exercisesForMuscle(muscle)) {
        console.log(`${exercise.shorthand} for ${muscle} coeff ${coefficient}`);
        exerciseScore.set(
          exercise,
          (exerciseScore.get(exercise) ?? 0) + 1 * coefficient
        );
      }
      for (const exercise of exerciseCache.auxiliaryExercisesForMuscle(
        muscle
      )) {
        exerciseScore.set(
          exercise,
          (exerciseScore.get(exercise) ?? 0) + 0.5 * coefficient
        );
      }
    }
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
      if (sinceDays > this.config.periodLength) {
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
      effort.set(muscle, {
        fractionalSets,
        target: this.config.periodTarget.get(muscle),
      });
    });

    const muscles = Array.from(effort)
      .sort((a, b) => {
        return (a[1].fractionalSets ?? 0) - (b[1].fractionalSets ?? 0);
      })
      .map(([muscle, _effort]) => muscle);
    const exerciseScore = new Map<Exercise, number>();
    for (const muscle of muscles) {
      const fractionalSets = effort.get(muscle)?.fractionalSets ?? 0;
      const target = effort.get(muscle)?.target ?? 1;
      const coefficient = (target - fractionalSets) / target;
      for (const exercise of exerciseCache.exercisesForMuscle(muscle)) {
        exerciseScore.set(
          exercise,
          (exerciseScore.get(exercise) ?? 0) + 1 * coefficient
        );
      }
      for (const exercise of exerciseCache.auxiliaryExercisesForMuscle(
        muscle
      )) {
        exerciseScore.set(
          exercise,
          (exerciseScore.get(exercise) ?? 0) + 0.5 * coefficient
        );
      }
    }
    const rankedExercises = Array.from(exerciseScore)
      .sort((a, b) => {
        return b[1] - a[1];
      })
      .map(([exercise, _score]) => exercise);
    const recommendedExercisesPerMuscle = new Map<Muscle, Exercise[]>();
    for (const muscle of muscles) {
      const exercisesForMuscle = rankedExercises.filter((exercise) => {
        for (const m of exercise.target) {
          if (m === muscle) {
            return true;
          }
        }
        return false;
      });
      recommendedExercisesPerMuscle.set(muscle, exercisesForMuscle);
    }
    this.lastPeriod = { effort, recommendedExercisesPerMuscle };
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "periodization-chart": PeriodizationChart;
  }
}
