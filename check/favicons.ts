import { discoverFavicons } from '../src/favicons/index.js'
import favicons from './favicons.json' with { type: 'json' }
import { checkPlatforms, timeoutMs } from './utils.js'

const checkUrl = async (url: string) => {
  try {
    const results = await discoverFavicons(url, {
      methods: ['platform'],
      fetchFn: async (fetchUrl, options) => {
        const response = await fetch(fetchUrl, {
          method: options?.method ?? 'GET',
          headers: { 'User-Agent': 'Feedscout (https://feedscout.dev)', ...options?.headers },
          signal: AbortSignal.timeout(timeoutMs),
          proxy: process.env.HTTPS_PROXY,
        })

        return {
          headers: response.headers,
          body: await response.text(),
          url: response.url,
          status: response.status,
          statusText: response.statusText,
        }
      },
    })

    const valid = results.filter((result) => result.isValid)

    if (valid.length === 0) {
      return 'No valid favicon found'
    }
  } catch (error) {
    return error instanceof Error ? error.message : 'Unknown error'
  }
}

await checkPlatforms(Object.entries(favicons), checkUrl)
