import { defaultFetchFn } from '../../common/discover/utils.js'
import type { DiscoverInput } from '../../common/types.js'
import { normalizeUrl } from '../../common/utils.js'
import { discoverFaviconsFromApi } from '../api/index.js'
import { discoverFaviconsFromGuess } from '../guess/index.js'
import { discoverFaviconsFromHeaders } from '../headers/index.js'
import { discoverFaviconsFromHtml } from '../html/index.js'
import { discoverFaviconsFromManifest } from '../manifest/index.js'
import type { DiscoverFaviconsOptions, FaviconResult } from './types.js'
import { deduplicateResults, normalizeInput } from './utils.js'

export const discoverFavicons = async (
  input: DiscoverInput,
  options: DiscoverFaviconsOptions = {},
): Promise<Array<FaviconResult>> => {
  const {
    methods = ['html', 'manifest', 'headers', 'guess'],
    fetchFn = defaultFetchFn,
    normalizeUrlFn = normalizeUrl,
  } = options

  const normalizedInput = await normalizeInput(input, fetchFn)
  const results: Array<FaviconResult> = []

  if (methods.includes('html') && normalizedInput.content) {
    const htmlResults = discoverFaviconsFromHtml(
      normalizedInput.content,
      normalizedInput.url,
      normalizeUrlFn,
    )
    results.push(...htmlResults)
  }

  if (methods.includes('manifest') && normalizedInput.content) {
    const manifestResults = await discoverFaviconsFromManifest(
      normalizedInput.content,
      normalizedInput.url,
      fetchFn,
      normalizeUrlFn,
    )
    results.push(...manifestResults)
  }

  if (methods.includes('headers') && normalizedInput.headers) {
    const headersResults = discoverFaviconsFromHeaders(
      normalizedInput.headers,
      normalizedInput.url,
      normalizeUrlFn,
    )
    results.push(...headersResults)
  }

  if (methods.includes('guess')) {
    const guessResults = discoverFaviconsFromGuess(normalizedInput.url, options.guess)
    results.push(...guessResults)
  }

  if (methods.includes('api')) {
    const apiResults = discoverFaviconsFromApi(normalizedInput.url, options.api)
    results.push(...apiResults)
  }

  return deduplicateResults(results)
}
