import { LitElement, css, nothing, html, PropertyValues } from "lit";
import { customElement, state, property } from "lit/decorators.js";
import { consume } from "@lit/context";
import { Task } from "@lit/task";

import { cacheContext } from "./lift-cache-context";

import { Temporal } from "temporal-polyfill";
import { Lift } from "./lib/data";
import { LiftCache } from "./lift-cache-context";

import * as color from "./css/colors";
import * as dim from "./css/dimensions";
import * as mixin from "./css/mixins";

@customElement("lift-details")
export class LiftDetails extends LitElement {
  @consume({ context: cacheContext })
  @state()
  private cache?: LiftCache;

  @property({ attribute: false }) lift?: Lift;
  @property({ type: Boolean }) expanded = false;

  @state() previousLift?: Lift;

  override render() {
    if (!this.lift) {
      return nothing;
    }
    return html`
      <div ?data-expanded=${this.expanded} class="summary">
        <div class="title">
          <span>${this.lift.shorthand}</span
          ><span @click=${this._dispatchExpandCollapse}
            >${this.expanded ? "Less" : "More"}</span
          >
        </div>
        <time>${this.renderRelativeDate()}</time>
        <div>${this.renderPreviousLift()}</div>
      </div>
      ${this.renderHistory()}
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

    .history {
      flex: 1 1;
      overflow-y: auto;
    }
    ul {
      padding: 0;
      margin: 0;
    }
    ul li {
      font-size: 1rem;
      padding: ${dim.spacing.xs};
    }
    ul li:nth-child(2n + 1) {
      background: ${color.bg.card.alt};
    }
    ul li[data-current] {
      font-weight: bold;
      background-color: ${color.bg.card.dark};
    }
    ul li div div:nth-child(1) {
      color: ${color.text.aux};
      font-size: ${dim.text.aux};
    }
  `;

  renderRelativeDate() {
    if (!this.lift) {
      return nothing;
    }
    if (!this.previousLift?.date) {
      return nothing;
    }
    let timeDiff: Temporal.Duration | undefined = undefined;

    const previousLiftDate = Temporal.PlainDate.from(this.previousLift.date);

    const isSelectedLiftToday =
      Temporal.Now.plainDateISO().toString() === this.lift.date;
    if (isSelectedLiftToday) {
      const now = Temporal.Now.plainDateISO();
      timeDiff = previousLiftDate.until(now);
      return html`<div>${timeDiff.days} days ago</div>`;
    } else if (this.lift.date) {
      const selectedLiftDate = Temporal.PlainDate.from(this.lift.date);
      timeDiff = previousLiftDate.until(selectedLiftDate);
      return html`<div>${timeDiff.days} days before</div>`;
    }
  }

  renderPreviousLift() {
    if (!this.previousLift) {
      return nothing;
    }
    return html`<span>${this.previousLift.work}</span>`;
  }

  private renderHistory() {
    if (!this.lift) {
      return nothing;
    }
    if (!this.expanded) {
      return nothing;
    }
    return html`<div class="history">
      ${this._getLiftHistoryTask.render({
        pending: () => {
          return html`Loading...`;
        },
        complete: (lifts: Lift[]) => {
          return html`<ul>
            ${lifts.reversedMap((lift) => {
              return html`<li ?data-current=${lift.date == this.lift?.date}>
                <div>
                  <div>${lift.date}</div>
                  <div>${lift.work}</div>
                </div>
              </li>`;
            })}
          </ul>`;
        },
      })}
    </div>`;
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

  // Tasks

  private _getLiftHistoryTask = new Task(this, {
    task: async ([lift], {}) => {
      if (!lift || !this.cache) {
        return [];
      }
      return this.cache.liftHistory(lift);
    },
    args: () => [this.lift],
  });

  protected willUpdate(_changedProperties: PropertyValues): void {
    if (!this.cache) {
      return;
    }
    if (!this.lift?.date) {
      return;
    }
    this.previousLift = this.cache.findPreviousLift(
      this.lift.shorthand,
      this.lift.date
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "lift-details": LiftDetails;
  }
}
