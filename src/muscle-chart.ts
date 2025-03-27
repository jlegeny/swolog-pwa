import { LitElement, css, html, nothing, unsafeCSS } from "lit";
import { customElement, property } from "lit/decorators.js";

import { Muscle } from "./lib/exercises";

import { classMap } from "lit/directives/class-map.js";

import * as color from "./css/colors";

export interface Effort {
  primary?: boolean;
  aux?: boolean;
  intensity?: number;
  fractionalSets?: number;
  target?: number;
}

export enum DisplayStyle {
  TARGET,
  FRACTIONAL_SETS,
  COMPLETION,
}

/**
 * A card element.
 */
@customElement("muscle-chart")
export class MuscleChart extends LitElement {
  @property({ attribute: false }) effort = new Map<Muscle, Effort>();
  @property({ attribute: false }) displayStyle = DisplayStyle.TARGET;

  render() {
    return html`<div class="container">
      <div class="silhouette"></div>
      ${Object.values(Muscle).map((muscle) =>
        this.renderMuscle(muscle, this.effort.get(muscle))
      )}
    </div>`;
  }

  static styles = [
    ...Object.values(Muscle).map(
      (muscle) => css`
        .${unsafeCSS(muscle)} {
          mask-image: url("images/figure/${unsafeCSS(muscle)}.png");
        }
      `
    ),
    css`
      :host {
        display: block;
        height: 160px;
        width: 160px;
      }
      .container {
        position: relative;
        height: 100%;
        width: 100%;
      }
      .container > div {
        height: 100%;
        width: 100%;
        position: absolute;
        top: 0;
        left: 0;
      }
      .silhouette {
        background-color: ${color.bg.base};
        mask-image: url("images/figure/silhouette.png");
      }
      .muscle {
        background-color: ${color.bg.card.alt};
      }
      .muscle.primary {
        background-color: ${color.primary};
      }
      .muscle.aux {
        background-color: ${color.primary};
        opacity: 50%;
      }
      .muscle.exercised {
        background-color: white;
      }
      .muscle.insufficient {
        background-color:  ${color.primary};
        opacity: 50%;
      }
      .muscle.partial {
        background-color: ${color.primary}
      }
      img {
        height: 100%;
        width: 100%;
        position: absolute;
        top: 0;
        left: 0;
      }
    `,
  ];

  private renderMuscle(muscle: Muscle, effort: Effort | undefined) {
    switch (this.displayStyle) {
      case DisplayStyle.TARGET: {
        const classes = {
          muscle: true,
          [muscle]: true,
          primary: effort?.primary ?? false,
          aux: effort?.aux ?? false,
        };
        return html`<div class="${classMap(classes)}"></div>`;
      }
      case DisplayStyle.FRACTIONAL_SETS: {
        const classes = {
          muscle: true,
          [muscle]: true,
        };
        return html`<div class="${classMap(classes)}"></div>
          <div
            style="opacity: ${(effort?.fractionalSets ?? 0) / 6}"
            class="exercised ${classMap(classes)}"
          ></div>`;
      }
      case DisplayStyle.COMPLETION: {
        if (!effort?.target) {
          return nothing;
        }
        const setsDone = effort.fractionalSets ?? 0;
        const classes = {
          muscle: true,
          [muscle]: true,
          exercised: setsDone >= effort.target,
          partial: setsDone >= 0.6 * effort.target && setsDone < effort.target,
          insufficient: setsDone > 0 && setsDone < 0.6 * effort.target,
        };
        return html`<div class="${classMap(classes)}"></div>
          <div
            class="${classMap(classes)}"
          ></div>`;
      }
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "muscle-chart": MuscleChart;
  }
}
