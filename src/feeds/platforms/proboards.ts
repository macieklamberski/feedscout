import { isHostOrSubdomainOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type ProboardsUrl = { kind: 'forum'; forum: string } | { kind: 'customDomain' }

const domains = ['proboards.com', 'freeforums.net', 'boards.net']

const forumFeeds = definePlatformFeeds(
  [{ key: 'proboards:posts', template: 'https://{forum}.{domain}/rss/public' }],
  { domains },
)

// A forum on its own domain is known only by its markers, so its feed is built but not claimed.
const customDomainFeeds = definePlatformFeeds(
  [{ key: 'proboards:posts', template: '{scheme}://{host}/rss/public' }],
  { domains },
)

// Every forum page loads the core script from storage.proboards.com or storage.forums.net, on a
// custom domain too.
export const isProboardsHtml = (content: string): boolean => {
  return content.includes('/forum/js/proboards.combined_')
}

export const parseProboardsUrl = (url: string): ProboardsUrl | undefined => {
  if (!isHostOrSubdomainOf(url, domains)) {
    return { kind: 'customDomain' }
  }

  const forum = getTenantSubdomain(url, domains)

  if (!forum) {
    return
  }

  return { kind: 'forum', forum }
}

export const proboardsHandler: PlatformHandler = {
  match: (url, content, headers) => {
    const parsed = parseProboardsUrl(url)

    if (parsed?.kind === 'customDomain') {
      return hasMarker(content, headers, { html: isProboardsHtml })
    }

    return parsed !== undefined
  },

  resolve: (url) => {
    const parsed = parseProboardsUrl(url)

    if (!parsed) {
      return []
    }

    if (parsed.kind === 'customDomain') {
      const customDomainPage = customDomainFeeds.forUrl(url)

      if (!customDomainPage) {
        return []
      }

      return [customDomainPage.getFeedEntry('proboards:posts')]
    }

    const forumPage = forumFeeds.forUrl(url)

    if (!forumPage) {
      return []
    }

    return [forumPage.getFeedEntry('proboards:posts', { forum: parsed.forum })]
  },

  getFeedHint: forumFeeds.getFeedHint,
}
