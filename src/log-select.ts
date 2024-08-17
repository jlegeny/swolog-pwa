import { LitElement, css, html } from 'lit'
import { customElement, property, queryAsync, state } from 'lit/decorators.js'
import { consume } from '@lit/context';
import { type IDB, dbContext } from './indexdb-context.js';
import { Task } from '@lit/task';
import { Log } from './data';

import './card-container';

/**
 * Workout selector, loads the available logs from IndexDB or other sources.
 */
@customElement('log-select')
export class LogSelect extends LitElement {

  @consume({ context: dbContext })
  @state()
  private db?: IDB;

  @state() private logId: string | undefined;

  @queryAsync('#new-log-name') newLogNameInput?: HTMLInputElement;

  render() {
    return html`
    <card-container>
      <h1>Create a new workout log</h1>
      <input id="new-log-name" type="text"/> <button @click=${this.createLog}>Create</button>
    </card-container>
    <card-container>
    ${this.db ? this.renderLogs() : this.renderWaitingScreen()}
    </card-container>
   `;
  }

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--size-space-m);
    }
  `;

  private renderWaitingScreen() {
    return html`<p>Connecting to database...</p>`;
  }

  private renderLogs() {
    return this._listLogsTask.render({
      pending: () => html`<p>Loading logs...</p>`,
      complete: (logs) =>
        logs?.length ? html`
          <h1>Open an existing workout</h1>
          <ul>
            ${logs.map(log => html`<li @click=${(e: Event) => { this.logId = log.id; }}>${log.id}</li>`)}
          </ul>
          ` : html`Logs database is empty`,
      error: (e) => html`<p>Error: ${e}</p>`
    });
  }

  private async createLog() {
    try {
      const name = (await this.newLogNameInput)?.value;
      if (!name) {
        return;
      }
      const log: Log = {
        id: name,
        text: "",
      }
      await this.db?.insert("Log", log);
      await this._listLogsTask.run();
      this.logId = log.id;
      // this._dispatchSelectedLog(log);
    } catch (e: unknown) {
      console.error(e);
    }
  }


  private _dispatchSelectedLog(log: Log) {
    const options = {
      detail: { log },
      bubbles: true,
      composed: true,
    };
    this.dispatchEvent(new CustomEvent('selected-log', options));

  }

  private _listLogsTask = new Task(this, {
    task: async ([], { signal }) => {
      if (!this.db) {
        throw new Error("Database not connected");
      }
      try {
        const logs = await this.db.selectAll<Log>('Log');
        return logs;
      } catch (e: unknown) {
        console.error(e);
      }
      return [];
    },
    args: () => []
  });

  override connectedCallback(): void {
    super.connectedCallback();

    new Task(this, {
      task: async ([logId]) => {
        if (!this.db) {
          throw new Error("Database not connected");
        }
        if (!logId) {
          return;
        }
        console.log(`Loading workout log ${logId}`);
        const log = await this.db.selectById<Log>('Log', logId);
        console.log(`Loaded`, log);
        if (log) {
          this._dispatchSelectedLog(log);
        }
      },
      args: () => [this.logId],
    });
  }

}

declare global {
  interface HTMLElementTagNameMap {
    'log-select': LogSelect
  }
}
