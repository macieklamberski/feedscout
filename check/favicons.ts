import { discoverFavicons } from '../src/favicons/index.js'
import favicons from './favicons.json' with { type: 'json' }
import { checkPlatforms, fetchWithFallback } from './utils.js'

const checkUrl = async (url: string) => {
  try {
    const results = await discoverFavicons(url, {
      methods: ['platform'],
      fetchFn: fetchWithFallback,
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
