import type { DiscoverFetchFn, DiscoverInput } from '../common/types.js'

export type NormalizedInput = {
  url: string
  content?: string
  headers?: Headers
}

export const normalizeInput = async (
  input: DiscoverInput,
  fetchFn: DiscoverFetchFn,
): Promise<NormalizedInput> => {
  if (typeof input === 'string') {
    const response = await fetchFn(input)

    return {
      url: response.url,
      // TODO: Support streams here.
      content: typeof response.body === 'string' ? response.body : undefined,
      headers: response.headers,
    }
  }

  return {
    url: input.url,
    content: input.content,
    headers: input.headers,
  }
}
