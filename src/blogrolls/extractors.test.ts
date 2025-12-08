import { describe, expect, it } from 'bun:test'
import type { DiscoverResult } from '../common/types.js'
import { defaultExtractor } from './extractors.js'
import type { BlogrollResult } from './types.js'

describe('defaultExtractor', () => {
  it('should return isValid: false when content is empty', async () => {
    const result = await defaultExtractor({
      content: '',
      headers: new Headers(),
      url: 'https://example.com/blogroll.opml',
    })
    const expected: DiscoverResult<BlogrollResult> = {
      url: 'https://example.com/blogroll.opml',
      isValid: false,
    }

    expect(result).toEqual(expected)
  })

  it('should return isValid: false when content looks like HTML', async () => {
    const html = '<!DOCTYPE html><html><head><title>Test</title></head></html>'
    const result = await defaultExtractor({
      content: html,
      headers: new Headers(),
      url: 'https://example.com/index.html',
    })
    const expected: DiscoverResult<BlogrollResult> = {
      url: 'https://example.com/index.html',
      isValid: false,
    }

    expect(result).toEqual(expected)
  })

  it('should detect OPML 1.0 format', async () => {
    const opml = `<?xml version="1.0" encoding="UTF-8"?>
      <opml version="1.0">
        <head>
          <title>My Blogroll</title>
        </head>
        <body>
          <outline text="Example Blog" type="rss" xmlUrl="https://example.com/feed.xml"/>
        </body>
      </opml>
    `
    const result = await defaultExtractor({
      content: opml,
      headers: new Headers(),
      url: 'https://example.com/blogroll.opml',
    })
    const expected: DiscoverResult<BlogrollResult> = {
      url: 'https://example.com/blogroll.opml',
      isValid: true,
      title: 'My Blogroll',
    }

    expect(result).toEqual(expected)
  })

  it('should detect OPML 2.0 format', async () => {
    const opml = `<?xml version="1.0" encoding="UTF-8"?>
      <opml version="2.0">
        <head>
          <title>Subscriptions</title>
          <dateCreated>Mon, 01 Jan 2024 00:00:00 GMT</dateCreated>
        </head>
        <body>
          <outline text="Tech" title="Technology">
            <outline type="rss" text="TechCrunch" xmlUrl="https://techcrunch.com/feed/"/>
          </outline>
        </body>
      </opml>
    `
    const result = await defaultExtractor({
      content: opml,
      headers: new Headers(),
      url: 'https://example.com/subscriptions.opml',
    })
    const expected: DiscoverResult<BlogrollResult> = {
      url: 'https://example.com/subscriptions.opml',
      isValid: true,
      title: 'Subscriptions',
    }

    expect(result).toEqual(expected)
  })

  it('should handle OPML without title', async () => {
    const opml = `<?xml version="1.0" encoding="UTF-8"?>
      <opml version="2.0">
        <head></head>
        <body>
          <outline text="Blog" type="rss" xmlUrl="https://example.com/feed.xml"/>
        </body>
      </opml>
    `
    const result = await defaultExtractor({
      content: opml,
      headers: new Headers(),
      url: 'https://example.com/blogroll.opml',
    })
    const expected: DiscoverResult<BlogrollResult> = {
      url: 'https://example.com/blogroll.opml',
      isValid: true,
      title: undefined,
    }

    expect(result).toEqual(expected)
  })

  it('should return isValid: false for non-XML content', async () => {
    const nonXml = 'this is just plain text, not XML or OPML'
    const result = await defaultExtractor({
      content: nonXml,
      headers: new Headers(),
      url: 'https://example.com/blogroll.opml',
    })
    const expected: DiscoverResult<BlogrollResult> = {
      url: 'https://example.com/blogroll.opml',
      isValid: false,
    }

    expect(result).toEqual(expected)
  })

  it('should return isValid: false for RSS content', async () => {
    const rss = `<?xml version="1.0" encoding="UTF-8"?>
      <rss version="2.0">
        <channel>
          <title>Test</title>
          <link>https://example.com</link>
        </channel>
      </rss>
    `
    const result = await defaultExtractor({
      content: rss,
      headers: new Headers(),
      url: 'https://example.com/feed.xml',
    })
    const expected: DiscoverResult<BlogrollResult> = {
      url: 'https://example.com/feed.xml',
      isValid: false,
    }

    expect(result).toEqual(expected)
  })

  it('should include URL in result', async () => {
    const opml = `<?xml version="1.0" encoding="UTF-8"?>
      <opml version="2.0">
        <head><title>Test</title></head>
        <body></body>
      </opml>
    `
    const result = await defaultExtractor({
      content: opml,
      headers: new Headers(),
      url: 'https://redirect.example.com/blogroll.opml',
    })
    const expected: DiscoverResult<BlogrollResult> = {
      url: 'https://redirect.example.com/blogroll.opml',
      isValid: true,
      title: 'Test',
    }

    expect(result).toEqual(expected)
  })

  it('should handle content with only whitespace', async () => {
    const result = await defaultExtractor({
      content: '   \n\t  ',
      headers: new Headers(),
      url: 'https://example.com/blogroll.opml',
    })
    const expected: DiscoverResult<BlogrollResult> = {
      url: 'https://example.com/blogroll.opml',
      isValid: false,
    }

    expect(result).toEqual(expected)
  })

  it('should handle content with BOM characters', async () => {
    const opml = `\uFEFF<?xml version="1.0" encoding="UTF-8"?>
      <opml version="2.0">
        <head><title>Test</title></head>
        <body></body>
      </opml>
    `
    const result = await defaultExtractor({
      content: opml,
      headers: new Headers(),
      url: 'https://example.com/blogroll.opml',
    })
    const expected: DiscoverResult<BlogrollResult> = {
      url: 'https://example.com/blogroll.opml',
      isValid: true,
      title: 'Test',
    }

    expect(result).toEqual(expected)
  })
})
