import { publii } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { hasMarker, hasMetaContent } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

const quotedUrlRegex = /["'](?<url>https?:\/\/[^"'\s]+)/gi

const feeds = withHintLabels(publii.feeds)

const hasGenerator = (content: string): boolean => {
  return hasMetaContent(content, 'generator', 'Publii')
}

// Publii links its media by absolute URL under the site root.
const getMediaRoot = (content: string | undefined): string | undefined => {
  for (const match of content?.matchAll(quotedUrlRegex) ?? []) {
    const media = publii.pages.read(match.groups?.url ?? '', { isAnyHost: true })

    if (media?.key === 'media') {
      return media.params.root
    }
  }
}

export const isPubliiHtml = (content: string): boolean => {
  return hasGenerator(content) || getMediaRoot(content) !== undefined
}

export type PubliiPage = { kind: 'site'; siteUrl: string }

// A media link names the site root only when the page sits under it. One on another host is a CDN
// or an image of another site.
const getMediaSiteUrl = (url: string, content: string | undefined): string | undefined => {
  const siteUrl = getMediaRoot(content)

  if (!siteUrl || !publii.pages.read(url, { root: siteUrl })) {
    return
  }

  return siteUrl
}

// Without a media link that holds the page, the generator meta alone puts the site at the origin.
export const getPubliiPage = (url: string, content: string | undefined): PubliiPage | undefined => {
  const siteUrl = getMediaSiteUrl(url, content)

  if (siteUrl) {
    return { kind: 'site', siteUrl }
  }

  if (!content || !hasGenerator(content)) {
    return
  }

  return { kind: 'site', siteUrl: new URL(url).origin }
}

export const publiiHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!content || !hasMarker(content, headers, { html: isPubliiHtml })) {
      return false
    }

    return getPubliiPage(url, content) !== undefined
  },

  resolve: (url, content) => {
    const page = getPubliiPage(url, content)
    const pageFeeds = feeds.forUrl(url)

    if (!page || !pageFeeds) {
      return []
    }

    return [
      pageFeeds.getFeedEntry('posts', { root: page.siteUrl }, 'atom'),
      pageFeeds.getFeedEntry('posts', { root: page.siteUrl }, 'json'),
    ]
  },
}
