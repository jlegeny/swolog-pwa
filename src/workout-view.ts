import { LitElement, PropertyValues, css, html } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'

import { parseLog } from './parser';
import { Log } from './data';
import './card-container';

/**
 * Main App element.
 */
@customElement('workout-view')
export class WorkoutView extends LitElement {

  @property({attribute: false}) log!: Log;

  @state() historyLog: string = '';
  @state() currentLog: string = '';

  render() {
    return html`
    <card-container>
      <textarea></textarea>
      <textarea></textarea>
    </card-container>
    `
  }

  static styles = css`
  :host {
    display: block;
  }
  `;

  protected override willUpdate(_changedProperties: PropertyValues): void {
    if (_changedProperties.has('log')) {
      this.historyLog = this.log.text;
      parseLog(this.log);
    }
  }

}

declare global {
  interface HTMLElementTagNameMap {
    'workout-view': WorkoutView
  }
}
