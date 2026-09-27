import { getSubdomain, isAnyOf, isNonEmptyString } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'
import { parseResponseJson } from '../../favicons/utils.js'
import type { FeedEnricher } from '../types.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

const platform = 'simplecast'

const domains = ['simplecast.com']

// Simplecast's own services, not shows. Some of these names are taken by test shows in the
// site search, so matching them would emit a stranger's feed.
const reservedSlugs = [
  'api',
  'app',
  'assets',
  'audio',
  'blog',
  'cdn',
  'dashboard',
  'docs',
  'embed',
  'feeds',
  'help',
  'image',
  'media',
  'player',
  'status',
  'www',
]

export const simplecastHandler: PlatformHandler = {
  match: (url) => {
    const slug = getSubdomain(url, domains)

    if (!slug) {
      return false
    }

    return !isAnyOf(slug, reservedSlugs)
  },

  // A show page is a script shell that names no feed, and the feed id is not the podcast id.
  resolve: (url) => {
    const slug = getSubdomain(url, domains)

    if (!slug) {
      return []
    }

    return [{ platform, id: slug, url, hint: composeHint('simplecast:podcast') }]
  },
}

// The site search answers the podcast id for a page URL, and the podcast answers its feed URL.
export const simplecastEnricher: FeedEnricher = async (ref, context) => {
  if (ref.platform !== platform) {
    return
  }

  const searchResponse = await context.fetchFn('https://api.simplecast.com/sites/search', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ url: ref.url }),
  })
  const podcastId = parseResponseJson(searchResponse)?.podcast?.id

  if (!isNonEmptyString(podcastId)) {
    return []
  }

  const podcastUrl = `https://api.simplecast.com/podcasts/${encodeURIComponent(podcastId)}`
  const feedUrl = parseResponseJson(await context.fetchFn(podcastUrl))?.feed_url

  if (!isNonEmptyString(feedUrl)) {
    return []
  }

  return [feedUrl]
}
