import { LitElement, PropertyValues, css, html, nothing } from "lit";
import { customElement, property, state, query } from "lit/decorators.js";
import { consume } from "@lit/context";
import { Task } from "@lit/task";
import { Temporal } from "temporal-polyfill";

import { provide } from "@lit/context";

import { cacheContext } from "./lift-cache-context";
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
import "./lift-details";

/**
 * Main App element.
 */
@customElement("workout-view")
export class WorkoutView extends LitElement {
  @consume({ context: dbContext })
  @state()
  private db?: IDB;

  @property({ attribute: false }) log!: Log;

  @provide({ context: cacheContext })
  cache: LiftCache = new LiftCache([]);

  @state() selectedLift?: Lift;
  @state() expandedDetails = false;
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
      <div class="content">
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
        ${this.renderDetails()}
      </div>
    `;
  }

  static styles = css`
    :host {
      display: block;
      height: 100%;
    }

    ${mixin.header}
    ${mixin.textarea}

    .content {
      display: flex;
      flex-direction: column;
      height: 100%;
      position: relative;
    }
    main {
      flex: 1 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
    }
    aside {
      flex: 0 0 6.5rem;
      position: relative;
    }
    .content:has(lift-details[expanded]) history-log {
      pointer-events: none;
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
      margin: ${dim.spacing.xs};
      padding: ${dim.spacing.xs};
    }
    .details {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;

      border: 1px solid ${color.primary};
      height: 6.5rem;
      transition-property: height;
      transition-timing-function: ease-in-out;
      transition-duration: 0.3s;
      overflow: hidden;
    }
    .details:has(lift-details[expanded]) {
      border: 1px solid ${color.active};
      height: 45vh;
      transition-property: height;
      transition-timing-function: ease-in-out;
      transition-duration: 0.3s;
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
        @selected=${async (e: { detail: { line: number } }) => {
          const { line } = e.detail;

          await this.showHintsAtLine(line);
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
          const { text } = getLineOnCursor(textArea);
          if (!text) {
            return;
          }
          await this.showHintsFromText(text);
        }}
        @blur=${() => {
          setTimeout(() => {
            window.scrollTo(0, 0);
          }, 300);
        }}
        @keyup=${async (e: KeyboardEvent) => {
          const textArea = e.target as HTMLTextAreaElement;
          const { text } = getLineOnCursor(textArea);
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
          await this.showHintsFromText(text);
        }}
        @paste=${() => {
          this.modified = true;
        }}
        .value=${currentText}
      ></textarea>
    `;
  }

  private renderDetails() {
    if (this.editing) {
      return nothing;
    }
    return html`
      <aside>
        <card-container class="details">
          <lift-details
            .lift=${this.selectedLift}
            ?expanded=${this.expandedDetails}
            @expand=${() => {
              this.expandedDetails = true;
            }}
            @collapse=${() => {
              this.expandedDetails = false;
            }}
          ></lift-details>
        </card-container>
      </aside>
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
    this._parseLogTask.run();
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

  private async showHintsAtLine(line: number) {
    const lift = await this.cache.liftAtLine(line);
    if (!lift?.date) {
      this.hideHints();
      return;
    }
    this.selectedLift = lift;
  }

  private async showHintsFromText(text: string) {
    let date = Temporal.Now.plainDateISO().toString();
    try {
      const lift = await this.parser.parseLift(text);
      this.selectedLift = {
        ...lift,
        date,
      };
    } catch (e: unknown) {
      this.hideHints();
      if (e instanceof ParseError) {
        console.error(`Parsing error for text ${text} : ${e.toString()}`);
      } else {
        console.error(e);
      }
    }
  }

  private async hideHints() {
    this.selectedLift = undefined;
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
      this.cache.init(sessions);

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
