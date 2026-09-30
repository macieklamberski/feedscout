import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, findElement, getScriptDirectory, hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers special (html), partly covers page.

const rsdHrefRegex = /\/api\.php\?action=rsd$/
const pageNameRegex = /"wgPageName":("(?:[^"\\]|\\.)*")/
const namespaceNumberRegex = /"wgNamespaceNumber":(-?\d+)/

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

export const mediawikiHandler: PlatformHandler = {
  match: (_url, content, headers) => {
    return hasMarker(content, headers, { html: isMediawikiHtml })
  },

  resolve: (url, content) => {
    const rsdHref = getRsdHref(content)

    if (!rsdHref) {
      return []
    }

    // The RSD link is often protocol-relative and names the wiki's canonical server.
    const { origin } = new URL(url)
    const scriptPath = getScriptDirectory(new URL(rsdHref, url).pathname)
    const scriptUrl = `${origin}${scriptPath}/index.php`
    const pageName = getPageName(content)
    const uris: Array<DiscoverUriEntry> = []

    if (pageName) {
      const historyQuery = new URLSearchParams({ title: pageName, action: 'history', feed: 'atom' })

      uris.push({
        uri: `${scriptUrl}?${historyQuery}`,
        hint: composeHint('mediawiki:history', 'atom'),
      })
    }

    const recentChangesQuery = new URLSearchParams({ title: 'Special:RecentChanges', feed: 'atom' })

    uris.push({
      uri: `${scriptUrl}?${recentChangesQuery}`,
      hint: composeHint('mediawiki:recent-changes', 'atom'),
    })

    return uris
  },
}
