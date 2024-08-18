import { LitElement, PropertyValues, css, html } from 'lit'
import { customElement, property, state, queryAsync } from 'lit/decorators.js'
import { consume } from '@lit/context';

import { type IDB, dbContext } from './indexdb-context';
import { parseLog, ParsingMetadata } from './parser';
import { Log, Session } from './data';

import './card-container';

/**
 * Main App element.
 */
@customElement('workout-view')
export class WorkoutView extends LitElement {

  @consume({ context: dbContext })
  @state()
  private db?: IDB;

  @property({ attribute: false }) log!: Log;

  @state() historyLog: string = '';
  @state() currentLog: string = '';

  @queryAsync('#history') historyTextArea?: HTMLTextAreaElement;
  @queryAsync('#current') currentTextArea?: HTMLTextAreaElement;

  render() {
    return html`
    <card-container>
      <button @click=${this.saveLog}>Save</button>
      <textarea id="history" rows=20></textarea>
      <textarea id="current" rows=10></textarea>
    </card-container>
    `
  }

  static styles = css`
  :host {
    display: block;
  }
  card-container {
    display: flex;
    flex-direction: column;
    gap: var(--size-space-m);
  }
  `;

  private async saveLog() {
    const historyText = (await this.historyTextArea)?.value ?? '';
    const currentText = (await this.currentTextArea)?.value ?? '';
    this.log.text = `${historyText}\n${currentText}`;
    try {
      await this.db?.insertOrUpdate<Log>('Log', this.log);
    } catch (e: unknown) {
      console.error(e);
    }
  }

  protected override willUpdate(_changedProperties: PropertyValues): void {
    if (_changedProperties.has('log')) {
      const { sessions, errors, metadata } = parseLog(this.log);
      if (metadata.lastSessionStartLine) {
        const lines = this.log.text.split(/\n/);
        this.currentLog = lines.splice(metadata.lastSessionStartLine).join('\n');
        this.historyLog = lines.join('\n');
      } else {
        this.historyLog = this.log.text;
      }

    }
  }

  protected override async firstUpdated(_changedProperties: PropertyValues): Promise<void> {
    const historyTextArea = await this.historyTextArea;
    const currentTextArea = await this.currentTextArea;
    if (!historyTextArea || !currentTextArea) {
      return;
    }
    historyTextArea.value = this.historyLog;
    currentTextArea.value = this.currentLog;
 
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'workout-view': WorkoutView
  }
}
