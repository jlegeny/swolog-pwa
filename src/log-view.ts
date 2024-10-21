import { LitElement, PropertyValues, css, html, nothing } from "lit";
import { customElement, property, state, query } from "lit/decorators.js";
import { consume } from "@lit/context";
import { Task } from "@lit/task";
import { Temporal } from "temporal-polyfill";

import { provide } from "@lit/context";

import { cacheContext } from "./lift-cache-context";
import { type IDB, dbContext } from "./indexdb-context";
import { Lift, Log, Session } from "./lib/data";
import { LiftCache } from "./lib/lift-cache";
import { getLineOnCursor } from "./lib/textarea-utils";
import * as mixin from "./css/mixins";
import * as color from "./css/colors";
import * as dim from "./css/dimensions";
import { Highlight, HistoryLog } from "./history-log";
import { ParseError } from "./lib/parser";
import { exerciseCache } from "./lib/exercises";
import { Annotation } from "./history-log";

import "./card-container";
import "./history-log";
import "./lift-details";
import "./session-details";
import "./log-editor";

enum Mode {
  VIEW,
  WORKOUT,
  EDIT,
  PERIODIZATION,
}

/**
 * Main App element.
 */
@customElement("log-view")
export class LogView extends LitElement {
  @consume({ context: dbContext })
  @state()
  private db?: IDB;

  @property({ attribute: false }) log!: Log;

  @provide({ context: cacheContext })
  cache: LiftCache = new LiftCache([]);

  @state() mode: Mode = Mode.VIEW;
  @state() selectedLift?: Lift;
  @state() selectedSession?: Session;
  @state() expandedDetails = false;
  @state() highlight: Highlight = {};

  @state() modified = false;
  @state() autosaveTimeout?: ReturnType<typeof setTimeout>;

  @query("history-log") historyLog?: HistoryLog;
  @query(".current") currentTextArea?: HTMLTextAreaElement;

  private shortcuts = new Map<string, string>();

  parser = new ComlinkWorker<typeof import("./worker-parser")>(
    new URL("./worker-parser", import.meta.url),
    {}
  );

  render() {
    return html`
      ${this.renderHeader()}
      <div class="content">
        ${this.renderContent()} ${this.renderDetails()} ${this.renderOverlay()}
      </div>
    `;
  }

  static styles = css`
    :host {
      display: block;
      height: 100%;
    }

    ${mixin.reset}
    ${mixin.header}
    ${mixin.textarea}

    header {
      transform: scale(1);
      transition-property: transform, border-radius;
      transition-duration: 0.2s;
      transition-timing-function: ease-in-out;
      border-top-left-radius: 0;
      border-top-right-radius: 0;
    }
    header[data-expanded] {
      border-top-left-radius: ${dim.radius};
      border-top-right-radius: ${dim.radius};
    }
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
      transform: scale(1);
      transform-origin: top;
      transition: transform 0.2s ease-in-out;
    }
    header[data-expanded],
    main[data-expanded] {
      pointer-events: none;
      transform: scale(0.9);
      filter: brightness(65%);
    }
    aside {
      flex: 0 0 calc(6.5rem + 2 * ${dim.spacing.xs});
      position: relative;
    }

    textarea:focus {
      outline: none;
    }
    history-log {
      flex: 1;
      border-bottom: 1px solid ${color.primary};
    }
    textarea.current {
      height: 200px;
    }
    card-container {
      margin: ${dim.spacing.xs};
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
    .details:has(lift-details[expanded]),
    .details:has(session-details[expanded]) {
      border: none;
      height: 85vh;
      transition-property: height;
      transition-timing-function: ease-in-out;
      transition-duration: 0.3s;
    }
    .overlay {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;

      height: 0;
      transition-property: height;
      transition-timing-function: ease-in-out;
      transition-duration: 0.3.s;
      overflow: hidden;
    }
    .overlay[data-expanded] {
      height: 85vh;
      transition-property: height;
      transition-timing-function: ease-in-out;
      transition-duration: 0.3s;
    }
  `;

  private renderHeader() {
    const renderBackButton = () => {
      if (this.mode === Mode.EDIT) {
        return html`<span
          @click=${() => {
            this.modified = false;
            this.mode = Mode.VIEW;
          }}
          >Cancel</span
        >`;
      }
      return html`<span @click=${this._dispatchClosed}>&lt; Back</span>`;
    };
    const renderStartStopButton = () => {
      if (this.mode === Mode.WORKOUT) {
        return html`<button
          @click=${() => {
            this.mode = Mode.VIEW;
            this.saveLog();
          }}
        >
          Stop
        </button>`;
      }
      if (this.mode === Mode.VIEW) {
        return html`<button
          @click=${() => {
            this.mode = Mode.WORKOUT;
            this._parseLogTask.run();
          }}
        >
          Start
        </button>`;
      }
      return nothing;
    };

    const renderEditButton = () => {
      if (this.mode !== Mode.VIEW) {
        return nothing;
      }
      return html`<button @click=${this.editLog}>Edit</button>`;
    };

    const renderSaveButton = () => {
      if (!(this.mode === Mode.EDIT || this.mode === Mode.WORKOUT)) {
        return nothing;
      }
      return html`
        <button ?disabled=${!this.modified} @click=${this.saveLog}>Save</button>
      `;
    };
    return html`
      <header ?data-expanded=${this.expandedDetails || this.mode === Mode.EDIT}>
        <div class="left">${renderBackButton()}</div>
        <div class="right">
          ${renderStartStopButton()} ${renderEditButton()} ${renderSaveButton()}
        </div>
      </header>
    `;
  }

  private renderContent() {
    if (this.mode === Mode.EDIT) {
      return nothing;
    }
    return html`<main ?data-expanded=${this.expandedDetails}>
      ${this._parseLogTask.render({
        pending: () => html`
          <history-log></history-log>
          <textarea id="current" disabled>Loading...</textarea>
        `,
        complete: ({ historyText, currentText, annotations }) => {
          return this.renderLog(historyText, currentText, annotations);
        },
      })}
    </main>`;
  }

  private renderLog(
    historyText: string,
    currentText: string,
    annotations?: Map<number, Annotation[]>
  ) {
    return html`
      <history-log
        .text=${historyText}
        .highlight=${this.highlight}
        .annotations=${annotations}
        @selected=${async (e: { detail: { line: number } }) => {
          const { line } = e.detail;

          await this.showHintsAtLine(line);
        }}
      ></history-log>
      ${this.mode === Mode.WORKOUT
        ? html` <textarea
            class="current"
            autocorrect="off"
            autocapitalize="off"
            autocomplete="off"
            spellcheck="false"
            @click=${async (e: MouseEvent) => {
              const textArea = e.target as HTMLTextAreaElement;
              const { text } = getLineOnCursor(textArea);
              if (!text || text.match(/^\d/)) {
                await this.showSessionHintsFromText(textArea.value);
                return;
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
                this.saveLog({ autosave: true });
              }, 5000);
              await this.showHintsFromText(text);
            }}
            @paste=${() => {
              this.modified = true;
            }}
            .value=${currentText}
          ></textarea>`
        : nothing}
    `;
  }

  private renderDetails() {
    if (this.mode === Mode.EDIT) {
      return nothing;
    }
    if (this.selectedLift) {
      return html`
        <aside>
          <card-container class="details">
            <lift-details
              .lift=${this.selectedLift}
              ?expanded=${this.expandedDetails}
              @expand=${() => {
                const meta = document.querySelector("meta[name=theme-color]");
                meta?.setAttribute("content", color.bg.base.cssText);
                this.expandedDetails = true;
              }}
              @collapse=${() => {
                const meta = document.querySelector("meta[name=theme-color]");
                meta?.setAttribute("content", color.primary.cssText);
                this.expandedDetails = false;
              }}
            ></lift-details>
          </card-container>
        </aside>
      `;
    }
    if (this.selectedSession) {
      return html`<aside>
        <card-container class="details">
          <session-details
            .session=${this.selectedSession}
            ?expanded=${this.expandedDetails}
            @expand=${() => {
              const meta = document.querySelector("meta[name=theme-color]");
              meta?.setAttribute("content", color.bg.base.cssText);
              this.expandedDetails = true;
            }}
            @collapse=${() => {
              const meta = document.querySelector("meta[name=theme-color]");
              meta?.setAttribute("content", color.primary.cssText);
              this.expandedDetails = false;
            }}
          ></session-details>
        </card-container>
      </aside>`;
    }
    return html`<aside></aside>`;
  }

  private renderOverlay() {
    if (this.mode === Mode.EDIT) {
      return html`
        <card-container class="overlay" data-expanded>
          <log-editor
            .log=${this.log}
            @closeeditor=${() => {
              this.mode = Mode.VIEW;
            }}
            @save=${async (e: { detail: { text: string } }) => {
              console.log("SAVE");
              this.log.text = e.detail.text;
              await this._parseLogTask.run();
              this.mode = Mode.VIEW;
            }}
          ></log-editor>
        </card-container>
      `;
    }
    return html`<card-container class="overlay"></card-container>`;
  }

  private async saveLog(options?: { autosave?: boolean }) {
    clearTimeout(this.autosaveTimeout);
    const historyText = this.historyLog?.text ?? "";
    const currentText = this.currentTextArea?.value ?? "";
    this.log.text = `${historyText}${historyText.endsWith("\n") ? '' : "\n"}${currentText}`;
    try {
      await this.db?.insertOrUpdate<Log>("Log", this.log);
      this.modified = false;
    } catch (e: unknown) {
      console.error(e);
    }
    if (!options?.autosave) {
      this._parseLogTask.run();
    }
  }

  private async editLog() {
    // We save the log first so the user does not lose the typed in
    // current workout.
    await this.saveLog();
    this.mode = Mode.EDIT;
  }

  private async showHintsAtLine(line: number) {
    const lift = await this.cache.liftAtLine(line);
    if (lift?.date) {
      this.selectedLift = lift;
      this.selectedSession = undefined;
      return;
    }
    const session = await this.cache.sessionAtLine(line);
    if (session) {
      this.selectedLift = undefined;
      this.selectedSession = session;
      return;
    }
    this.hideHints();
  }

  private async showHintsFromText(text: string) {
    let date = Temporal.Now.plainDateISO().toString();
    try {
      const lift = await this.parser.parseLift(text, this.shortcuts);
      this.selectedLift = {
        ...lift,
        date,
      };
    } catch (e: unknown) {
      this.hideHints();
      if (e instanceof ParseError) {
        console.error(`Parsing error for text ${text} : ${e.toString()}`);
      } else {
        console.error("Unknown error", e);
      }
    }
  }

  private async showSessionHintsFromText(text: string) {
    const lines = text.split("\n");
    const session: Session = {
      date: Temporal.Now.plainDateISO().toString(),
      lifts: [],
      startLine: 1,
      endLine: lines.length,
    };
    for (const line of lines) {
      if (line.match(/^\d/)) {
        continue;
      }
      try {
        const lift = await this.parser.parseLift(line, this.shortcuts);
        session.lifts.push(lift);
      } catch (e: unknown) {}
    }
    console.log(session);
    this.selectedLift = undefined;
    this.selectedSession = session;
  }

  private async hideHints() {
    this.selectedLift = undefined;
    this.selectedSession = undefined;
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
      const { sessions, errors, metadata, shortcuts } =
        await this.parser.parseLog(log);
      console.debug(sessions, errors, metadata);
      this.cache.init(sessions);
      this.shortcuts = shortcuts;

      const annotations = new Map<number, Annotation[]>();
      for (const [line, text] of errors) {
        annotations.set(line, [{ type: "error", text }]);
      }

      // Go through all Lifts in all sessions and issue warnings if needed.
      for (const session of sessions) {
        for (const lift of session.lifts) {
          if (!exerciseCache.getExercise(lift.shorthand)) {
            if (!lift.line) {
              continue;
            }
            if (!annotations.has(lift.line)) {
              annotations.set(lift.line, [
                {
                  type: "warning",
                  text: `[${lift.shorthand}] does not correspond to an exercise`,
                },
              ]);
            }
          }
        }
      }

      // If the workout it not started we don't split the log.
      if (this.mode !== Mode.WORKOUT) {
        return { historyText: log.text, currentText: "", annotations };
      }

      // We split the log in two if
      // - there is at least one previous session in the log
      // - this last session has happened today
      const lastSession = this.cache.lastSession;
      if (!lastSession || !metadata.lastSessionStartLine) {
        return { historyText: log.text, currentText: "", annotations };
      }
      const isToday =
        Temporal.Now.plainDateISO().toString() === lastSession.date;
      if (!isToday) {
        return { historyText: log.text, currentText: "", annotations };
      }
      const lines = this.log.text.split(/\n/);
      const currentText = lines
        .splice(metadata.lastSessionStartLine)
        .join("\n");
      const historyText = lines.join("\n");

      return { historyText, currentText, annotations };
    },
    args: () => [this.log],
  });

  protected override willUpdate(_changedProperties: PropertyValues): void {
    if (this.selectedLift) {
      this.highlight = {
        line: this.selectedLift.line,
      };
    } else if (this.selectedSession) {
      this.highlight = {
        region: {
          start: this.selectedSession.startLine,
          end: this.selectedSession.endLine,
        },
      };
    } else {
      this.highlight = {};
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "log-view": LogView;
  }
}
