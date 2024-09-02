import { css } from 'lit'
import * as color from './colors';
import * as dim from './dimensions';

export const input = css`
input {
  display: block;
  font-size: 1rem;
  border: 1px solid ${color.primary};
  background-color: ${color.bg.input};
  width: 100%;
  padding: ${dim.spacing.xs};
  box-sizing: border-box;
  font-family: 'JetBrains Mono', monospace;
}
input:focus {
  border-color: ${color.active};
  outline: none;
}
`;

export const textarea = css`
textarea {
  resize: none;
  border: none;
  font-family: 'JetBrains Mono', monospace;
  background-color: ${color.bg.input};
  border-radius: 0;
  font-size: 1rem;
  caret-color: ${color.primary};
}
`;

export const button = css`
button {
  font-family: 'JetBrains Mono', monospace;
  color: ${color.primary};
  border: 1px solid ${color.primary};
  background-color: ${color.bg.base};
  font-size: 1rem;
  box-shadow: 4px 4px ${color.shadow};
  line-height: 44pt;
  text-transform: uppercase;
}
button:hover {
  position:relative;
  top: 2px;
  left: 2px;
  box-shadow: 1px 1px ${color.shadow};
}
button:active {
  color: ${color.active};
}
`;

export const header = css`
  header {
    display: flex;
    align-items: center;
    background-color: ${color.primary};
    user-select: none;
    color: ${color.text.default};
    height: 44pt;
    justify-content: space-between;
    padding-left: ${dim.spacing.s};
    padding-right: ${dim.spacing.s};
  }
  header div {
    display: flex;
    gap: ${dim.spacing.m};
  }
  header button {
    font-family: "JetBrains Mono", monospace;
    color: ${color.text.default};
    background: transparent;
    border: none;
    font-size: ${dim.text.default};
    padding: ${dim.spacing.xs};
  }
  header button:disabled {
    color: ${color.text.default};
    opacity: 50%;
  }
`;
