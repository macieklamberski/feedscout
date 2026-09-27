import { discoverFeeds } from '../src/feeds/index.js'
import feeds from './feeds.jsonc'
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

// A kind with no public sample holds `{ "skip": reason }` in place of its URLs.
const checkList: Record<string, Record<string, unknown>> = feeds
const platforms = Object.entries(checkList).map(([platform, kinds]): [string, Array<string>] => {
  const urls = Object.values(kinds).flatMap((entry) => {
    return typeof entry === 'string' || Array.isArray(entry) ? entry : []
  })

  return [platform, urls]
})

await checkPlatforms(platforms, checkUrl)
