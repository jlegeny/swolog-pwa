import { LitElement, css, html } from 'lit'
import { customElement, queryAsync, state } from 'lit/decorators.js'
import { consume } from '@lit/context';

import { type IDB, dbContext } from './indexdb-context';
import { Task } from '@lit/task';
import { Log } from './lib/data';
import * as mixin from './css/mixins';
import * as dim from './css/dimensions';
import * as color from './css/colors';

import './card-container';

/**
 * Workout selector, loads the available logs from IndexDB or other sources.
 */
@customElement('log-select')
export class LogSelect extends LitElement {

  @consume({ context: dbContext })
  @state()
  private db?: IDB;

  @state() private logId?: string;

  @queryAsync('#new-log-name') newLogNameInput?: Promise<HTMLInputElement>;

  render() {
    return html`
    <header>
      <span></span><h1>Swolog</h1><span></span>
    </header>
    <main>
      <card-container>
        <h1>Create a new workout log</h1>
        <div>
          <input id="new-log-name" type="text" placeholder="Log Name..."/> <button @click=${this.createLog}>Create</button>
        </div>
      </card-container>
      <card-container>
        ${this.db ? this.renderLogs() : this.renderWaitingScreen()}
      </card-container>
    </main>
   `;
  }

  static styles = css`
    :host {
      display: block;
    }
    
    ${mixin.header}
    ${mixin.input}
    ${mixin.button}
    
    main {
      display: flex;
      flex-direction: column;
      gap: ${dim.spacing.m};
      padding-top: ${dim.spacing.m};
      padding-left: ${dim.spacing.s};
      padding-right: ${dim.spacing.s};
      height:100%;
    }
    
    header h1 {
      padding: 0;
      margin: 0;
      font-size: 1rem;
    }

    button {
      width: 100%;
    }

    card-container {
      width: 100%;
    }
    card-container div {
      display: flex;
      flex-direction: column;
      gap: ${dim.spacing.s};
      padding: ${dim.spacing.xs};
    }
    ul {
      padding: 0;
      margin: 0;
    }
    ul li {
        font-size: 1rem;
        line-height: 2rem;
        padding-left: var(--size-space-xs);
        list-style: none;
     }
    ul li:nth-child(2n + 1) {
          background: ${color.bg.card.alt};
    }
    ul li:last-child {
      border-bottom-left-radius: ${dim.radius};
      border-bottom-right-radius: ${dim.radius};
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
            ${logs.map(log => html`
              <li @click=${() => { this.logId = log.id; }}>${log.id}</li>`)}
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
    task: async ([], { }) => {
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
