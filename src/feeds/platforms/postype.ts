import { getPathSegments, isHostOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

// A channel subdomain redirects to www.postype.com/@{channel}.
export type PostypeUrl =
  | { kind: 'channel'; channel: string }
  | { kind: 'post'; channel: string }
  | { kind: 'subdomain'; channel: string }

const domains = ['postype.com']
export const hosts = ['postype.com', 'www.postype.com']

// A subdomain feed redirects to the channel feed on www.postype.com, and http to https.
const feeds = definePlatformFeeds(
  [
    { key: 'postype:posts', template: 'https://www.postype.com/@{channel}/rss' },
    { key: 'postype:posts', template: '{scheme}://{host}/rss' },
  ],
  { domains },
)

export const parsePostypeUrl = (url: string): PostypeUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  if (isHostOf(parsedUrl, hosts)) {
    const [channelHandle, postSlug] = getPathSegments(parsedUrl)

    // length: keeps a bare @ with no channel after it out
    if (!channelHandle?.startsWith('@') || channelHandle.length < 2) {
      return
    }

    if (postSlug) {
      return { kind: 'post', channel: channelHandle.slice(1) }
    }

    return { kind: 'channel', channel: channelHandle.slice(1) }
  }

  const subdomain = getTenantSubdomain(parsedUrl, domains)

  if (!subdomain) {
    return
  }

  return { kind: 'subdomain', channel: subdomain }
}

export const postypeHandler: PlatformHandler = {
  match: (url) => {
    return parsePostypeUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parsePostypeUrl(url)

    if (!parsed) {
      return []
    }

    if (parsed.kind === 'subdomain') {
      const page = feeds.forUrl(url)

      if (!page) {
        return []
      }

      return [page.getFeedEntry('postype:posts')]
    }

    return [feeds.getFeedEntry('postype:posts', { channel: parsed.channel })]
  },

  getFeedHint: feeds.getFeedHint,
}
