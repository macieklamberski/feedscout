import type { Handler } from 'htmlparser2'
import { endsWithAnyOf, includesAnyOf, parseUrl } from 'trousse'
import { matchesAnyOfLinkSelectors } from '../../../common/utils.js'
import type { HtmlMethodContext } from './types.js'

export const handleOpenTag = (
  context: HtmlMethodContext,
  name: string,
  attribs: { [key: string]: string },
  _isImplied?: boolean,
): void => {
  // Capture the first <base href> to resolve relative URLs against (browser semantics).
  if (name === 'base' && context.baseHref === undefined) {
    const href = attribs.href?.trim()

    if (href) {
      context.baseHref = href
    }
  }

  if (name === 'link' && attribs.href) {
    const rel = attribs.rel?.toLowerCase()

    if (!rel) {
      return
    }

    if (matchesAnyOfLinkSelectors(rel, attribs.type, context.options.linkSelectors)) {
      context.discoveredUris.add(attribs.href)
    }
  }

  // Extract anchor elements by href suffix or track for text matching.
  if (name === 'a' && attribs.href) {
    const lowerHref = attribs.href.toLowerCase()

    // Skip if href contains ignored patterns.
    if (includesAnyOf(lowerHref, context.options.anchorIgnoredUris)) {
      context.currentAnchor.href = ''
      context.currentAnchor.text = ''
      return
    }

    // Store href for potential text matching.
    context.currentAnchor.href = attribs.href
    context.currentAnchor.text = ''

    // Check if href ends with any anchor URI pattern.
    if (endsWithAnyOf(lowerHref, context.options.anchorUris)) {
      context.discoveredUris.add(attribs.href)
    }

    // Match feed path segments against the pathname only, so a feed path embedded in a wrapper's
    // query string (e.g. ?add=https://site/rss/x) does not count as a feed.
    if (context.options.anchorPathSegments?.length) {
      const pathname = parseUrl(attribs.href, 'https://feedscout.invalid')?.pathname

      if (pathname && includesAnyOf(pathname, context.options.anchorPathSegments)) {
        context.discoveredUris.add(attribs.href)
      }
    }
  }

  // Match feed-related labels in configured attributes, covering icon-only links with no visible
  // text. This runs both for the anchor itself (e.g. <a title="RSS feed">) and for any descendant
  // element while the anchor is open (e.g. Framer renders the icon as a child element whose only
  // signal is <div data-framer-name="RSS Icon">). Ignored anchors already cleared currentAnchor.href
  // above, so neither they nor their descendants are scanned.
  if (context.currentAnchor.href && context.options.anchorAttributes?.length) {
    for (const attribute of context.options.anchorAttributes) {
      const value = attribs[attribute]

      if (value && includesAnyOf(value, context.options.anchorLabels)) {
        context.discoveredUris.add(context.currentAnchor.href)
        break
      }
    }
  }
}

export const handleText = (context: HtmlMethodContext, text: string): void => {
  // Accumulate text content for current anchor.
  if (context.currentAnchor.href) {
    context.currentAnchor.text += text
  }
}

export const handleCloseTag = (
  context: HtmlMethodContext,
  name: string,
  _isImplied?: boolean,
): void => {
  // Check anchor text patterns when anchor closes.
  if (name === 'a' && context.currentAnchor.href && context.currentAnchor.text) {
    const normalizedText = context.currentAnchor.text.toLowerCase().trim()

    // Check if anchor text contains any label pattern.
    if (includesAnyOf(normalizedText, context.options.anchorLabels)) {
      context.discoveredUris.add(context.currentAnchor.href)
    }

    context.currentAnchor.href = ''
    context.currentAnchor.text = ''
  }
}

export const createHtmlUrisHandlers = (context: HtmlMethodContext): Partial<Handler> => {
  return {
    onopentag: (name, attribs, isImplied) => {
      return handleOpenTag(context, name, attribs, isImplied)
    },
    ontext: (text) => {
      return handleText(context, text)
    },
    onclosetag: (name, isImplied) => {
      return handleCloseTag(context, name, isImplied)
    },
  }
}
