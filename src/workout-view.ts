import { LitElement, css, html } from 'lit'
import { customElement, property, state, queryAsync } from 'lit/decorators.js'
import { consume } from '@lit/context';
import { Task } from '@lit/task';

import { type IDB, dbContext } from './indexdb-context';
import { parseLog} from './parser';
import { Log} from './data';

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

  @queryAsync('#history') historyTextArea?: Promise<HTMLTextAreaElement>;
  @queryAsync('#current') currentTextArea?: Promise<HTMLTextAreaElement>;

  render() {
    return html`
    <card-container>
      <button @click=${this.saveLog}>Save</button>
      ${this._parseLogTask.render({
        pending: () => html`
        <textarea disabled rows=20></textarea>
        <textarea disabled rows=10></textarea>
        `,
        complete: ([historyText, currentText]) =>
      html`
        <textarea id="history" rows=20>${historyText}</textarea>
        <textarea id="current" rows=10>${currentText}</textarea>
        `
      })
      }
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

  private _parseLogTask = new Task(this, {
    task: async ([log], { }) => {
      const { sessions, errors, metadata } = await parseLog(log);
      console.debug(sessions, errors, metadata);
      if (metadata.lastSessionStartLine) {
        const lines = this.log.text.split(/\n/);
        const currentText = lines.splice(metadata.lastSessionStartLine).join('\n');
        const historyText = lines.join('\n');

        return [historyText, currentText];
      } else {
        return [log.text, ''];
      }
    },
    args: () => [this.log]
  });
}

declare global {
  interface HTMLElementTagNameMap {
    'workout-view': WorkoutView
  }
}
