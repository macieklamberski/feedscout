import type { Handler } from 'htmlparser2'
import type { ParserContext } from './types.js'

export const normalizeMimeType = (type: string): string => {
  return type.split(';')[0].trim().toLowerCase()
}

export const includesAnyOf = (
  value: string,
  patterns: Array<string>,
  parser?: (value: string) => string,
): boolean => {
  const parsedValue = parser ? parser(value) : value?.toLowerCase()
  return patterns.some((pattern) => parsedValue?.includes(pattern.toLowerCase()))
}

export const isAnyOf = (
  value: string,
  patterns: Array<string>,
  parser?: (value: string) => string,
): boolean => {
  const parsedValue = parser ? parser(value) : value?.toLowerCase()?.trim()
  return patterns.some((pattern) => parsedValue === pattern.toLowerCase().trim())
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
    if (rel === 'alternate' && isAnyOf(attribs.type, context.options.linkMimeTypes, normalizeMimeType)) {
      context.discoveredUris.add(attribs.href)
    }

    // HTML5 approach: rel="feed" or rel="feed alternate" (MIME type optional).
    // Exclude "alternate stylesheet" which should not be interpreted as feed.
    if (rel?.includes('feed') && !rel.includes('stylesheet')) {
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
    if (context.options.anchorUris.some((uri) => lowerHref.endsWith(uri.toLowerCase()))) {
      context.discoveredUris.add(attribs.href)
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
    if (includesAnyOf(normalizedText, context.options.anchorLabels)) {
      context.discoveredUris.add(context.currentAnchor.href)
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
