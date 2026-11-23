import { diaspora } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

const diasporaIdRegex = /"diaspora_id":"([^"@]+)@/

const feeds = withHintLabels(diaspora.feeds)

export const isDiasporaHtml = (content: string): boolean => {
  return content.includes('Diaspora.Page')
}

export type DiasporaPage = { username: string }

const getDiasporaPage = (url: string, content: string | undefined): DiasporaPage | undefined => {
  const page = diaspora.pages.read(url, { isAnyHost: true })

  if (!page) {
    return
  }

  // A `/people/{guid}` page is keyed by guid, and the feed by username. The page carries the
  // username in its diaspora ID.
  if (page.key !== 'people') {
    return { username: page.params.username }
  }

  const linkedUsername = content?.match(diasporaIdRegex)?.[1]

  if (!linkedUsername) {
    return { username: page.params.username }
  }

  // The id is page text, which can hold a `/`, so the table encodes it as one segment.
  return { username: linkedUsername }
}

export const diasporaHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!hasMarker(content, headers, { html: isDiasporaHtml })) {
      return false
    }

    return diaspora.pages.read(url, { isAnyHost: true }) !== undefined
  },

  resolve: (url, content) => {
    const page = getDiasporaPage(url, content)
    const pageFeeds = feeds.forUrl(url)

    if (!page || !pageFeeds) {
      return []
    }

    return [pageFeeds.getFeedEntry('posts', { username: page.username })]
  },
}
