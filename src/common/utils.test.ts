import { describe, expect, it } from 'bun:test'
import { Parser } from 'htmlparser2'
import type { ParserContext } from './types.js'
import {
  createHandlers,
  handleCloseTag,
  handleOpenTag,
  handleText,
  includesAnyOf,
  isAnyOf,
  normalizeMimeType,
} from './utils.js'

describe('normalizeMimeType', () => {
  it('should extract base MIME type without parameters', () => {
    const value = 'application/rss+xml; charset=utf-8'
    const expected = 'application/rss+xml'

    expect(normalizeMimeType(value)).toBe(expected)
  })

  it('should handle MIME type without parameters', () => {
    const value = 'application/atom+xml'
    const expected = 'application/atom+xml'

    expect(normalizeMimeType(value)).toBe(expected)
  })

  it('should normalize case to lowercase', () => {
    const value = 'APPLICATION/RSS+XML'
    const expected = 'application/rss+xml'

    expect(normalizeMimeType(value)).toBe(expected)
  })

  it('should trim whitespace', () => {
    const value = '  application/rss+xml  '
    const expected = 'application/rss+xml'

    expect(normalizeMimeType(value)).toBe(expected)
  })

  it('should handle multiple parameters', () => {
    const value = 'application/rss+xml; charset=utf-8; boundary=something'
    const expected = 'application/rss+xml'

    expect(normalizeMimeType(value)).toBe(expected)
  })

  it('should handle empty string', () => {
    const value = ''
    const expected = ''

    expect(normalizeMimeType(value)).toBe(expected)
  })

  it('should handle string with only semicolons', () => {
    const value = ';;;'
    const expected = ''

    expect(normalizeMimeType(value)).toBe(expected)
  })

  it('should handle MIME type with space before semicolon', () => {
    const value = 'application/rss+xml ; charset=utf-8'
    const expected = 'application/rss+xml'

    expect(normalizeMimeType(value)).toBe(expected)
  })
})

describe('includesAnyOf', () => {
  it('should return true when value includes one of the patterns', () => {
    const value = 'application/rss+xml'
    const patterns = ['application/rss+xml', 'application/atom+xml']
    const expected = true

    expect(includesAnyOf(value, patterns)).toBe(expected)
  })

  it('should return true when value includes pattern with case-insensitive match', () => {
    const value = 'APPLICATION/RSS+XML'
    const patterns = ['application/rss+xml']
    const expected = true

    expect(includesAnyOf(value, patterns)).toBe(expected)
  })

  it('should return true when patterns have mixed case', () => {
    const value = 'subscribe to our feed'
    const patterns = ['RSS', 'Feed']
    const expected = true

    expect(includesAnyOf(value, patterns)).toBe(expected)
  })

  it('should return true when value partially includes pattern', () => {
    const value = 'application/rss+xml; charset=utf-8'
    const patterns = ['rss+xml']
    const expected = true

    expect(includesAnyOf(value, patterns)).toBe(expected)
  })

  it('should return true when using custom parser', () => {
    const value = 'application/rss+xml; charset=utf-8'
    const patterns = ['application/rss+xml']
    const expected = true

    expect(includesAnyOf(value, patterns, normalizeMimeType)).toBe(expected)
  })

  it('should return false when value does not include any pattern', () => {
    const value = 'text/html'
    const patterns = ['application/rss+xml', 'application/atom+xml']
    const expected = false

    expect(includesAnyOf(value, patterns)).toBe(expected)
  })

  it('should return false when patterns array is empty', () => {
    const value = 'application/rss+xml'
    const patterns: Array<string> = []
    const expected = false

    expect(includesAnyOf(value, patterns)).toBe(expected)
  })

  it('should handle empty string value', () => {
    const value = ''
    const patterns = ['application/rss+xml']
    const expected = false

    expect(includesAnyOf(value, patterns)).toBe(expected)
  })

  it('should handle undefined value', () => {
    const value = undefined
    const patterns = ['application/rss+xml']
    const expected = false

    // @ts-expect-error: This is for testing purposes.
    expect(includesAnyOf(value, patterns)).toBe(expected)
  })
})

describe('isAnyOf', () => {
  it('should return true when value exactly matches one of the patterns', () => {
    const value = 'application/rss+xml'
    const patterns = ['application/rss+xml', 'application/atom+xml']
    const expected = true

    expect(isAnyOf(value, patterns)).toBe(expected)
  })

  it('should return true when value matches pattern with case-insensitive match', () => {
    const value = 'APPLICATION/RSS+XML'
    const patterns = ['application/rss+xml']
    const expected = true

    expect(isAnyOf(value, patterns)).toBe(expected)
  })

  it('should return true when value has whitespace and matches after trim', () => {
    const value = '  application/rss+xml  '
    const patterns = ['application/rss+xml']
    const expected = true

    expect(isAnyOf(value, patterns)).toBe(expected)
  })

  it('should return true when using custom parser', () => {
    const value = 'application/rss+xml; charset=utf-8'
    const patterns = ['application/rss+xml']
    const expected = true

    expect(isAnyOf(value, patterns, normalizeMimeType)).toBe(expected)
  })

  it('should return false when value only partially matches', () => {
    const value = 'application/rss+xml; charset=utf-8'
    const patterns = ['application/rss+xml']
    const expected = false

    expect(isAnyOf(value, patterns)).toBe(expected)
  })

  it('should return false when value does not match any pattern', () => {
    const value = 'text/html'
    const patterns = ['application/rss+xml', 'application/atom+xml']
    const expected = false

    expect(isAnyOf(value, patterns)).toBe(expected)
  })

  it('should return false when patterns array is empty', () => {
    const value = 'application/rss+xml'
    const patterns: Array<string> = []
    const expected = false

    expect(isAnyOf(value, patterns)).toBe(expected)
  })

  it('should handle empty string value', () => {
    const value = ''
    const patterns = ['application/rss+xml']
    const expected = false

    expect(isAnyOf(value, patterns)).toBe(expected)
  })

  it('should handle whitespace-only value', () => {
    const value = '   '
    const patterns = ['application/rss+xml']
    const expected = false

    expect(isAnyOf(value, patterns)).toBe(expected)
  })

  it('should handle undefined value', () => {
    const value = undefined
    const patterns = ['application/rss+xml']
    const expected = false

    // @ts-expect-error: This is for testing purposes.
    expect(isAnyOf(value, patterns)).toBe(expected)
  })
})

describe('createHandlers', () => {
  it('should create handlers that can be used with htmlparser2', () => {
    const context: ParserContext = {
      discoveredUris: new Set<string>(),
      currentAnchor: { href: '', text: '' },
      options: {
        linkMimeTypes: ['application/rss+xml'],
        anchorUris: ['/feed'],
        anchorIgnoredUris: ['wp-json/'],
        anchorLabels: ['rss'],
      },
    }

    const handlers = createHandlers(context)
    const parser = new Parser(handlers, { decodeEntities: true })

    const html = '<link rel="alternate" type="application/rss+xml" href="/feed.xml">'
    parser.write(html)
    parser.end()

    expect(Array.from(context.discoveredUris)).toEqual(['/feed.xml'])
  })

  it('should allow combining feedscout handlers with custom handlers', () => {
    const context: ParserContext = {
      discoveredUris: new Set<string>(),
      currentAnchor: { href: '', text: '' },
      options: {
        linkMimeTypes: ['application/rss+xml'],
        anchorUris: ['/feed'],
        anchorIgnoredUris: [],
        anchorLabels: ['rss'],
      },
    }

    const customData: Array<string> = []

    // Create custom handlers that also track h1 elements.
    const handlers = {
      ...createHandlers(context),
      onopentag: (name: string, attribs: { [key: string]: string }, isImplied: boolean) => {
        // Call feedscout handler first.
        handleOpenTag(context, name, attribs, isImplied)

        // Add custom logic.
        if (name === 'h1') {
          customData.push('found-h1')
        }
      },
    }

    const parser = new Parser(handlers, { decodeEntities: true })

    const html = `
      <h1>Title</h1>
      <link rel="alternate" type="application/rss+xml" href="/feed.xml">
      <h1>Another Title</h1>
    `
    parser.write(html)
    parser.end()

    expect(Array.from(context.discoveredUris)).toEqual(['/feed.xml'])
    expect(customData).toEqual(['found-h1', 'found-h1'])
  })
})

describe('individual handlers', () => {
  it('handleOpenTag should discover link elements', () => {
    const context: ParserContext = {
      discoveredUris: new Set<string>(),
      currentAnchor: { href: '', text: '' },
      options: {
        linkMimeTypes: ['application/rss+xml'],
        anchorUris: [],
        anchorIgnoredUris: [],
        anchorLabels: [],
      },
    }

    handleOpenTag(
      context,
      'link',
      {
        rel: 'alternate',
        type: 'application/rss+xml',
        href: '/feed.xml',
      },
      false,
    )

    expect(Array.from(context.discoveredUris)).toEqual(['/feed.xml'])
  })

  it('handleOpenTag should discover anchor elements by href', () => {
    const context: ParserContext = {
      discoveredUris: new Set<string>(),
      currentAnchor: { href: '', text: '' },
      options: {
        linkMimeTypes: [],
        anchorUris: ['/feed'],
        anchorIgnoredUris: [],
        anchorLabels: [],
      },
    }

    handleOpenTag(context, 'a', { href: '/feed' }, false)

    expect(Array.from(context.discoveredUris)).toEqual(['/feed'])
    expect(context.currentAnchor.href).toBe('/feed')
  })

  it('handleText should accumulate text for current anchor', () => {
    const context: ParserContext = {
      discoveredUris: new Set<string>(),
      currentAnchor: { href: '/my-feed', text: '' },
      options: {
        linkMimeTypes: [],
        anchorUris: [],
        anchorIgnoredUris: [],
        anchorLabels: [],
      },
    }

    handleText(context, 'RSS')
    handleText(context, ' ')
    handleText(context, 'Feed')

    expect(context.currentAnchor.text).toBe('RSS Feed')
  })

  it('handleCloseTag should discover anchor by text label', () => {
    const context: ParserContext = {
      discoveredUris: new Set<string>(),
      currentAnchor: { href: '/my-feed', text: 'RSS Feed' },
      options: {
        linkMimeTypes: [],
        anchorUris: [],
        anchorIgnoredUris: [],
        anchorLabels: ['rss'],
      },
    }

    handleCloseTag(context, 'a', false)

    expect(Array.from(context.discoveredUris)).toEqual(['/my-feed'])
    expect(context.currentAnchor.href).toBe('')
    expect(context.currentAnchor.text).toBe('')
  })
})
