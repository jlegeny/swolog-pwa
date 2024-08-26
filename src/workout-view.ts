import { LitElement, css, html, nothing } from 'lit'
import { customElement, property, state, query } from 'lit/decorators.js'
import { consume } from '@lit/context';
import { Task } from '@lit/task';

import { type IDB, dbContext } from './indexdb-context';
import { Lift, Log } from './lib/data';
import { LiftCache } from './lib/lift-cache';
import { getLineOnCursor } from './lib/textarea-utils';
import * as mixin from './css/mixins';
import { Higlight } from './history-log';

import './card-container';
import './history-log';

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
  @state() selectedLift?: Lift;
  @state() previousLift?: Lift;
  @state() highlight: Higlight = {};

  @query('#history') historyTextArea?: HTMLTextAreaElement;
  @query('#current') currentTextArea?: HTMLTextAreaElement;

  parser = new ComlinkWorker<typeof import("./worker-parser")>(
    new URL("./worker-parser", import.meta.url), {}
  );

  render() {
    return html`
    <header>
      <div>
        <span @click=${this._dispatchClosed}>&lt;Back</span>
        <span @click=${this.saveLog}>Save</span>
      </div>
    </header>
    <main>
      ${this._parseLogTask.render({
      pending: () => html`
        <history-log></history-log>
        <textarea id="current" disabled>Loading...</textarea>
        `,
      complete: ([historyText, currentText]) =>
        html`
        <history-log
          .text=${historyText}
          .highlight=${this.highlight}
          @selected=${async (e: { detail: { line: number, text: string } }) => {
            const { line, text } = e.detail;
            console.log(line, text);
            if (!text) {
              await this.hideHints();
              return;
            }
            this.highlight = {
              line
            };
            await this.showHints(line, text, true);
          }}
        ></history-log>
        <textarea id="current"
          @click=${async () => {
            if (this.currentTextArea) {

              const { line, text } = getLineOnCursor(this.currentTextArea);
              if (!text) {
                return;
              }
              await this.showHints(line, text, true);
            }
          }}
          @blur=${() => {
            setTimeout(() => {
              window.scrollTo(0, 0);
            }, 300)
          }}
          .value=${currentText}
          ></textarea>
        ${this.renderHints()}
        <aside>(c) 2024</aside>
        `
    })
      }
    </main>
    `
  }

  static styles = css`
  :host {
    display: block;
    height: 100%;
  }

  ${mixin.header}
  ${mixin.textarea}

  main {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  history-log {
    flex: 1;
    border-bottom: 1px solid var(--color-primary);
  }
  #current {
    height: 200px;
  }
  `;

  private renderHints() {
    if (!this.selectedLift) {
      return nothing;
    }
    const renderPreviousLift = () => {
      if (!this.previousLift) {
        return nothing;
      }
      return html`${this.previousLift.work}`;
    }
    return html`<div>
      <div>${this.selectedLift.shorthand}</div>
      <div>${renderPreviousLift()}</div>
    </div>`;
  }

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

  private async showHints(line: number, text: string, asOfToday: boolean) {
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
      this.selectedLift = lift;
      console.info(` .. lift ${lift.shorthand}`);
      const previousLift = this.cache.findPreviousLift(lift.shorthand, date);
      this.previousLift = previousLift;
      console.info(' .. found previous lift', previousLift);
    } catch (e: unknown) {
      console.error(e);
    }
  }

  private async hideHints() {
    this.selectedLift = undefined;
    this.previousLift = undefined;
  }

  private _dispatchClosed() {
    const options = {
      bubbles: true,
      composed: true,
    };
    this.dispatchEvent(new CustomEvent('close', options));
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
