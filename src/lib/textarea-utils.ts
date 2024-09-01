export function getLineOnCursor(textarea: HTMLTextAreaElement) {
  const textLines = textarea.value
    .substring(0, textarea.selectionStart)
    .split("\n");
  const currentLineNumber = textLines.length;
  const rest = textarea.value.substring(textarea.selectionStart);
  return {
    line: currentLineNumber,
    text: `${textLines[currentLineNumber - 1]}${rest.split("\n")[0]}`,
  };
}
