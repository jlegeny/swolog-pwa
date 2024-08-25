import { LitElement, css, html } from 'lit'
import { customElement, property, state, query } from 'lit/decorators.js'
import { consume } from '@lit/context';
import { Task } from '@lit/task';

import { type IDB, dbContext } from './indexdb-context';
import { Lift, Log } from './lib/data';
import { LiftCache } from './lib/lift-cache';
import { getLineOnCursor } from './lib/textarea-utils';

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

  @state() cache: LiftCache = new LiftCache([]);

  @query('#history') historyTextArea?: HTMLTextAreaElement;
  @query('#current') currentTextArea?: HTMLTextAreaElement;

  parser = new ComlinkWorker<typeof import("./worker-parser")>(
    new URL("./worker-parser", import.meta.url), {}
  );

  render() {
    return html`
    <header><button @click=${this.saveLog}>Save</button></header>
    <main>
      ${this._parseLogTask.render({
      pending: () => html`
        <textarea id="history" disabled>Loading...</textarea>
        <textarea id="current" disabled>Loading...</textarea>
        `,
      complete: ([historyText, currentText]) =>
        html`
        <textarea id="history" @selectionchange=${async () => {
            if (this.historyTextArea) {
              await this.processLineAtCursor(this.historyTextArea, false);
            }
          }} @input=${async () => {
            // TODO: Update cache with new results.
          }}>${historyText}</textarea>
        <textarea id="current" @click=${async () => {
            if (this.currentTextArea) {
              await this.processLineAtCursor(this.currentTextArea, true);
            }
          }}>${currentText}</textarea>
        `
    })
      }
    </main>
    `
  }

  static styles = css`
  :host {
    display: block;
  }
  header {
    background-color: var(--color-primary);
    color: var(--text-contrast);
    line-height: 1rem;
  }
  main {
    height: calc(100% - 1rem);
    display: flex;
    flex-direction: column;
    background-color: violet;
    textarea {
      resize: none;
      border: none;
      font-family: monospace;
      background-color: var(--color-bg-textarea);
    }
    #history {
      flex: 1;
      border-bottom: 1px solid var(--color-primary);
    }
    #current {
      height: 200px;
    }
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

  private async processLineAtCursor(textArea: HTMLTextAreaElement, asOfToday: boolean) {
    const { line, text } = getLineOnCursor(textArea);
    if (!text) {
      return;
    }
    console.log(`Finding previous lift for`);
    let date: Date | undefined;
    if (asOfToday) {
      date = new Date();
      date.setHours(0, 0, 0, 0);
    } else {
      date = this.cache.getDateAtLine(line);
    }
    if (!date) {
      console.debug(` .. no date`);
      return;
    }
    console.debug(` .. date ${date}`);
    try {
      const lift = await this.parser.parseLift(text);
      console.info(` .. lift ${lift.shorthand}`);
      const previousLift = this.cache.findPreviousLift(lift.shorthand, date);
      console.info(' .. found previous lift', previousLift);
    } catch (e: unknown) {
      console.error(e);
    }
  }

  private _parseLogTask = new Task(this, {
    task: async ([log], { }) => {
      const { sessions, errors, metadata } = await this.parser.parseLog(log);
      console.debug(sessions, errors, metadata);
      this.cache = new LiftCache(sessions);

      // We split the log in two if
      // - there is at least one previous session in the log
      // - this last session has happened today
      const lastSession = this.cache.lastSession;
      if (!lastSession || !metadata.lastSessionStartLine) {
        return [log.text, ''];
      }
      const isToday = (new Date()).setHours(0, 0, 0, 0) == lastSession.date.setHours(0, 0, 0, 0);
      if (!isToday) {
        return [log.text, ''];
      }
      const lines = this.log.text.split(/\n/);
      const currentText = lines.splice(metadata.lastSessionStartLine).join('\n');
      const historyText = lines.join('\n');

      return [historyText, currentText];
    },
    args: () => [this.log]
  });

  override updated() {
    if (this.historyTextArea) {
      this.historyTextArea.scrollTop = this.historyTextArea.scrollHeight;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'workout-view': WorkoutView
  }
}
