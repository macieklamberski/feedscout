// Parse JSON from a fetch response body, which may be a string or a readable stream.
// Throws if the body is not a string or if the JSON is invalid — callers should wrap in try/catch.
// biome-ignore lint/suspicious/noExplicitAny: matches JSON.parse return type
export const parseBodyJson = (body: string | ReadableStream<Uint8Array>): any => {
  return JSON.parse(typeof body === 'string' ? body : '')
}

// Check if a value is a non-empty string.
export const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === 'string' && value.length > 0
}
