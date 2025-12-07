import type { PlatformHandler } from '../types.js'

type iTunesLookupResponse = {
  resultCount: number
  results: Array<{
    wrapperType: string
    kind: string
    feedUrl?: string
  }>
}

const hosts = ['podcasts.apple.com', 'itunes.apple.com']

const extractPodcastId = (pathname: string): string | undefined => {
  const match = pathname.match(/\/id(\d+)/)

  return match?.[1]
}

export const applePodcastsHandler: PlatformHandler = {
  match: (url) => {
    const hostname = new URL(url).hostname.toLowerCase()

    return hosts.some((host) => hostname === host || hostname.endsWith(`.${host}`))
  },

  resolve: async (url, fetchFn) => {
    const { pathname } = new URL(url)
    const podcastId = extractPodcastId(pathname)

    if (!podcastId) {
      return []
    }

    try {
      const apiUrl = `https://itunes.apple.com/lookup?id=${podcastId}&entity=podcast`
      const response = await fetchFn(apiUrl)

      if (response.status !== 200 || typeof response.body !== 'string') {
        return []
      }

      const data = JSON.parse(response.body) as iTunesLookupResponse

      if (data.resultCount === 0 || !data.results?.[0]) {
        return []
      }

      const result = data.results[0]

      if (result.wrapperType !== 'track' || result.kind !== 'podcast') {
        return []
      }

      if (!result.feedUrl) {
        return []
      }

      return [result.feedUrl]
    } catch {
      return []
    }
  },
}
