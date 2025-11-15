import type { Handler } from 'htmlparser2'
import type { ParserContext } from './types.js'

export const includesAny = (value: string, patterns: Array<string>): boolean => {
  const lowerValue = value?.toLowerCase()
  return patterns.some((pattern) => lowerValue?.includes(pattern.toLowerCase()))
}

export const handleOpenTag = (
  context: ParserContext,
  name: string,
  attribs: { [key: string]: string },
  _isImplied: boolean,
): void => {
  if (name === 'link' && attribs.href) {
    const rel = attribs.rel?.toLowerCase()

    // Traditional approach: rel="alternate" with MIME type.
    if (rel === 'alternate' && includesAny(attribs.type, context.options.feedContentTypes)) {
      context.discoveredUrls.add(attribs.href)
    }

    // HTML5 approach: rel="feed" or rel="feed alternate" (MIME type optional).
    // Exclude "alternate stylesheet" which should not be interpreted as feed.
    if (rel?.includes('feed') && !rel.includes('stylesheet')) {
      context.discoveredUrls.add(attribs.href)
    }
  }

  // Extract anchor elements by href suffix or track for text matching.
  if (name === 'a' && attribs.href) {
    const lowerHref = attribs.href.toLowerCase()

    // Skip if href contains ignored patterns.
    if (includesAny(lowerHref, context.options.anchorIgnoredUris)) {
      context.currentAnchor.href = ''
      context.currentAnchor.text = ''
      return
    }

    // Store href for potential text matching.
    context.currentAnchor.href = attribs.href
    context.currentAnchor.text = ''

    // Check if href ends with any anchor URI pattern.
    if (context.options.anchorUris.some((uri) => lowerHref.endsWith(uri.toLowerCase()))) {
      context.discoveredUrls.add(attribs.href)
    }
  }
}

export const handleText = (context: ParserContext, text: string): void => {
  // Accumulate text content for current anchor.
  if (context.currentAnchor.href) {
    context.currentAnchor.text += text
  }
}

export const handleCloseTag = (context: ParserContext, name: string, _isImplied: boolean): void => {
  // Check anchor text patterns when anchor closes.
  if (name === 'a' && context.currentAnchor.href && context.currentAnchor.text) {
    const normalizedText = context.currentAnchor.text.toLowerCase().trim()

    // Check if anchor text contains any feed label pattern.
    if (includesAny(normalizedText, context.options.anchorLabels)) {
      context.discoveredUrls.add(context.currentAnchor.href)
    }

    context.currentAnchor.href = ''
    context.currentAnchor.text = ''
  }
}

export const createHandlers = (context: ParserContext): Partial<Handler> => {
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
