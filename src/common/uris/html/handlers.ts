import type { Handler } from 'htmlparser2'
import { endsWithAnyOf, includesAnyOf, matchesAnyOfLinkSelectors } from '../../../common/utils.js'
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

    // Match feed-related labels in title / aria-label (covers icon-only links with no text).
    const ariaLabel = attribs['aria-label']
    const title = attribs.title

    if (
      (ariaLabel && includesAnyOf(ariaLabel, context.options.anchorLabels)) ||
      (title && includesAnyOf(title, context.options.anchorLabels))
    ) {
      context.discoveredUris.add(attribs.href)
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
