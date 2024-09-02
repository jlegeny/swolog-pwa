import {
  LitElement,
  PropertyValues,
  TemplateResult,
  css,
  html,
  nothing,
} from "lit";
import { customElement, property, state, query } from "lit/decorators.js";
import { consume } from "@lit/context";
import { Task } from "@lit/task";
import { Temporal } from "temporal-polyfill";

import { type IDB, dbContext } from "./indexdb-context";
import { Lift, Log } from "./lib/data";
import { LiftCache } from "./lib/lift-cache";
import { getLineOnCursor } from "./lib/textarea-utils";
import * as mixin from "./css/mixins";
import * as color from "./css/colors";
import * as dim from "./css/dimensions";
import { Highlight, HistoryLog } from "./history-log";
import { ParseError } from "./lib/parser";

import "./card-container";
import "./history-log";

/**
 * Main App element.
 */
@customElement("workout-view")
export class WorkoutView extends LitElement {
  @consume({ context: dbContext })
  @state()
  private db?: IDB;

  @property({ attribute: false }) log!: Log;

  @state() cache: LiftCache = new LiftCache([]);
  @state() selectedLift?: Lift;
  @state() previousLift?: Lift;
  @state() highlight: Highlight = {};

  @state() editing: boolean = false;
  @state() modified = false;
  @state() autosaveTimeout?: ReturnType<typeof setTimeout>;

  @query("history-log") historyLog?: HistoryLog;
  @query(".current") currentTextArea?: HTMLTextAreaElement;
  @query(".editor") editorTextArea?: HTMLTextAreaElement;

  parser = new ComlinkWorker<typeof import("./worker-parser")>(
    new URL("./worker-parser", import.meta.url),
    {}
  );

  render() {
    return html`
      <header>
        <div class="left">
          ${this.editing
            ? html`<span
                @click=${() => {
                  this.modified = false;
                  this.editing = false;
                }}
                >Cancel</span
              >`
            : html`<span @click=${this._dispatchClosed}>&lt; Back</span>`}
        </div>
        <div class="right">
          ${this.editing
            ? nothing
            : html`<button @click=${this.editLog}>Edit</button>`}
          <button ?disabled=${!this.modified} @click=${this.saveLog}>
            Save
          </button>
        </div>
      </header>
      <main>
        ${this._parseLogTask.render({
          pending: () => html`
            <history-log></history-log>
            <textarea id="current" disabled>Loading...</textarea>
          `,
          complete: ({ historyText, currentText, errors }) => {
            if (this.editing) {
              return html`<textarea
                autocorrect="off"
                autocapitalize="off"
                autocomplete="off"
                spellcheck="false"
                @keyup=${async () => {
                  this.modified = true;
                }}
                @paste=${() => {
                  this.modified = true;
                }}
                class="editor"
              >
${historyText + currentText}</textarea
              >`;
            } else {
              return this.renderLog(historyText, currentText, errors);
            }
          },
        })}
      </main>
    `;
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

    textarea:focus {
      outline: none;
    }
    history-log {
      flex: 1;
      border-bottom: 1px solid ${color.primary};
    }
    textarea.editor {
      height: 300px;
    }
    textarea.current {
      height: 200px;
    }
    card-container {
      border: 1px solid ${color.primary};
      margin: ${dim.spacing.xs};
      padding: ${dim.spacing.xs};
    }
    .hints {
      min-height: 4.5rem;
    }
  `;

  private renderLog(
    historyText: string,
    currentText: string,
    errors?: Map<number, string>
  ) {
    return html`
      <history-log
        .text=${historyText}
        .highlight=${this.highlight}
        .errors=${errors}
        @selected=${async (e: { detail: { line: number; text: string } }) => {
          const { line, text } = e.detail;
          console.log(line, text);
          if (!text) {
            await this.hideHints();
            return;
          }
          await this.showHints(line, text, false);
        }}
      ></history-log>
      <textarea
        class="current"
        autocorrect="off"
        autocapitalize="off"
        autocomplete="off"
        spellcheck="false"
        @click=${async (e: MouseEvent) => {
          const textArea = e.target as HTMLTextAreaElement;
          const { line, text } = getLineOnCursor(textArea);
          if (!text) {
            return;
          }
          await this.showHints(line, text, true);
        }}
        @blur=${() => {
          setTimeout(() => {
            window.scrollTo(0, 0);
          }, 300);
        }}
        @keyup=${async (e: KeyboardEvent) => {
          const textArea = e.target as HTMLTextAreaElement;
          const { line, text } = getLineOnCursor(textArea);
          if (!text) {
            return;
          }
          this.modified = true;
          if (this.autosaveTimeout) {
            clearTimeout(this.autosaveTimeout);
          }
          this.autosaveTimeout = setTimeout(() => {
            this.saveLog();
          }, 5000);
          await this.showHints(line, text, true);
        }}
        @paste=${(e: ClipboardEvent) => {
          this.modified = true;
        }}
        .value=${currentText}
      ></textarea>
      <card-container>
        <div class="hints">${this.renderHints()}</div>
      </card-container>
    `;
  }

  private renderHints() {
    if (!this.selectedLift) {
      return nothing;
    }
    const renderPreviousLift = () => {
      if (!this.previousLift) {
        return nothing;
      }
      return html`${this.previousLift.work}`;
    };

    let relativeTime: TemplateResult | typeof nothing = nothing;
    if (this.previousLift?.date) {
      let timeDiff: Temporal.Duration | undefined = undefined;

      const previousLiftDate = Temporal.PlainDate.from(this.previousLift.date);

      const isSelectedLiftToday =
        Temporal.Now.plainDateISO().toString() === this.selectedLift.date;
      if (isSelectedLiftToday) {
        const now = Temporal.Now.plainDateISO();
        timeDiff = previousLiftDate.until(now);
        relativeTime = html`<div>${timeDiff.days} days ago</div>`;
      } else if (this.selectedLift.date) {
        const selectedLiftDate = Temporal.PlainDate.from(
          this.selectedLift.date
        );
        timeDiff = previousLiftDate.until(selectedLiftDate);
        relativeTime = html`<div>${timeDiff.days} days before</div>`;
      }
    }
    return html`
      <div>${this.selectedLift.shorthand}</div>
      ${relativeTime}
      <div>${renderPreviousLift()}</div>
    `;
  }

  private async saveLog() {
    clearTimeout(this.autosaveTimeout);
    if (this.editing) {
      this.log.text = this.editorTextArea?.value ?? "";
      this._parseLogTask.run();
    } else {
      const historyText = this.historyLog?.text ?? "";
      const currentText = this.currentTextArea?.value ?? "";
      this.log.text = `${historyText}\n${currentText}`;
    }
    try {
      await this.db?.insertOrUpdate<Log>("Log", this.log);
      this.modified = false;
    } catch (e: unknown) {
      console.error(e);
    }
    if (this.editing) {
      this.editing = false;
    }
  }

  private async editLog() {
    // We save the log first so the user does not lose the typed in
    // current workout.
    await this.saveLog();
    this.editing = true;

    setTimeout(() => {
      if (!this.editorTextArea) {
        return;
      }
      this.editorTextArea.focus();
      this.editorTextArea.setSelectionRange(
        this.editorTextArea.value.length,
        this.editorTextArea.value.length
      );
      this.editorTextArea.scrollTop = this.editorTextArea.scrollHeight;
    }, 300);
  }

  private async showHints(line: number, text: string, asOfToday: boolean) {
    let date: string | undefined;
    if (asOfToday) {
      date = Temporal.Now.plainDateISO().toString();
    } else {
      date = this.cache.getDateAtLine(line);
    }
    if (!date) {
      return;
    }
    try {
      const lift = await this.parser.parseLift(text);
      this.selectedLift = {
        ...lift,
        line,
        date,
      };
      const previousLift = this.cache.findPreviousLift(lift.shorthand, date);
      this.previousLift = previousLift;
    } catch (e: unknown) {
      if (e instanceof ParseError) {
        console.error(`Parsing error on line ${line} : ${e.toString()}`);
      } else {
        console.error(e);
      }
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
    this.dispatchEvent(new CustomEvent("close", options));
  }

  private _parseLogTask = new Task(this, {
    task: async ([log], {}) => {
      const { sessions, errors, metadata } = await this.parser.parseLog(log);
      console.debug(sessions, errors, metadata);
      this.cache = new LiftCache(sessions);

      // We split the log in two if
      // - there is at least one previous session in the log
      // - this last session has happened today
      const lastSession = this.cache.lastSession;
      if (!lastSession || !metadata.lastSessionStartLine) {
        return { historyText: log.text, currentText: "", errors };
      }
      const isToday =
        Temporal.Now.plainDateISO().toString() === lastSession.date;
      if (!isToday) {
        return { historyText: log.text, currentText: "", errors };
      }
      const lines = this.log.text.split(/\n/);
      const currentText = lines
        .splice(metadata.lastSessionStartLine)
        .join("\n");
      const historyText = lines.join("\n");

      return { historyText, currentText, errors };
    },
    args: () => [this.log],
  });

  protected override willUpdate(_changedProperties: PropertyValues): void {
    this.highlight = {
      line: this.selectedLift?.line,
    };
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "workout-view": WorkoutView;
  }
}
