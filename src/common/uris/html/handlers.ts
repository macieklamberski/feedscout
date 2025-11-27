import type { Handler } from 'htmlparser2'
import {
  endsWithAnyOf,
  includesAnyOf,
  matchesAnyOfLinkSelectors,
  normalizeUrl,
} from '../../../common/utils.js'
import type { HtmlMethodContext } from './types.js'

export const handleOpenTag = (
  context: HtmlMethodContext,
  name: string,
  attribs: { [key: string]: string },
  _isImplied?: boolean,
): void => {
  if (name === 'link' && attribs.href) {
    const rel = attribs.rel?.toLowerCase()

    if (!rel) {
      return
    }

    if (matchesAnyOfLinkSelectors(rel, attribs.type, context.options.linkSelectors)) {
      context.discoveredUris.add(normalizeUrl(attribs.href, context.options.baseUrl))
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
      context.discoveredUris.add(normalizeUrl(attribs.href, context.options.baseUrl))
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
      context.discoveredUris.add(normalizeUrl(context.currentAnchor.href, context.options.baseUrl))
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
