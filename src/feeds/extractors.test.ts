import { describe, expect, it } from 'bun:test'
import type { DiscoverResult } from '../common/types.js'
import { createFeedsmithExtractor } from './extractors.js'
import type { FeedResultValid } from './types.js'

describe('createFeedsmithExtractor', () => {
  it('should return isValid: false when content is empty', async () => {
    const extractor = createFeedsmithExtractor()
    const result = await extractor({
      content: '',
      headers: new Headers(),
      url: 'https://example.com/feed.xml',
    })
    const expected: DiscoverResult<FeedResultValid> = {
      url: 'https://example.com/feed.xml',
      isValid: false,
    }

    expect(result).toEqual(expected)
  })

  it('should return isValid: false when content looks like HTML', async () => {
    const extractor = createFeedsmithExtractor()
    const html = '<!DOCTYPE html><html><head><title>Test</title></head></html>'
    const result = await extractor({
      content: html,
      headers: new Headers(),
      url: 'https://example.com/index.html',
    })
    const expected: DiscoverResult<FeedResultValid> = {
      url: 'https://example.com/index.html',
      isValid: false,
    }

    expect(result).toEqual(expected)
  })

  it('should detect RSS format from <rss> tag', async () => {
    const extractor = createFeedsmithExtractor()
    const rss = `
      <rss version="2.0">
        <channel>
          <title>Test</title>
          <link>https://example.com</link>
          <description>Test feed</description>
        </channel>
      </rss>
    `
    const result = await extractor({
      content: rss,
      headers: new Headers(),
      url: 'https://example.com/feed.xml',
    })
    const expected: DiscoverResult<FeedResultValid> = {
      url: 'https://example.com/feed.xml',
      isValid: true,
      format: 'rss',
      title: 'Test',
      description: 'Test feed',
      siteUrl: 'https://example.com',
    }

    expect(result).toEqual(expected)
  })

  it('should detect Atom format from <feed> tag', async () => {
    const extractor = createFeedsmithExtractor()
    const atom = `
      <feed xmlns="http://www.w3.org/2005/Atom">
        <title>Test</title>
        <link rel="alternate" href="https://example.com"/>
        <subtitle>Test feed</subtitle>
      </feed>
    `
    const result = await extractor({
      content: atom,
      headers: new Headers(),
      url: 'https://example.com/feed.xml',
    })
    const expected: DiscoverResult<FeedResultValid> = {
      url: 'https://example.com/feed.xml',
      isValid: true,
      format: 'atom',
      title: 'Test',
      description: 'Test feed',
      siteUrl: 'https://example.com',
    }

    expect(result).toEqual(expected)
  })

  it('should detect RDF format from <rdf> tag', async () => {
    const extractor = createFeedsmithExtractor()
    const rdf = `
      <rdf:RDF
        xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
        xmlns="http://purl.org/rss/1.0/">
        <channel>
          <title>Test</title>
          <link>https://example.com</link>
          <description>Test feed</description>
        </channel>
      </rdf:RDF>
    `
    const result = await extractor({
      content: rdf,
      headers: new Headers(),
      url: 'https://example.com/feed.xml',
    })
    const expected: DiscoverResult<FeedResultValid> = {
      url: 'https://example.com/feed.xml',
      isValid: true,
      format: 'rdf',
      title: 'Test',
      description: 'Test feed',
      siteUrl: 'https://example.com',
    }

    expect(result).toEqual(expected)
  })

  it('should detect JSON Feed format from "version" field', async () => {
    const extractor = createFeedsmithExtractor()
    const json = JSON.stringify({
      version: 'https://jsonfeed.org/version/1.1',
      title: 'Test',
      home_page_url: 'https://example.com',
      description: 'Test feed',
      items: [],
    })
    const result = await extractor({
      content: json,
      headers: new Headers(),
      url: 'https://example.com/feed.json',
    })
    const expected: DiscoverResult<FeedResultValid> = {
      url: 'https://example.com/feed.json',
      isValid: true,
      format: 'json',
      title: 'Test',
      description: 'Test feed',
      siteUrl: 'https://example.com',
    }

    expect(result).toEqual(expected)
  })

  it('should return isValid: false when no feed markers found', async () => {
    const extractor = createFeedsmithExtractor()
    const content = '<data><item>Test</item></data>'
    const result = await extractor({
      content,
      headers: new Headers(),
      url: 'https://example.com/data.xml',
    })
    const expected: DiscoverResult<FeedResultValid> = {
      url: 'https://example.com/data.xml',
      isValid: false,
    }

    expect(result).toEqual(expected)
  })

  it('should handle case-insensitive content matching', async () => {
    const extractor = createFeedsmithExtractor()
    const rss = `
      <RSS version="2.0">
        <channel>
          <title>Test</title>
          <link>https://example.com</link>
          <description>Test feed</description>
        </channel>
      </RSS>`
    const result = await extractor({
      content: rss,
      headers: new Headers(),
      url: 'https://example.com/feed.xml',
    })
    const expected: DiscoverResult<FeedResultValid> = {
      url: 'https://example.com/feed.xml',
      isValid: true,
      format: 'rss',
      title: 'Test',
      description: 'Test feed',
      siteUrl: 'https://example.com',
    }

    expect(result).toEqual(expected)
  })

  it('should prioritize HTML rejection over feed detection', async () => {
    const extractor = createFeedsmithExtractor()
    const mixed = '<html><body><rss>Not a real feed</rss></body></html>'
    const result = await extractor({
      content: mixed,
      headers: new Headers(),
      url: 'https://example.com/page.html',
    })
    const expected: DiscoverResult<FeedResultValid> = {
      url: 'https://example.com/page.html',
      isValid: false,
    }

    expect(result).toEqual(expected)
  })

  it('should handle very large content', async () => {
    const extractor = createFeedsmithExtractor()
    const largeDescription = 'a'.repeat(1000000)
    const largeRss = `
      <rss version="2.0">
        <channel>
          <title>Test</title>
          <link>https://example.com</link>
          <description>${largeDescription}</description>
        </channel>
      </rss>
    `
    const result = await extractor({
      content: largeRss,
      headers: new Headers(),
      url: 'https://example.com/feed.xml',
    })
    const expected: DiscoverResult<FeedResultValid> = {
      url: 'https://example.com/feed.xml',
      isValid: true,
      format: 'rss',
      title: 'Test',
      description: largeDescription,
      siteUrl: 'https://example.com',
    }

    expect(result).toEqual(expected)
  })

  it('should handle content with only whitespace', async () => {
    const extractor = createFeedsmithExtractor()
    const result = await extractor({
      content: '   \n\t  ',
      headers: new Headers(),
      url: 'https://example.com/feed.xml',
    })
    const expected: DiscoverResult<FeedResultValid> = {
      url: 'https://example.com/feed.xml',
      isValid: false,
    }

    expect(result).toEqual(expected)
  })

  it('should handle content with BOM characters', async () => {
    const extractor = createFeedsmithExtractor()
    const rss = `\uFEFF

      <rss version="2.0">
        <channel>
          <title>Test</title>
          <link>https://example.com</link>
          <description>Test feed</description>
        </channel>
      </rss>
    `
    const result = await extractor({
      content: rss,
      headers: new Headers(),
      url: 'https://example.com/feed.xml',
    })
    const expected: DiscoverResult<FeedResultValid> = {
      url: 'https://example.com/feed.xml',
      isValid: true,
      format: 'rss',
      title: 'Test',
      description: 'Test feed',
      siteUrl: 'https://example.com',
    }

    expect(result).toEqual(expected)
  })

  it('should return isValid: false for malformed XML content', async () => {
    const extractor = createFeedsmithExtractor()
    const malformed = '<rss><channel><item><unclosed>'
    const result = await extractor({
      content: malformed,
      headers: new Headers(),
      url: 'https://example.com/feed.xml',
    })
    const expected: DiscoverResult<FeedResultValid> = {
      url: 'https://example.com/feed.xml',
      isValid: false,
    }

    expect(result).toEqual(expected)
  })

  it('should include URL in result', async () => {
    const extractor = createFeedsmithExtractor()
    const rss = `
      <rss version="2.0">
        <channel>
          <title>Test</title>
          <link>https://example.com</link>
          <description>Test feed</description>
        </channel>
      </rss>
    `
    const result = await extractor({
      content: rss,
      headers: new Headers(),
      url: 'https://redirect.example.com/feed.xml',
    })
    const expected: DiscoverResult<FeedResultValid> = {
      url: 'https://redirect.example.com/feed.xml',
      isValid: true,
      format: 'rss',
      title: 'Test',
      description: 'Test feed',
      siteUrl: 'https://example.com',
    }

    expect(result).toEqual(expected)
  })

  it('should not use headers for detection', async () => {
    const extractor = createFeedsmithExtractor()
    const headers = new Headers()
    headers.set('content-type', 'application/rss+xml')

    const result = await extractor({
      content: '<html>Not a feed</html>',
      headers,
      url: 'https://example.com/page.html',
    })

    // Should detect as HTML, not RSS (ignoring headers)
    const expected: DiscoverResult<FeedResultValid> = {
      url: 'https://example.com/page.html',
      isValid: false,
    }

    expect(result).toEqual(expected)
  })
})
