import { discoverFeeds } from '../src/feeds/index.js'
import feeds from './feeds.json' with { type: 'json' }
import { checkPlatforms, fetchWithFallback } from './utils.js'

const checkUrl = async (url: string) => {
  try {
    const results = await discoverFeeds(url, {
      methods: [],
      fetchFn: fetchWithFallback,
    })

    if (results.length === 0) {
      return 'No valid feed found'
    }
  } catch (error) {
    return error instanceof Error ? error.message : 'Unknown error'
  }
}

await checkPlatforms(Object.entries(feeds), checkUrl)
