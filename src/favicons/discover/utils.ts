import type { DiscoverFetchFn, DiscoverInput } from '../../common/types.js'

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

export const deduplicateResults = <T extends { url: string }>(results: Array<T>): Array<T> => {
  const seen = new Set<string>()

  return results.filter((result) => {
    if (seen.has(result.url)) {
      return false
    }

    seen.add(result.url)

    return true
  })
}
