import { LitElement, css, html, unsafeCSS } from "lit";
import { customElement, property } from "lit/decorators.js";

import { Muscle, exerciseCache } from "./lib/exercises";

import { classMap } from "lit/directives/class-map.js";

import * as dim from "./css/dimensions";
import * as color from "./css/colors";

export interface Effort {
  primary?: boolean;
  aux?: boolean;
  intensity?: number;
}

/**
 * A card element.
 */
@customElement("muscle-chart")
export class MuscleChart extends LitElement {
  @property({ attribute: false }) effort = new Map<Muscle, Effort>();

  render() {
    return html`<div class="container">
      <!-- <img src="images/figure/silhouette.png"/> -->
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
        background-color: ${color.aux};
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
    const classes = {
      muscle: true,
      [muscle]: true,
      primary: effort?.primary ?? false,
      aux: effort?.aux ?? false,
    };
    return html`<div class="${classMap(classes)}"></div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "muscle-chart": MuscleChart;
  }
}
