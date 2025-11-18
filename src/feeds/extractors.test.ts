import { describe, expect, it } from 'bun:test'
import type { FeedInfo } from '../common/types.js'
import { createDefaultExtractor } from './extractors.js'

describe('createDefaultExtractor', () => {
  it('should return isFeed: false when content is empty', async () => {
    const extractor = createDefaultExtractor()
    const result = await extractor({
      content: '',
      headers: new Headers(),
      url: 'https://example.com/feed.xml',
    })
    const expected: FeedInfo = {
      url: 'https://example.com/feed.xml',
      isFeed: false,
    }

    expect(result).toEqual(expected)
  })

  it('should return isFeed: false when content looks like HTML', async () => {
    const extractor = createDefaultExtractor()
    const html = '<!DOCTYPE html><html><head><title>Test</title></head></html>'
    const result = await extractor({
      content: html,
      headers: new Headers(),
      url: 'https://example.com/index.html',
    })
    const expected: FeedInfo = {
      url: 'https://example.com/index.html',
      isFeed: false,
    }

    expect(result).toEqual(expected)
  })

  it('should detect RSS format from <rss> tag', async () => {
    const extractor = createDefaultExtractor()
    const rss = '<?xml version="1.0"?><rss version="2.0"><channel></channel></rss>'
    const result = await extractor({
      content: rss,
      headers: new Headers(),
      url: 'https://example.com/feed.xml',
    })
    const expected: FeedInfo = {
      url: 'https://example.com/feed.xml',
      isFeed: true,
      format: 'rss',
    }

    expect(result).toEqual(expected)
  })

  it('should detect Atom format from <feed> tag', async () => {
    const extractor = createDefaultExtractor()
    const atom = '<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom"></feed>'
    const result = await extractor({
      content: atom,
      headers: new Headers(),
      url: 'https://example.com/feed.xml',
    })
    const expected: FeedInfo = {
      url: 'https://example.com/feed.xml',
      isFeed: true,
      format: 'atom',
    }

    expect(result).toEqual(expected)
  })

  it('should detect RDF format from <rdf> tag', async () => {
    const extractor = createDefaultExtractor()
    const rdf =
      '<?xml version="1.0"?><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"></rdf:RDF>'
    const result = await extractor({
      content: rdf,
      headers: new Headers(),
      url: 'https://example.com/feed.xml',
    })
    const expected: FeedInfo = {
      url: 'https://example.com/feed.xml',
      isFeed: true,
      format: 'rdf',
    }

    expect(result).toEqual(expected)
  })

  it('should detect JSON Feed format from "version" field', async () => {
    const extractor = createDefaultExtractor()
    const json = '{"version": "https://jsonfeed.org/version/1.1", "title": "Test"}'
    const result = await extractor({
      content: json,
      headers: new Headers(),
      url: 'https://example.com/feed.json',
    })
    const expected: FeedInfo = {
      url: 'https://example.com/feed.json',
      isFeed: true,
      format: 'json',
    }

    expect(result).toEqual(expected)
  })

  it('should return isFeed: false when no feed markers found', async () => {
    const extractor = createDefaultExtractor()
    const content = '<?xml version="1.0"?><data><item>Test</item></data>'
    const result = await extractor({
      content,
      headers: new Headers(),
      url: 'https://example.com/data.xml',
    })
    const expected: FeedInfo = {
      url: 'https://example.com/data.xml',
      isFeed: false,
    }

    expect(result).toEqual(expected)
  })

  it('should handle case-insensitive content matching', async () => {
    const extractor = createDefaultExtractor()
    const rss = '<?xml version="1.0"?><RSS version="2.0"><channel></channel></RSS>'
    const result = await extractor({
      content: rss,
      headers: new Headers(),
      url: 'https://example.com/feed.xml',
    })
    const expected: FeedInfo = {
      url: 'https://example.com/feed.xml',
      isFeed: true,
      format: 'rss',
    }

    expect(result).toEqual(expected)
  })

  it('should prioritize HTML rejection over feed detection', async () => {
    const extractor = createDefaultExtractor()
    const mixed = '<html><body><rss>Not a real feed</rss></body></html>'
    const result = await extractor({
      content: mixed,
      headers: new Headers(),
      url: 'https://example.com/page.html',
    })
    const expected: FeedInfo = {
      url: 'https://example.com/page.html',
      isFeed: false,
    }

    expect(result).toEqual(expected)
  })

  it('should handle very large content', async () => {
    const extractor = createDefaultExtractor()
    const largeRss = `<rss version="2.0"><channel>${'a'.repeat(1000000)}</channel></rss>`
    const result = await extractor({
      content: largeRss,
      headers: new Headers(),
      url: 'https://example.com/feed.xml',
    })
    const expected: FeedInfo = {
      url: 'https://example.com/feed.xml',
      isFeed: true,
      format: 'rss',
    }

    expect(result).toEqual(expected)
  })

  it('should handle content with only whitespace', async () => {
    const extractor = createDefaultExtractor()
    const result = await extractor({
      content: '   \n\t  ',
      headers: new Headers(),
      url: 'https://example.com/feed.xml',
    })
    const expected: FeedInfo = {
      url: 'https://example.com/feed.xml',
      isFeed: false,
    }

    expect(result).toEqual(expected)
  })

  it('should handle content with BOM characters', async () => {
    const extractor = createDefaultExtractor()
    const rss = '\uFEFF<?xml version="1.0"?><rss version="2.0"><channel></channel></rss>'
    const result = await extractor({
      content: rss,
      headers: new Headers(),
      url: 'https://example.com/feed.xml',
    })
    const expected: FeedInfo = {
      url: 'https://example.com/feed.xml',
      isFeed: true,
      format: 'rss',
    }

    expect(result).toEqual(expected)
  })

  it('should handle malformed XML content', async () => {
    const extractor = createDefaultExtractor()
    const malformed = '<?xml version="1.0"?><rss><channel><item><unclosed>'
    const result = await extractor({
      content: malformed,
      headers: new Headers(),
      url: 'https://example.com/feed.xml',
    })
    const expected: FeedInfo = {
      url: 'https://example.com/feed.xml',
      isFeed: true,
      format: 'rss',
    }

    expect(result).toEqual(expected)
  })

  it('should include URL in result', async () => {
    const extractor = createDefaultExtractor()
    const rss = '<?xml version="1.0"?><rss version="2.0"><channel></channel></rss>'
    const result = await extractor({
      content: rss,
      headers: new Headers(),
      url: 'https://redirect.example.com/feed.xml',
    })

    expect(result.url).toBe('https://redirect.example.com/feed.xml')
  })

  it('should not use headers for detection', async () => {
    const extractor = createDefaultExtractor()
    const headers = new Headers()
    headers.set('content-type', 'application/rss+xml')

    const result = await extractor({
      content: '<html>Not a feed</html>',
      headers,
      url: 'https://example.com/page.html',
    })

    // Should detect as HTML, not RSS (ignoring headers)
    const expected: FeedInfo = {
      url: 'https://example.com/page.html',
      isFeed: false,
    }

    expect(result).toEqual(expected)
  })
})
