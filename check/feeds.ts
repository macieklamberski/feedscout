import feeds from './feeds.json' with { type: 'json' }
import { checkPlatforms, timeoutMs } from './utils.js'

const checkUrl = async (url: string) => {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(timeoutMs),
      headers: { 'User-Agent': 'Feedscout (https://feedscout.dev)' },
      proxy: process.env.FETCH_PROXY,
    })

    if (!response.ok) {
      return `HTTP ${response.status}`
    }
  } catch (error) {
    return error instanceof Error ? error.message : 'Unknown error'
  }
}

await checkPlatforms(Object.entries(feeds), checkUrl)
