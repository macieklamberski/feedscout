import { describe, expect, it } from 'bun:test'
import { createHtmlUrisHandlers, handleCloseTag, handleOpenTag, handleText } from './handlers.js'
import type { HtmlMethodContext } from './types.js'

const createMockContext = (): HtmlMethodContext => {
  return {
    discoveredUris: new Set<string>(),
    currentAnchor: {
      href: '',
      text: '',
    },
    options: {
      linkSelectors: [
        { rel: 'alternate', types: ['application/rss+xml', 'application/atom+xml'] },
        { rel: 'feed' },
      ],
      anchorUris: ['/feed', '/rss', '/atom.xml'],
      anchorIgnoredUris: ['#', 'javascript:', 'mailto:'],
      anchorLabels: ['rss', 'feed', 'atom'],
    },
  }
}

describe('createHtmlUrisHandlers', () => {
  it('should return handlers object with correct methods', () => {
    const value = createMockContext()

    const handlers = createHtmlUrisHandlers(value)

    expect(handlers.onopentag).toBeDefined()
    expect(handlers.ontext).toBeDefined()
    expect(handlers.onclosetag).toBeDefined()
  })

  it('should create handlers that modify context', () => {
    const value = createMockContext()
    const handlers = createHtmlUrisHandlers(value)

    handlers.onopentag?.(
      'link',
      { rel: 'alternate', type: 'application/rss+xml', href: '/feed.xml' },
      false,
    )

    expect(value.discoveredUris.has('/feed.xml')).toBe(true)
  })
})

describe('handleOpenTag', () => {
  it('should add link tag with rel=alternate and valid MIME type', () => {
    const value = createMockContext()

    handleOpenTag(value, 'link', {
      rel: 'alternate',
      type: 'application/rss+xml',
      href: '/feed.xml',
    })

    expect(value.discoveredUris.has('/feed.xml')).toBe(true)
  })

  it('should add link tag with rel=feed without type (edge case)', () => {
    // HTML5 spec allows rel="feed" without type attribute.
    // The feed format should be autodiscovered when fetching the content.
    // This is a valid pattern seen in the wild that we should support.
    const value = createMockContext()

    handleOpenTag(value, 'link', { rel: 'feed', href: '/feed.xml' })

    expect(value.discoveredUris.has('/feed.xml')).toBe(true)
  })

  it('should add link tag with rel=feed and text/html type (hAtom)', () => {
    // hAtom microformat embeds feed data in HTML pages.
    // Sites using hAtom serve feeds with type="text/html".
    // This should be recognized as a valid feed when rel="feed" is present.
    const value = createMockContext()

    handleOpenTag(value, 'link', { rel: 'feed', type: 'text/html', href: '/hatom.html' })

    expect(value.discoveredUris.has('/hatom.html')).toBe(true)
  })

  it('should add link tag with rel=feed and matching type', () => {
    const value = createMockContext()

    handleOpenTag(value, 'link', { rel: 'feed', type: 'application/rss+xml', href: '/feed.xml' })

    expect(value.discoveredUris.has('/feed.xml')).toBe(true)
  })

  it('should add link tag with rel containing feed in compound value', () => {
    const value = createMockContext()

    handleOpenTag(value, 'link', {
      rel: 'feed alternate',
      type: 'application/rss+xml',
      href: '/feed.xml',
    })

    expect(value.discoveredUris.has('/feed.xml')).toBe(true)
  })

  it('should add link tag with rel containing alternate in compound value', () => {
    const value = createMockContext()

    handleOpenTag(value, 'link', {
      rel: 'alternate feed',
      type: 'application/rss+xml',
      href: '/feed.xml',
    })

    expect(value.discoveredUris.has('/feed.xml')).toBe(true)
  })

  it('should ignore link tag with rel=alternate and invalid MIME type', () => {
    const value = createMockContext()

    handleOpenTag(value, 'link', { rel: 'alternate', type: 'text/html', href: '/page.html' })

    expect(value.discoveredUris.has('/page.html')).toBe(false)
  })

  it('should ignore link tag without rel attribute', () => {
    const value = createMockContext()

    handleOpenTag(value, 'link', { type: 'application/rss+xml', href: '/feed.xml' })

    expect(value.discoveredUris.has('/feed.xml')).toBe(false)
  })

  it('should ignore link tag without href attribute', () => {
    const value = createMockContext()

    handleOpenTag(value, 'link', { rel: 'alternate', type: 'application/rss+xml' })

    expect(value.discoveredUris.size).toBe(0)
  })

  it('should ignore link with rel=alternate stylesheet', () => {
    const value = createMockContext()

    handleOpenTag(value, 'link', { rel: 'alternate stylesheet', href: '/style.css' })

    expect(value.discoveredUris.has('/style.css')).toBe(false)
  })

  it('should handle case-insensitive rel attribute', () => {
    const value = createMockContext()

    handleOpenTag(value, 'link', {
      rel: 'ALTERNATE',
      type: 'application/rss+xml',
      href: '/feed.xml',
    })

    expect(value.discoveredUris.has('/feed.xml')).toBe(true)
  })

  it('should add anchor tag with href ending in feed URI pattern', () => {
    const value = createMockContext()

    handleOpenTag(value, 'a', { href: '/feed' })

    expect(value.discoveredUris.has('/feed')).toBe(true)
  })

  it('should add anchor tag with href ending in rss URI pattern', () => {
    const value = createMockContext()

    handleOpenTag(value, 'a', { href: '/rss' })

    expect(value.discoveredUris.has('/rss')).toBe(true)
  })

  it('should store anchor href for text matching', () => {
    const value = createMockContext()

    handleOpenTag(value, 'a', { href: '/custom-feed' })

    expect(value.currentAnchor.href).toBe('/custom-feed')
  })

  it('should ignore anchor without href attribute', () => {
    const value = createMockContext()

    handleOpenTag(value, 'a', {})

    expect(value.currentAnchor.href).toBe('')
  })

  it('should ignore anchor with ignored URI pattern', () => {
    const value = createMockContext()

    handleOpenTag(value, 'a', { href: '#section' })

    expect(value.currentAnchor.href).toBe('')
  })

  it('should ignore anchor with javascript: URI', () => {
    const value = createMockContext()

    handleOpenTag(value, 'a', { href: 'javascript:void(0)' })

    expect(value.currentAnchor.href).toBe('')
  })

  it('should ignore anchor with mailto: URI', () => {
    const value = createMockContext()

    handleOpenTag(value, 'a', { href: 'mailto:user@example.com' })

    expect(value.currentAnchor.href).toBe('')
  })

  it('should handle case-insensitive href matching', () => {
    const value = createMockContext()

    handleOpenTag(value, 'a', { href: '/FEED' })

    expect(value.discoveredUris.has('/FEED')).toBe(true)
  })

  it('should ignore non-link and non-anchor tags', () => {
    const value = createMockContext()

    handleOpenTag(value, 'div', { href: '/feed.xml' })

    expect(value.discoveredUris.size).toBe(0)
  })

  it('should handle multiple link tags in sequence', () => {
    const value = createMockContext()

    handleOpenTag(value, 'link', {
      rel: 'alternate',
      type: 'application/rss+xml',
      href: '/feed.xml',
    })
    handleOpenTag(value, 'link', {
      rel: 'alternate',
      type: 'application/atom+xml',
      href: '/atom.xml',
    })

    expect(value.discoveredUris.has('/feed.xml')).toBe(true)
    expect(value.discoveredUris.has('/atom.xml')).toBe(true)
  })

  it('should handle anchor with path containing feed pattern', () => {
    const value = createMockContext()

    handleOpenTag(value, 'a', { href: '/blog/feed' })

    expect(value.discoveredUris.has('/blog/feed')).toBe(true)
  })
})

describe('handleText', () => {
  it('should capture text content when inside anchor', () => {
    const value = createMockContext()
    value.currentAnchor.href = '/custom-feed'

    handleText(value, 'RSS Feed')

    expect(value.currentAnchor.text).toBe('RSS Feed')
  })

  it('should ignore text when not inside anchor', () => {
    const value = createMockContext()

    handleText(value, 'Some text')

    expect(value.currentAnchor.text).toBe('')
  })

  it('should concatenate multiple text nodes', () => {
    const value = createMockContext()
    value.currentAnchor.href = '/custom-feed'

    handleText(value, 'RSS ')
    handleText(value, 'Feed')

    expect(value.currentAnchor.text).toBe('RSS Feed')
  })

  it('should preserve whitespace in text', () => {
    const value = createMockContext()
    value.currentAnchor.href = '/custom-feed'

    handleText(value, '  RSS Feed  ')

    expect(value.currentAnchor.text).toBe('  RSS Feed  ')
  })

  it('should handle empty text nodes', () => {
    const value = createMockContext()
    value.currentAnchor.href = '/custom-feed'

    handleText(value, '')

    expect(value.currentAnchor.text).toBe('')
  })
})

describe('handleCloseTag', () => {
  it('should add feed URI from anchor with feed keyword in text', () => {
    const value = createMockContext()
    value.currentAnchor.href = '/custom-feed'
    value.currentAnchor.text = 'RSS Feed'

    handleCloseTag(value, 'a')

    expect(value.discoveredUris.has('/custom-feed')).toBe(true)
  })

  it('should add feed URI from anchor with rss keyword in text', () => {
    const value = createMockContext()
    value.currentAnchor.href = '/custom-rss'
    value.currentAnchor.text = 'Subscribe to RSS'

    handleCloseTag(value, 'a')

    expect(value.discoveredUris.has('/custom-rss')).toBe(true)
  })

  it('should add feed URI from anchor with atom keyword in text', () => {
    const value = createMockContext()
    value.currentAnchor.href = '/custom-atom'
    value.currentAnchor.text = 'Atom Feed'

    handleCloseTag(value, 'a')

    expect(value.discoveredUris.has('/custom-atom')).toBe(true)
  })

  it('should ignore anchor without matching text pattern', () => {
    const value = createMockContext()
    value.currentAnchor.href = '/custom-page'
    value.currentAnchor.text = 'Read More'

    handleCloseTag(value, 'a')

    expect(value.discoveredUris.has('/custom-page')).toBe(false)
  })

  it('should ignore anchor without href', () => {
    const value = createMockContext()
    value.currentAnchor.href = ''
    value.currentAnchor.text = 'RSS Feed'

    handleCloseTag(value, 'a')

    expect(value.discoveredUris.size).toBe(0)
  })

  it('should ignore anchor without text', () => {
    const value = createMockContext()
    value.currentAnchor.href = '/custom-feed'
    value.currentAnchor.text = ''

    handleCloseTag(value, 'a')

    expect(value.discoveredUris.has('/custom-feed')).toBe(false)
  })

  it('should handle case-insensitive text matching', () => {
    const value = createMockContext()
    value.currentAnchor.href = '/custom-feed'
    value.currentAnchor.text = 'RSS FEED'

    handleCloseTag(value, 'a')

    expect(value.discoveredUris.has('/custom-feed')).toBe(true)
  })

  it('should trim whitespace before matching', () => {
    const value = createMockContext()
    value.currentAnchor.href = '/custom-feed'
    value.currentAnchor.text = '  rss  '

    handleCloseTag(value, 'a')

    expect(value.discoveredUris.has('/custom-feed')).toBe(true)
  })

  it('should clear currentAnchor after processing', () => {
    const value = createMockContext()
    value.currentAnchor.href = '/custom-feed'
    value.currentAnchor.text = 'RSS Feed'

    handleCloseTag(value, 'a')

    expect(value.currentAnchor.href).toBe('')
    expect(value.currentAnchor.text).toBe('')
  })

  it('should ignore non-anchor close tags', () => {
    const value = createMockContext()
    value.currentAnchor.href = '/custom-feed'
    value.currentAnchor.text = 'RSS Feed'

    handleCloseTag(value, 'div')

    expect(value.currentAnchor.href).toBe('/custom-feed')
    expect(value.currentAnchor.text).toBe('RSS Feed')
  })

  it('should handle text with feed keyword in the middle', () => {
    const value = createMockContext()
    value.currentAnchor.href = '/custom-feed'
    value.currentAnchor.text = 'Subscribe to our RSS feed here'

    handleCloseTag(value, 'a')

    expect(value.discoveredUris.has('/custom-feed')).toBe(true)
  })
})
