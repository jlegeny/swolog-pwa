import { LitElement, css, html } from "lit";
import { customElement } from "lit/decorators.js";

import * as dim from "./css/dimensions";
import * as color from "./css/colors";

/**
 * A card element.
 */
@customElement("card-container")
export class CardContainer extends LitElement {
  render() {
    return html` <slot></slot> `;
  }

  static styles = css`
    :host {
      display: block;
      border-radius: ${dim.radius};
      background-color: ${color.bg.card.default};
      box-sizing: border-box;
      box-shadow: 0 0 10px ${color.shadow};
    }
    ::slotted(h1) {
      color: ${color.primary};
      background-color: ${color.bg.card.header};
      border-top-left-radius: ${dim.radius};
      border-top-right-radius: ${dim.radius};
      font-size: 1rem;
      margin: 0;
      text-align: center;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "card-container": CardContainer;
  }
}
