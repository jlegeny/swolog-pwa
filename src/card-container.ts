import { LitElement, css, html } from 'lit'
import { customElement } from 'lit/decorators.js'

/**
 * A card element.
 */
@customElement('card-container')
export class CardContainer extends LitElement {

  render() {
    return html`
      <slot></slot>
    `
  }

  static styles = css`
    :host {
      display: block;
      border-radius: var(--size-border);
      background-color: var(--color-bg-2);
    }
    ::slotted(h1) {
      color: red;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'card-container': CardContainer
  }
}
