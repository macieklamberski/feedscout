import { describe, expect, it } from 'bun:test'
import type { FetchFnResponse, Result } from './types.js'
import { createContentValidator, createMimeTypeValidator } from './validators.js'

const createMockResponse = (
  url: string,
  contentType: string | null,
  body: string | ReadableStream<Uint8Array>,
): FetchFnResponse => {
  const headers = new Headers()

  if (contentType) {
    headers.set('content-type', contentType)
  }

  return {
    headers,
    body,
    url,
    status: 200,
    statusText: 'OK',
  }
}

describe('createMimeTypeValidator', () => {
  it('should return isFeed: false when no content-type header', async () => {
    const validator = createMimeTypeValidator(['application/rss+xml'])
    const response = createMockResponse('https://example.com/feed.xml', null, '')
    const expected: Result = {
      url: 'https://example.com/feed.xml',
      isFeed: false,
    }

    expect(await validator(response)).toEqual(expected)
  })

  it('should return isFeed: false when content-type does not match allowed mimeTypes', async () => {
    const validator = createMimeTypeValidator(['application/rss+xml'])
    const response = createMockResponse('https://example.com/feed.xml', 'text/html', '')
    const expected: Result = {
      url: 'https://example.com/feed.xml',
      isFeed: false,
    }

    expect(await validator(response)).toEqual(expected)
  })

  it('should detect RSS format from content-type', async () => {
    const validator = createMimeTypeValidator(['application/rss+xml'])
    const response = createMockResponse('https://example.com/feed.xml', 'application/rss+xml', '')
    const expected: Result = {
      url: 'https://example.com/feed.xml',
      isFeed: true,
      feedFormat: 'rss',
    }

    expect(await validator(response)).toEqual(expected)
  })

  it('should detect Atom format from content-type', async () => {
    const validator = createMimeTypeValidator(['application/atom+xml'])
    const response = createMockResponse('https://example.com/feed.xml', 'application/atom+xml', '')
    const expected: Result = {
      url: 'https://example.com/feed.xml',
      isFeed: true,
      feedFormat: 'atom',
    }

    expect(await validator(response)).toEqual(expected)
  })

  it('should detect JSON format from content-type', async () => {
    const validator = createMimeTypeValidator(['application/feed+json'])
    const response = createMockResponse(
      'https://example.com/feed.json',
      'application/feed+json',
      '',
    )
    const expected: Result = {
      url: 'https://example.com/feed.json',
      isFeed: true,
      feedFormat: 'json',
    }

    expect(await validator(response)).toEqual(expected)
  })

  it('should detect RDF format from content-type', async () => {
    const validator = createMimeTypeValidator(['application/rdf+xml'])
    const response = createMockResponse('https://example.com/feed.xml', 'application/rdf+xml', '')
    const expected: Result = {
      url: 'https://example.com/feed.xml',
      isFeed: true,
      feedFormat: 'rdf',
    }

    expect(await validator(response)).toEqual(expected)
  })

  it('should default to RSS when valid MIME type but no specific format detected', async () => {
    const validator = createMimeTypeValidator(['application/xml'])
    const response = createMockResponse('https://example.com/feed.xml', 'application/xml', '')
    const expected: Result = {
      url: 'https://example.com/feed.xml',
      isFeed: true,
      feedFormat: 'rss',
    }

    expect(await validator(response)).toEqual(expected)
  })

  it('should handle case-insensitive content-type matching', async () => {
    const validator = createMimeTypeValidator(['application/rss+xml'])
    const response = createMockResponse('https://example.com/feed.xml', 'APPLICATION/RSS+XML', '')
    const expected: Result = {
      url: 'https://example.com/feed.xml',
      isFeed: true,
      feedFormat: 'rss',
    }

    expect(await validator(response)).toEqual(expected)
  })

  it('should include response URL in result', async () => {
    const validator = createMimeTypeValidator(['application/rss+xml'])
    const response = createMockResponse(
      'https://redirect.example.com/feed.xml',
      'application/rss+xml',
      '',
    )

    const result = await validator(response)

    expect(result.url).toBe('https://redirect.example.com/feed.xml')
  })

  it('should handle content-type with charset parameter', async () => {
    const validator = createMimeTypeValidator(['application/rss+xml'])
    const response = createMockResponse(
      'https://example.com/feed.xml',
      'application/rss+xml; charset=utf-8',
      '',
    )
    const expected: Result = {
      url: 'https://example.com/feed.xml',
      isFeed: true,
      feedFormat: 'rss',
    }

    expect(await validator(response)).toEqual(expected)
  })
})

describe('createContentValidator', () => {
  it('should return isFeed: false when body is not string', async () => {
    const validator = createContentValidator()
    const stream = new ReadableStream<Uint8Array>()
    const response = createMockResponse('https://example.com/feed.xml', null, stream)
    const expected: Result = {
      url: 'https://example.com/feed.xml',
      isFeed: false,
    }

    expect(await validator(response)).toEqual(expected)
  })

  it('should return isFeed: false when content looks like HTML', async () => {
    const validator = createContentValidator()
    const html = '<!DOCTYPE html><html><head><title>Test</title></head></html>'
    const response = createMockResponse('https://example.com/index.html', null, html)
    const expected: Result = {
      url: 'https://example.com/index.html',
      isFeed: false,
    }

    expect(await validator(response)).toEqual(expected)
  })

  it('should detect RSS format from <rss> tag', async () => {
    const validator = createContentValidator()
    const rss = '<?xml version="1.0"?><rss version="2.0"><channel></channel></rss>'
    const response = createMockResponse('https://example.com/feed.xml', null, rss)
    const expected: Result = {
      url: 'https://example.com/feed.xml',
      isFeed: true,
      feedFormat: 'rss',
    }

    expect(await validator(response)).toEqual(expected)
  })

  it('should detect Atom format from <feed> tag', async () => {
    const validator = createContentValidator()
    const atom = '<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom"></feed>'
    const response = createMockResponse('https://example.com/feed.xml', null, atom)
    const expected: Result = {
      url: 'https://example.com/feed.xml',
      isFeed: true,
      feedFormat: 'atom',
    }

    expect(await validator(response)).toEqual(expected)
  })

  it('should detect RDF format from <rdf> tag', async () => {
    const validator = createContentValidator()
    const rdf =
      '<?xml version="1.0"?><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"></rdf:RDF>'
    const response = createMockResponse('https://example.com/feed.xml', null, rdf)
    const expected: Result = {
      url: 'https://example.com/feed.xml',
      isFeed: true,
      feedFormat: 'rdf',
    }

    expect(await validator(response)).toEqual(expected)
  })

  it('should detect JSON format from "version" field', async () => {
    const validator = createContentValidator()
    const json = '{"version": "https://jsonfeed.org/version/1.1", "title": "Test"}'
    const response = createMockResponse('https://example.com/feed.json', null, json)
    const expected: Result = {
      url: 'https://example.com/feed.json',
      isFeed: true,
      feedFormat: 'json',
    }

    expect(await validator(response)).toEqual(expected)
  })

  it('should return isFeed: false when no feed markers found', async () => {
    const validator = createContentValidator()
    const content = '<?xml version="1.0"?><data><item>Test</item></data>'
    const response = createMockResponse('https://example.com/data.xml', null, content)
    const expected: Result = {
      url: 'https://example.com/data.xml',
      isFeed: false,
    }

    expect(await validator(response)).toEqual(expected)
  })

  it('should include response URL in result', async () => {
    const validator = createContentValidator()
    const rss = '<?xml version="1.0"?><rss version="2.0"><channel></channel></rss>'
    const response = createMockResponse('https://redirect.example.com/feed.xml', null, rss)

    const result = await validator(response)

    expect(result.url).toBe('https://redirect.example.com/feed.xml')
  })

  it('should handle case-insensitive content matching', async () => {
    const validator = createContentValidator()
    const rss = '<?xml version="1.0"?><RSS version="2.0"><channel></channel></RSS>'
    const response = createMockResponse('https://example.com/feed.xml', null, rss)
    const expected: Result = {
      url: 'https://example.com/feed.xml',
      isFeed: true,
      feedFormat: 'rss',
    }

    expect(await validator(response)).toEqual(expected)
  })

  it('should prioritize HTML rejection over feed detection', async () => {
    const validator = createContentValidator()
    const mixed = '<html><body><rss>Not a real feed</rss></body></html>'
    const response = createMockResponse('https://example.com/page.html', null, mixed)
    const expected: Result = {
      url: 'https://example.com/page.html',
      isFeed: false,
    }

    expect(await validator(response)).toEqual(expected)
  })

  it('should handle very large response bodies', async () => {
    const validator = createContentValidator()
    const largeRss = `<rss version="2.0"><channel>${'a'.repeat(1000000)}</channel></rss>`
    const response = createMockResponse('https://example.com/feed.xml', null, largeRss)
    const expected: Result = {
      url: 'https://example.com/feed.xml',
      isFeed: true,
      feedFormat: 'rss' as const,
    }

    expect(await validator(response)).toEqual(expected)
  })

  it('should handle empty body', async () => {
    const validator = createContentValidator()
    const response = createMockResponse('https://example.com/feed.xml', null, '')
    const expected: Result = {
      url: 'https://example.com/feed.xml',
      isFeed: false,
    }

    expect(await validator(response)).toEqual(expected)
  })

  it('should handle malformed XML content', async () => {
    const validator = createContentValidator()
    const malformed = '<?xml version="1.0"?><rss><channel><item><unclosed>'
    const response = createMockResponse('https://example.com/feed.xml', null, malformed)
    const expected: Result = {
      url: 'https://example.com/feed.xml',
      isFeed: true,
      feedFormat: 'rss' as const,
    }

    expect(await validator(response)).toEqual(expected)
  })

  it('should handle content with only whitespace', async () => {
    const validator = createContentValidator()
    const response = createMockResponse('https://example.com/feed.xml', null, '   \n\t  ')
    const expected: Result = {
      url: 'https://example.com/feed.xml',
      isFeed: false,
    }

    expect(await validator(response)).toEqual(expected)
  })

  it('should handle content with BOM characters', async () => {
    const validator = createContentValidator()
    const rss = '\uFEFF<?xml version="1.0"?><rss version="2.0"><channel></channel></rss>'
    const response = createMockResponse('https://example.com/feed.xml', null, rss)
    const expected: Result = {
      url: 'https://example.com/feed.xml',
      isFeed: true,
      feedFormat: 'rss' as const,
    }

    expect(await validator(response)).toEqual(expected)
  })

  it('should handle mixed newline types in content', async () => {
    const validator = createContentValidator()
    const rss = '<?xml version="1.0"?>\r\n<rss version="2.0">\r<channel>\n</channel>\r\n</rss>'
    const response = createMockResponse('https://example.com/feed.xml', null, rss)
    const expected: Result = {
      url: 'https://example.com/feed.xml',
      isFeed: true,
      feedFormat: 'rss' as const,
    }

    expect(await validator(response)).toEqual(expected)
  })

  it('should handle content with special XML entities', async () => {
    const validator = createContentValidator()
    const rss = '<?xml version="1.0"?><rss>&lt;channel&gt;&amp;</rss>'
    const response = createMockResponse('https://example.com/feed.xml', null, rss)
    const expected: Result = {
      url: 'https://example.com/feed.xml',
      isFeed: true,
      feedFormat: 'rss' as const,
    }

    expect(await validator(response)).toEqual(expected)
  })

  it('should handle content with CDATA sections', async () => {
    const validator = createContentValidator()
    const rss = '<?xml version="1.0"?><rss><![CDATA[some content]]></rss>'
    const response = createMockResponse('https://example.com/feed.xml', null, rss)
    const expected: Result = {
      url: 'https://example.com/feed.xml',
      isFeed: true,
      feedFormat: 'rss' as const,
    }

    expect(await validator(response)).toEqual(expected)
  })
})
