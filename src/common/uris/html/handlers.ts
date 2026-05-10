import type { Handler } from 'htmlparser2'
import { endsWithAnyOf, includesAnyOf, matchesAnyOfLinkSelectors } from '../../../common/utils.js'
import type { HtmlMethodContext } from './types.js'

const extractJsonLdUris = (item: Record<string, unknown>, context: HtmlMethodContext): void => {
  const types = context.options.jsonLdTypes

  if (!types?.length) {
    return
  }

  let itemType: Array<string> = []

  if (typeof item['@type'] === 'string') {
    itemType = [item['@type']]
  } else if (Array.isArray(item['@type'])) {
    itemType = item['@type'] as Array<string>
  }

  const matches = itemType.some((type) => {
    return types.some((allowed) => {
      return type.toLowerCase() === allowed.toLowerCase()
    })
  })

  if (matches) {
    // Extract URL-like properties from matching types.
    const urlProperties = ['url', 'mainEntityOfPage', 'sameAs']

    for (const property of urlProperties) {
      const value = item[property]

      if (typeof value === 'string' && (value.startsWith('http') || value.startsWith('/'))) {
        context.discoveredUris.add(value)
      }

      if (Array.isArray(value)) {
        for (const entry of value) {
          if (typeof entry === 'string' && (entry.startsWith('http') || entry.startsWith('/'))) {
            context.discoveredUris.add(entry)
          }
        }
      }
    }

    // For DataFeed type, the page itself is the feed.
    if (itemType.some((type) => type.toLowerCase() === 'datafeed') && context.options.baseUrl) {
      context.discoveredUris.add(context.options.baseUrl)
    }
  }

  // Recurse into @graph for nested JSON-LD.
  if (Array.isArray(item['@graph'])) {
    for (const nested of item['@graph']) {
      if (typeof nested === 'object' && nested !== null) {
        extractJsonLdUris(nested as Record<string, unknown>, context)
      }
    }
  }
}

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
  }

  // Track JSON-LD script blocks for feed type detection.
  if (
    name === 'script' &&
    attribs.type?.toLowerCase() === 'application/ld+json' &&
    context.options.jsonLdTypes?.length
  ) {
    context.currentScript = { isJsonLd: true, content: '' }
  }
}

export const handleText = (context: HtmlMethodContext, text: string): void => {
  // Accumulate JSON-LD script content.
  if (context.currentScript?.isJsonLd) {
    context.currentScript.content += text
    return
  }

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
  // Parse JSON-LD content when script tag closes.
  if (name === 'script' && context.currentScript?.isJsonLd) {
    try {
      const jsonLd = JSON.parse(context.currentScript.content)
      const items = Array.isArray(jsonLd) ? jsonLd : [jsonLd]

      for (const item of items) {
        if (typeof item === 'object' && item !== null) {
          extractJsonLdUris(item as Record<string, unknown>, context)
        }
      }
    } catch {}

    context.currentScript = null
  }

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
