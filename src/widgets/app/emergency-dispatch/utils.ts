import type { CallToolResponse } from '@nitrostack/widgets';

/**
 * Tool call results arrive as either OpenAI-style structuredContent or a
 * plain JSON-encoded string in `result` (MCP Apps). Errors surface as
 * `isError: true` rather than a rejected promise, so this normalizes both
 * into either a parsed value or a thrown Error.
 */
export function parseToolResult<T>(response: CallToolResponse): T {
  if (response.isError) {
    throw new Error(response.result || 'Tool call failed');
  }

  if (response.structuredContent !== undefined && response.structuredContent !== null) {
    return response.structuredContent as T;
  }

  try {
    return JSON.parse(response.result) as T;
  } catch {
    throw new Error('Failed to parse tool response');
  }
}
