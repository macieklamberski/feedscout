// biome-ignore lint/suspicious/noExplicitAny: Matches JSON.parse return type.
export const parseBodyJson = (body: string | ReadableStream<Uint8Array>): any => {
  return JSON.parse(typeof body === 'string' ? body : '')
}
