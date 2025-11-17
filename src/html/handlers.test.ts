import { describe, expect, it } from 'bun:test'
import {
  createHtmlFeedUrisHandlers,
  handleCloseTag,
  handleOpenTag,
  handleText,
} from './handlers.js'
import type { Context } from './types.js'

const createMockContext = (): Context => {
  return {
    discoveredUris: new Set<string>(),
    currentAnchor: {
      href: '',
      text: '',
    },
    options: {
      linkMimeTypes: ['application/rss+xml', 'application/atom+xml'],
      anchorUris: ['/feed', '/rss', '/atom.xml'],
      anchorIgnoredUris: ['#', 'javascript:', 'mailto:'],
      anchorLabels: ['rss', 'feed', 'atom'],
    },
  }
}

describe('createHtmlFeedUrisHandlers', () => {
  it('should return handlers object with correct methods', () => {
    const value = createMockContext()

    const handlers = createHtmlFeedUrisHandlers(value)

    expect(handlers.onopentag).toBeDefined()
    expect(handlers.ontext).toBeDefined()
    expect(handlers.onclosetag).toBeDefined()
  })

  it('should create handlers that modify context', () => {
    const value = createMockContext()
    const handlers = createHtmlFeedUrisHandlers(value)

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

    handleOpenTag(
      value,
      'link',
      { rel: 'alternate', type: 'application/rss+xml', href: '/feed.xml' },
      false,
    )

    expect(value.discoveredUris.has('/feed.xml')).toBe(true)
  })

  it('should add link tag with rel=feed', () => {
    const value = createMockContext()

    handleOpenTag(value, 'link', { rel: 'feed', href: '/feed.xml' }, false)

    expect(value.discoveredUris.has('/feed.xml')).toBe(true)
  })

  it('should add link tag with rel containing feed', () => {
    const value = createMockContext()

    handleOpenTag(value, 'link', { rel: 'feed alternate', href: '/feed.xml' }, false)

    expect(value.discoveredUris.has('/feed.xml')).toBe(true)
  })

  it('should ignore link tag with rel=alternate and invalid MIME type', () => {
    const value = createMockContext()

    handleOpenTag(value, 'link', { rel: 'alternate', type: 'text/html', href: '/page.html' }, false)

    expect(value.discoveredUris.has('/page.html')).toBe(false)
  })

  it('should ignore link tag without rel attribute', () => {
    const value = createMockContext()

    handleOpenTag(value, 'link', { type: 'application/rss+xml', href: '/feed.xml' }, false)

    expect(value.discoveredUris.has('/feed.xml')).toBe(false)
  })

  it('should ignore link tag without href attribute', () => {
    const value = createMockContext()

    handleOpenTag(value, 'link', { rel: 'alternate', type: 'application/rss+xml' }, false)

    expect(value.discoveredUris.size).toBe(0)
  })

  it('should ignore link with rel=alternate stylesheet', () => {
    const value = createMockContext()

    handleOpenTag(value, 'link', { rel: 'alternate stylesheet', href: '/style.css' }, false)

    expect(value.discoveredUris.has('/style.css')).toBe(false)
  })

  it('should handle case-insensitive rel attribute', () => {
    const value = createMockContext()

    handleOpenTag(
      value,
      'link',
      { rel: 'ALTERNATE', type: 'application/rss+xml', href: '/feed.xml' },
      false,
    )

    expect(value.discoveredUris.has('/feed.xml')).toBe(true)
  })

  it('should add anchor tag with href ending in feed URI pattern', () => {
    const value = createMockContext()

    handleOpenTag(value, 'a', { href: '/feed' }, false)

    expect(value.discoveredUris.has('/feed')).toBe(true)
  })

  it('should add anchor tag with href ending in rss URI pattern', () => {
    const value = createMockContext()

    handleOpenTag(value, 'a', { href: '/rss' }, false)

    expect(value.discoveredUris.has('/rss')).toBe(true)
  })

  it('should store anchor href for text matching', () => {
    const value = createMockContext()

    handleOpenTag(value, 'a', { href: '/custom-feed' }, false)

    expect(value.currentAnchor.href).toBe('/custom-feed')
  })

  it('should ignore anchor without href attribute', () => {
    const value = createMockContext()

    handleOpenTag(value, 'a', {}, false)

    expect(value.currentAnchor.href).toBe('')
  })

  it('should ignore anchor with ignored URI pattern', () => {
    const value = createMockContext()

    handleOpenTag(value, 'a', { href: '#section' }, false)

    expect(value.currentAnchor.href).toBe('')
  })

  it('should ignore anchor with javascript: URI', () => {
    const value = createMockContext()

    handleOpenTag(value, 'a', { href: 'javascript:void(0)' }, false)

    expect(value.currentAnchor.href).toBe('')
  })

  it('should ignore anchor with mailto: URI', () => {
    const value = createMockContext()

    handleOpenTag(value, 'a', { href: 'mailto:user@example.com' }, false)

    expect(value.currentAnchor.href).toBe('')
  })

  it('should handle case-insensitive href matching', () => {
    const value = createMockContext()

    handleOpenTag(value, 'a', { href: '/FEED' }, false)

    expect(value.discoveredUris.has('/FEED')).toBe(true)
  })

  it('should ignore non-link and non-anchor tags', () => {
    const value = createMockContext()

    handleOpenTag(value, 'div', { href: '/feed.xml' }, false)

    expect(value.discoveredUris.size).toBe(0)
  })

  it('should handle multiple link tags in sequence', () => {
    const value = createMockContext()

    handleOpenTag(
      value,
      'link',
      { rel: 'alternate', type: 'application/rss+xml', href: '/feed.xml' },
      false,
    )
    handleOpenTag(
      value,
      'link',
      { rel: 'alternate', type: 'application/atom+xml', href: '/atom.xml' },
      false,
    )

    expect(value.discoveredUris.has('/feed.xml')).toBe(true)
    expect(value.discoveredUris.has('/atom.xml')).toBe(true)
  })

  it('should handle anchor with path containing feed pattern', () => {
    const value = createMockContext()

    handleOpenTag(value, 'a', { href: '/blog/feed' }, false)

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

    handleCloseTag(value, 'a', false)

    expect(value.discoveredUris.has('/custom-feed')).toBe(true)
  })

  it('should add feed URI from anchor with rss keyword in text', () => {
    const value = createMockContext()
    value.currentAnchor.href = '/custom-rss'
    value.currentAnchor.text = 'Subscribe to RSS'

    handleCloseTag(value, 'a', false)

    expect(value.discoveredUris.has('/custom-rss')).toBe(true)
  })

  it('should add feed URI from anchor with atom keyword in text', () => {
    const value = createMockContext()
    value.currentAnchor.href = '/custom-atom'
    value.currentAnchor.text = 'Atom Feed'

    handleCloseTag(value, 'a', false)

    expect(value.discoveredUris.has('/custom-atom')).toBe(true)
  })

  it('should ignore anchor without matching text pattern', () => {
    const value = createMockContext()
    value.currentAnchor.href = '/custom-page'
    value.currentAnchor.text = 'Read More'

    handleCloseTag(value, 'a', false)

    expect(value.discoveredUris.has('/custom-page')).toBe(false)
  })

  it('should ignore anchor without href', () => {
    const value = createMockContext()
    value.currentAnchor.href = ''
    value.currentAnchor.text = 'RSS Feed'

    handleCloseTag(value, 'a', false)

    expect(value.discoveredUris.size).toBe(0)
  })

  it('should ignore anchor without text', () => {
    const value = createMockContext()
    value.currentAnchor.href = '/custom-feed'
    value.currentAnchor.text = ''

    handleCloseTag(value, 'a', false)

    expect(value.discoveredUris.has('/custom-feed')).toBe(false)
  })

  it('should handle case-insensitive text matching', () => {
    const value = createMockContext()
    value.currentAnchor.href = '/custom-feed'
    value.currentAnchor.text = 'RSS FEED'

    handleCloseTag(value, 'a', false)

    expect(value.discoveredUris.has('/custom-feed')).toBe(true)
  })

  it('should trim whitespace before matching', () => {
    const value = createMockContext()
    value.currentAnchor.href = '/custom-feed'
    value.currentAnchor.text = '  rss  '

    handleCloseTag(value, 'a', false)

    expect(value.discoveredUris.has('/custom-feed')).toBe(true)
  })

  it('should clear currentAnchor after processing', () => {
    const value = createMockContext()
    value.currentAnchor.href = '/custom-feed'
    value.currentAnchor.text = 'RSS Feed'

    handleCloseTag(value, 'a', false)

    expect(value.currentAnchor.href).toBe('')
    expect(value.currentAnchor.text).toBe('')
  })

  it('should ignore non-anchor close tags', () => {
    const value = createMockContext()
    value.currentAnchor.href = '/custom-feed'
    value.currentAnchor.text = 'RSS Feed'

    handleCloseTag(value, 'div', false)

    expect(value.currentAnchor.href).toBe('/custom-feed')
    expect(value.currentAnchor.text).toBe('RSS Feed')
  })

  it('should handle text with feed keyword in the middle', () => {
    const value = createMockContext()
    value.currentAnchor.href = '/custom-feed'
    value.currentAnchor.text = 'Subscribe to our RSS feed here'

    handleCloseTag(value, 'a', false)

    expect(value.discoveredUris.has('/custom-feed')).toBe(true)
  })
})
