import type { FaviconResult } from '../discover/types.js'

export type FaviconApiProvider = (domain: string) => string

export const googleS2 =
  (size = 64): FaviconApiProvider =>
  (domain) => {
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=${size}`
  }

export const duckDuckGo = (): FaviconApiProvider => (domain) => {
  return `https://icons.duckduckgo.com/ip3/${encodeURIComponent(domain)}.ico`
}

const defaultProviders: Array<FaviconApiProvider> = [googleS2(), duckDuckGo()]

export type ApiMethodOptions = {
  providers?: Array<FaviconApiProvider>
}

export const discoverFaviconsFromApi = (
  baseUrl: string,
  options: ApiMethodOptions = {},
): Array<FaviconResult> => {
  const { providers = defaultProviders } = options

  try {
    const domain = new URL(baseUrl).hostname

    return providers.map((provider) => ({
      url: provider(domain),
      method: 'api' as const,
    }))
  } catch {
    return []
  }
}
