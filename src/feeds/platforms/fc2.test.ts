import { describe, expect, it } from 'bun:test'
import { type Fc2Url, fc2Handler, parseFc2Url } from './fc2.js'

describe('parseFc2Url', () => {
  it('should return the blog for a blog host', () => {
    const expected: Fc2Url = { kind: 'blog' }

    expect(parseFc2Url('https://someone.blog.fc2.com/')).toEqual(expected)
  })

  it('should return the blog for a numbered blog host', () => {
    const expected: Fc2Url = { kind: 'blog' }

    expect(parseFc2Url('https://someone.blog123.fc2.com/')).toEqual(expected)
  })

  it('should return undefined for another host', () => {
    expect(parseFc2Url('https://fc2.com/')).toBeUndefined()
  })
})

describe('fc2Handler', () => {
  describe('match', () => {
    it('should match the canonical blog host', () => {
      expect(fc2Handler.match('https://example.blog.fc2.com/')).toBe(true)
    })

    it('should match a legacy numbered blog host', () => {
      expect(fc2Handler.match('http://example.blog26.fc2.com/')).toBe(true)
    })

    it('should not match other FC2 services', () => {
      expect(fc2Handler.match('https://example.web.fc2.com/')).toBe(false)
    })

    it('should not match other hosts', () => {
      expect(fc2Handler.match('https://example.com/')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(fc2Handler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside the platform', () => {
      expect(fc2Handler.resolve('https://example.com/')).toEqual([])
    })

    it('should return the posts feed on the host in hand', () => {
      const value = 'https://example.blog.fc2.com/blog-entry-1.html'
      const expected = [
        { uri: 'https://example.blog.fc2.com/?xml', hint: { key: 'fc2:posts', label: 'Posts' } },
        {
          uri: 'https://example.blog.fc2.com/?xml&comment',
          hint: { key: 'fc2:comments', label: 'Comments' },
        },
        {
          uri: 'https://example.blog.fc2.com/?xml&trackback',
          hint: { key: 'fc2:trackbacks', label: 'Trackbacks' },
        },
      ]

      expect(fc2Handler.resolve(value)).toEqual(expected)
    })
  })
})
