import { describe, expect, it } from 'bun:test'
import { defaultExtractor } from './extractors.js'

describe('defaultExtractor', () => {
  describe('content-type header', () => {
    it('should return isValid: true for image/png content-type', async () => {
      const value = {
        url: 'https://example.com/icon.png',
        content: '',
        headers: new Headers({ 'content-type': 'image/png' }),
      }
      const expected = { url: 'https://example.com/icon.png', isValid: true }

      expect(await defaultExtractor(value)).toEqual(expected)
    })

    it('should return isValid: true for image/x-icon content-type', async () => {
      const value = {
        url: 'https://example.com/favicon.ico',
        content: '',
        headers: new Headers({ 'content-type': 'image/x-icon' }),
      }
      const expected = { url: 'https://example.com/favicon.ico', isValid: true }

      expect(await defaultExtractor(value)).toEqual(expected)
    })

    it('should return isValid: true for image/svg+xml content-type', async () => {
      const value = {
        url: 'https://example.com/icon.svg',
        content: '',
        headers: new Headers({ 'content-type': 'image/svg+xml' }),
      }
      const expected = { url: 'https://example.com/icon.svg', isValid: true }

      expect(await defaultExtractor(value)).toEqual(expected)
    })

    it('should return isValid: false for text/html content-type without other signals', async () => {
      const value = {
        url: 'https://example.com/icon.png',
        content: '',
        headers: new Headers({ 'content-type': 'text/html' }),
      }
      const expected = { url: 'https://example.com/icon.png', isValid: false }

      expect(await defaultExtractor(value)).toEqual(expected)
    })

    it('should return isValid: false for missing content-type without other signals', async () => {
      const value = { url: 'https://example.com/icon.png', content: '', headers: new Headers() }
      const expected = { url: 'https://example.com/icon.png', isValid: false }

      expect(await defaultExtractor(value)).toEqual(expected)
    })
  })

  describe('image content', () => {
    it('should return isValid: true for content starting with <svg', async () => {
      const value = {
        url: 'https://example.com/icon.svg',
        content: '<svg xmlns="http://www.w3.org/2000/svg"><circle/></svg>',
      }
      const expected = { url: 'https://example.com/icon.svg', isValid: true }

      expect(await defaultExtractor(value)).toEqual(expected)
    })

    it('should return isValid: true for content starting with <?xml followed by <svg', async () => {
      const value = {
        url: 'https://example.com/icon.svg',
        content: '<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg"></svg>',
      }
      const expected = { url: 'https://example.com/icon.svg', isValid: true }

      expect(await defaultExtractor(value)).toEqual(expected)
    })

    it('should return isValid: true for svg content with leading whitespace', async () => {
      const value = {
        url: 'https://example.com/icon.svg',
        content: '  \n  <svg xmlns="http://www.w3.org/2000/svg"></svg>',
      }
      const expected = { url: 'https://example.com/icon.svg', isValid: true }

      expect(await defaultExtractor(value)).toEqual(expected)
    })

    it('should return isValid: true for PNG magic bytes', async () => {
      const value = {
        url: 'https://example.com/icon.png',
        content: '\x89PNG\r\n\x1a\n',
      }
      const expected = { url: 'https://example.com/icon.png', isValid: true }

      expect(await defaultExtractor(value)).toEqual(expected)
    })

    it('should return isValid: true for GIF89a magic bytes', async () => {
      const value = {
        url: 'https://example.com/icon.gif',
        content: 'GIF89a\x00\x00',
      }
      const expected = { url: 'https://example.com/icon.gif', isValid: true }

      expect(await defaultExtractor(value)).toEqual(expected)
    })

    it('should return isValid: true for GIF87a magic bytes', async () => {
      const value = {
        url: 'https://example.com/icon.gif',
        content: 'GIF87a\x00\x00',
      }
      const expected = { url: 'https://example.com/icon.gif', isValid: true }

      expect(await defaultExtractor(value)).toEqual(expected)
    })

    it('should return isValid: true for WebP magic bytes', async () => {
      const value = {
        url: 'https://example.com/icon.webp',
        content: 'RIFF\x00\x00\x00\x00WEBP',
      }
      const expected = { url: 'https://example.com/icon.webp', isValid: true }

      expect(await defaultExtractor(value)).toEqual(expected)
    })

    it('should return isValid: false for RSS feed with svg in entry content', async () => {
      const value = {
        url: 'https://example.com/feed.xml',
        content: '<?xml version="1.0"?><rss><channel><item><description>&lt;svg xmlns="http://www.w3.org/2000/svg"&gt;&lt;/svg&gt;</description></item></channel></rss>',
      }
      const expected = { url: 'https://example.com/feed.xml', isValid: false }

      expect(await defaultExtractor(value)).toEqual(expected)
    })

    it('should return isValid: false for <?xml without <svg', async () => {
      const value = {
        url: 'https://example.com/feed.xml',
        content: '<?xml version="1.0"?><rss><channel></channel></rss>',
      }
      const expected = { url: 'https://example.com/feed.xml', isValid: false }

      expect(await defaultExtractor(value)).toEqual(expected)
    })

    it('should return isValid: false for html content', async () => {
      const value = {
        url: 'https://example.com',
        content: '<html><head></head><body></body></html>',
      }
      const expected = { url: 'https://example.com', isValid: false }

      expect(await defaultExtractor(value)).toEqual(expected)
    })

    it('should return isValid: false for html content with embedded svg', async () => {
      const value = {
        url: 'https://example.com',
        content:
          '<html><body><svg xmlns="http://www.w3.org/2000/svg"><circle r="10"/></svg></body></html>',
      }
      const expected = { url: 'https://example.com', isValid: false }

      expect(await defaultExtractor(value)).toEqual(expected)
    })
  })

  describe('status code', () => {
    it('should return isValid: true for status 200', async () => {
      const value = { url: 'https://example.com/icon.png', content: '', status: 200 }
      const expected = { url: 'https://example.com/icon.png', isValid: true }

      expect(await defaultExtractor(value)).toEqual(expected)
    })

    it('should return isValid: true for status 299', async () => {
      const value = { url: 'https://example.com/icon.png', content: '', status: 299 }
      const expected = { url: 'https://example.com/icon.png', isValid: true }

      expect(await defaultExtractor(value)).toEqual(expected)
    })

    it('should return isValid: true for status 301', async () => {
      const value = { url: 'https://example.com/icon.png', content: '', status: 301 }
      const expected = { url: 'https://example.com/icon.png', isValid: true }

      expect(await defaultExtractor(value)).toEqual(expected)
    })

    it('should return isValid: true for status 399', async () => {
      const value = { url: 'https://example.com/icon.png', content: '', status: 399 }
      const expected = { url: 'https://example.com/icon.png', isValid: true }

      expect(await defaultExtractor(value)).toEqual(expected)
    })

    it('should return isValid: false for status 400', async () => {
      const value = { url: 'https://example.com/icon.png', content: '', status: 400 }
      const expected = { url: 'https://example.com/icon.png', isValid: false }

      expect(await defaultExtractor(value)).toEqual(expected)
    })

    it('should return isValid: false for status 404', async () => {
      const value = { url: 'https://example.com/icon.png', content: '', status: 404 }
      const expected = { url: 'https://example.com/icon.png', isValid: false }

      expect(await defaultExtractor(value)).toEqual(expected)
    })

    it('should return isValid: false for status 500', async () => {
      const value = { url: 'https://example.com/icon.png', content: '', status: 500 }
      const expected = { url: 'https://example.com/icon.png', isValid: false }

      expect(await defaultExtractor(value)).toEqual(expected)
    })

    it('should return isValid: false for status 199', async () => {
      const value = { url: 'https://example.com/icon.png', content: '', status: 199 }
      const expected = { url: 'https://example.com/icon.png', isValid: false }

      expect(await defaultExtractor(value)).toEqual(expected)
    })

    it('should return isValid: false for undefined status without other signals', async () => {
      const value = { url: 'https://example.com/icon.png', content: '' }
      const expected = { url: 'https://example.com/icon.png', isValid: false }

      expect(await defaultExtractor(value)).toEqual(expected)
    })
  })
})
