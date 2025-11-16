import type { Handler } from 'htmlparser2'
import { Parser } from 'htmlparser2'

const signatures = [
  {
    type: 'wordpress',
    metaGenerator: ['wordpress'],
    htmlPatterns: ['/wp-content/', '/wp-includes/', '/wp-json/'],
    feedUris: [
      '/feed/',
      '/feed',
      '/rss/',
      '/rss',
      '/comments/feed/',
      '/comments/feed',
      '/category/*/feed/',
      '/tag/*/feed/',
      '/wp-json/wp/v2/posts',
      '/?rest_route=/wp/v2/posts',
    ],
  },
  {
    type: 'ghost',
    metaGenerator: ['ghost'],
    htmlPatterns: ['/ghost/', 'ghost-version'],
    feedUris: [
      '/rss/',
      '/rss',
      '/feed/',
      '/feed',
      '/ghost/api/v3/content/posts/',
      '/ghost/api/content/posts/',
    ],
  },
  {
    type: 'hexo',
    metaGenerator: ['hexo'],
    feedUris: ['/atom.xml', '/rss2.xml', '/feed.xml'],
  },
  {
    type: 'jekyll',
    metaGenerator: ['jekyll'],
    feedUris: ['/feed.xml', '/atom.xml', '/rss.xml'],
  },
  {
    type: 'hugo',
    metaGenerator: ['hugo'],
    feedUris: ['/index.xml', '/feed.xml', '/rss.xml'],
  },
  {
    type: 'gatsby',
    metaGenerator: ['gatsby'],
    feedUris: ['/rss.xml', '/feed.xml'],
  },
  {
    type: 'drupal',
    metaGenerator: ['drupal'],
    htmlPatterns: ['/sites/default/files/', 'drupal.js'],
    feedUris: ['/rss.xml', '/feed', '/node/feed'],
  },
  {
    type: 'joomla',
    metaGenerator: ['joomla'],
    htmlPatterns: ['option=com_', '/components/com_'],
    feedUris: [
      '/index.php?format=feed&type=rss',
      '/index.php?format=feed&type=atom',
      '/?format=feed',
    ],
  },
  {
    type: 'medium',
    domainPatterns: ['medium.com', 'medium-feed'],
    feedUris: ['/feed', '/feed/'],
  },
  {
    type: 'blogger',
    metaGenerator: ['blogger'],
    domainPatterns: ['blogger.com', '.blogspot.com'],
    feedUris: ['/feeds/posts/default', '/feeds/posts/default?alt=rss', '/atom.xml'],
  },
  {
    type: 'tumblr',
    metaGenerator: ['tumblr'],
    domainPatterns: ['tumblr.com', 'tumblr-avatar'],
    feedUris: ['/rss', '/feed'],
  },
  {
    type: 'wix',
    metaGenerator: ['wix'],
    domainPatterns: ['wix.com', '_wix'],
    feedUris: ['/feed.xml', '/rss.xml', '/blog-feed.xml'],
  },
  {
    type: 'squarespace',
    metaGenerator: ['squarespace'],
    domainPatterns: ['squarespace.com', 'squarespace-cdn'],
    feedUris: ['/blog?format=rss', '/?format=rss', '/rss'],
  },
  {
    type: 'webflow',
    metaGenerator: ['webflow'],
    domainPatterns: ['webflow.io', 'webflow.com'],
    feedUris: ['/rss.xml', '/blog-rss.xml'],
  },
  {
    type: 'substack',
    domainPatterns: ['substack.com', 'substackcdn'],
    feedUris: ['/feed'],
  },
  {
    type: 'bear',
    domainPatterns: ['bearblog.dev'],
    feedUris: ['/feed/', '/feed'],
  },
  {
    type: 'eleventy',
    metaGenerator: ['eleventy', '11ty'],
    feedUris: ['/feed.xml', '/feed/'],
  },
  {
    type: 'next',
    metaGenerator: ['next.js', 'nextjs'],
    htmlPatterns: ['__next', '_next/'],
    feedUris: ['/feed.xml', '/rss.xml', '/api/feed'],
  },
  {
    type: 'nuxt',
    metaGenerator: ['nuxt'],
    htmlPatterns: ['__nuxt', '_nuxt/'],
    feedUris: ['/feed.xml', '/rss.xml'],
  },
  {
    type: 'vuepress',
    metaGenerator: ['vuepress'],
    feedUris: ['/rss.xml', '/feed.xml'],
  },
  {
    type: 'docusaurus',
    metaGenerator: ['docusaurus'],
    feedUris: ['/blog/rss.xml', '/blog/atom.xml', '/blog/feed.json'],
  },
  {
    type: 'nikola',
    metaGenerator: ['nikola'],
    htmlPatterns: ['getnikola.com'],
    feedUris: ['/rss.xml', '/atom.xml'],
  },
] as const

// Derive signature structure for internal use.
type CmsSignature = (typeof signatures)[number]

// Derive CMS type from signatures array.
type CmsType = CmsSignature['type']

export type HtmlCmsTypeContext = {
  metaGenerator?: string
  matchedPatterns: Set<string>
}

// Check if value matches any signature patterns and track matches.
const checkPatternMatch = (value: string, context: HtmlCmsTypeContext): void => {
  const lowerValue = value.toLowerCase()

  for (const signature of signatures) {
    // Check HTML patterns.
    if ('htmlPatterns' in signature) {
      for (const pattern of signature.htmlPatterns) {
        if (lowerValue.includes(pattern)) {
          context.matchedPatterns.add(`html:${signature.type}`)
          return
        }
      }
    }

    // Check domain patterns.
    if ('domainPatterns' in signature) {
      for (const pattern of signature.domainPatterns) {
        if (lowerValue.includes(pattern)) {
          context.matchedPatterns.add(`domain:${signature.type}`)
          return
        }
      }
    }
  }
}

// Create htmlparser2 handlers for CMS detection.
export const createHtmlCmsTypeHandlers = (context: HtmlCmsTypeContext): Partial<Handler> => {
  return {
    onopentag: (name, attributes) => {
      // Check for meta generator tag.
      if (name === 'meta' && attributes.name === 'generator' && attributes.content) {
        context.metaGenerator = attributes.content.toLowerCase()
      }

      // Check src attribute (script, link, img tags).
      if (attributes.src) {
        checkPatternMatch(attributes.src, context)
      }

      // Check href attribute (link, a tags).
      if (attributes.href) {
        checkPatternMatch(attributes.href, context)
      }

      // Check div ID for __next, __nuxt.
      if (name === 'div' && attributes.id) {
        checkPatternMatch(attributes.id, context)
      }
    },
  }
}

// Match context against signatures to find CMS type.
const matchSignature = (context: HtmlCmsTypeContext): CmsType | undefined => {
  // Prioritize meta generator patterns.
  if (context.metaGenerator) {
    for (const signature of signatures) {
      if ('metaGenerator' in signature) {
        for (const pattern of signature.metaGenerator) {
          if (context.metaGenerator.includes(pattern)) {
            return signature.type
          }
        }
      }
    }
    // If meta generator exists but doesn't match any signature, return undefined.
    return
  }

  // Check matched patterns - prefer HTML patterns over domain patterns.
  for (const match of context.matchedPatterns) {
    if (match.startsWith('html:')) {
      const cmsType = match.slice(5) as CmsType
      return cmsType
    }
  }

  // Fall back to domain patterns.
  for (const match of context.matchedPatterns) {
    if (match.startsWith('domain:')) {
      const cmsType = match.slice(7) as CmsType
      return cmsType
    }
  }

  return
}

// Detect CMS type from HTML content.
export const detectCms: (html: string) => CmsType | undefined = (html) => {
  // Early return for empty input.
  if (!html || typeof html !== 'string') {
    return
  }

  const context: HtmlCmsTypeContext = {
    matchedPatterns: new Set<string>(),
  }

  const parser = new Parser(createHtmlCmsTypeHandlers(context), { decodeEntities: true })

  parser.write(html)
  parser.end()

  return matchSignature(context)
}

// Detect CMS type from HTTP response headers.
export const detectCmsFromHeaders: (headers: Headers) => CmsType | undefined = (headers) => {
  const xPoweredBy = headers.get('x-powered-by')?.toLowerCase()
  const xPingback = headers.get('x-pingback')
  const xGenerator = headers.get('x-generator')?.toLowerCase()

  // Next.js.
  if (xPoweredBy?.includes('next')) {
    return 'next'
  }

  // Nuxt.
  if (xPoweredBy?.includes('nuxt')) {
    return 'nuxt'
  }

  // WordPress (via X-Pingback header).
  if (xPingback) {
    return 'wordpress'
  }

  // Drupal (legacy).
  if (xGenerator?.includes('drupal')) {
    return 'drupal'
  }

  return
}

// Get all CMS-specific feed URIs from HTML.
export const discoverFeedUrisFromCmsHtml: (html: string) => Array<string> = (html) => {
  const cmsType = detectCms(html)

  // Early return if no CMS detected.
  if (!cmsType) {
    return []
  }

  // Find signature for detected CMS.
  const signature = signatures.find((s) => {
    return s.type === cmsType
  })

  // Return all feed URIs for this CMS.
  return signature ? [...signature.feedUris] : []
}

// Get all CMS-specific feed URIs from headers.
export const discoverFeedUrisFromCmsHeaders: (headers: Headers) => Array<string> = (headers) => {
  const cmsType = detectCmsFromHeaders(headers)

  // Early return if no CMS detected.
  if (!cmsType) {
    return []
  }

  // Find signature for detected CMS.
  const signature = signatures.find((s) => {
    return s.type === cmsType
  })

  // Return all feed URIs for this CMS.
  return signature ? [...signature.feedUris] : []
}
