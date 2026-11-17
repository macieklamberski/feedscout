import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, getScriptDirectory, hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: recent-changes.
// Handler needed for: history.

export type MediawikiPage = { scriptRoot: string; pageName?: string }

const rsdHrefRegex = /\/api\.php\?action=rsd$/i
const pageNameRegex = /"wgPageName":("(?:[^"\\]|\\.)*")/
const namespaceNumberRegex = /"wgNamespaceNumber":(-?\d+)/

// A wiki runs on its own domain, under its script path, and is known only by its marker, so its
// feeds are built here but not claimed. Its pages link a title encoded as a form, as
// `title=Talk%3AMain+Page`.
const feeds = definePlatformFeeds([
  {
    key: 'mediawiki:history',
    main: '{root}/index.php?title={title}&action=history&feed=atom',
    format: 'atom',
    queryEncoding: 'form',
  },
  {
    key: 'mediawiki:recent-changes',
    main: '{root}/index.php?title=Special:RecentChanges&feed=atom',
    format: 'atom',
    queryEncoding: 'form',
  },
])

// Core prints the RSD link to `api.php` in every page head, whatever the skin.
const getRsdHref = (content: string | undefined): string | undefined => {
  const link = findElement(content, (element) => {
    return (
      element.name === 'link' &&
      element.attribs.rel === 'EditURI' &&
      rsdHrefRegex.test(element.attribs.href ?? '')
    )
  })

  return link?.attribs.href
}

export const isMediawikiHtml = (content: string): boolean => {
  return getRsdHref(content) !== undefined
}

// Core prints the page's config into `RLCONF` in every page head, whatever the URL rewriting.
// Special (-1) and Media (-2) are virtual namespaces with no revisions, so no history feed.
const getPageName = (content: string | undefined): string | undefined => {
  const namespaceNumber = content?.match(namespaceNumberRegex)?.[1]

  if (namespaceNumber && Number(namespaceNumber) < 0) {
    return
  }

  const pageName = content?.match(pageNameRegex)?.[1]

  if (!pageName) {
    return
  }

  return JSON.parse(pageName)
}

const getMediawikiPage = (url: string, content: string | undefined): MediawikiPage | undefined => {
  const rsdHref = getRsdHref(content)

  if (!rsdHref) {
    return
  }

  // The RSD link is often protocol-relative and names the wiki's canonical server.
  const { origin } = new URL(url)
  const scriptPath = getScriptDirectory(new URL(rsdHref, url).pathname)

  return { scriptRoot: `${origin}${scriptPath}`, pageName: getPageName(content) }
}

export const mediawikiHandler: PlatformHandler = {
  match: (_url, content, headers) => {
    return hasMarker(content, headers, { html: isMediawikiHtml })
  },

  resolve: (url, content) => {
    const page = getMediawikiPage(url, content)
    const pageFeeds = feeds.forUrl(url)

    if (!page || !pageFeeds) {
      return []
    }

    const params = { root: page.scriptRoot, title: page.pageName }

    if (!page.pageName) {
      return [pageFeeds.getFeedEntry('mediawiki:recent-changes', params, 'atom')]
    }

    return [
      pageFeeds.getFeedEntry('mediawiki:history', params, 'atom'),
      pageFeeds.getFeedEntry('mediawiki:recent-changes', params, 'atom'),
    ]
  },
}
