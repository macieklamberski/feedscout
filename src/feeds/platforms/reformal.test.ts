import { describe, expect, it } from 'bun:test'
import { parseReformalUrl, type ReformalUrl, reformalHandler } from './reformal.js'

describe('parseReformalUrl', () => {
  it('should return the project for a reformal.ru subdomain', () => {
    const expected: ReformalUrl = { kind: 'project' }

    expect(parseReformalUrl('https://example.reformal.ru/')).toEqual(expected)
  })

  it('should return the project for an idea.informer.com subdomain', () => {
    const expected: ReformalUrl = { kind: 'project' }

    expect(parseReformalUrl('https://example.idea.informer.com/')).toEqual(expected)
  })

  it('should return the project for a page inside the project', () => {
    const expected: ReformalUrl = { kind: 'project' }

    expect(parseReformalUrl('https://example.reformal.ru/proj/?ia=123456')).toEqual(expected)
  })

  it('should return undefined for the apex domain', () => {
    expect(parseReformalUrl('https://reformal.ru/')).toBeUndefined()
  })

  it('should return undefined for the idea.informer.com host', () => {
    expect(parseReformalUrl('https://idea.informer.com/')).toBeUndefined()
  })

  it('should return undefined for a service host', () => {
    expect(parseReformalUrl('https://media.reformal.ru/')).toBeUndefined()
  })

  it('should return undefined for the mail host', () => {
    expect(parseReformalUrl('https://mail.reformal.ru/')).toBeUndefined()
  })

  it('should return undefined for the sites host', () => {
    expect(parseReformalUrl('https://sites.reformal.ru/')).toBeUndefined()
  })

  it('should return undefined for the www host of idea.informer.com', () => {
    expect(parseReformalUrl('https://www.idea.informer.com/')).toBeUndefined()
  })

  it('should return undefined for another informer.com host', () => {
    expect(parseReformalUrl('https://example.informer.com/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseReformalUrl('https://example.com/')).toBeUndefined()
  })
})

describe('reformalHandler', () => {
  describe('match', () => {
    it('should match a project subdomain', () => {
      expect(reformalHandler.match('https://example.reformal.ru/')).toBe(true)
    })

    it('should not match the www host', () => {
      expect(reformalHandler.match('https://www.reformal.ru/')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the feedback feed for a reformal.ru project', () => {
      const value = 'https://example.reformal.ru/'
      const expected = [
        {
          uri: 'https://example.reformal.ru/proj/rss',
          hint: { key: 'reformal:feedback', label: 'Feedback' },
        },
      ]

      expect(reformalHandler.resolve(value)).toEqual(expected)
    })

    it('should return the feedback feed for an idea.informer.com project', () => {
      const value = 'https://example.idea.informer.com/'
      const expected = [
        {
          uri: 'https://example.idea.informer.com/proj/rss',
          hint: { key: 'reformal:feedback', label: 'Feedback' },
        },
      ]

      expect(reformalHandler.resolve(value)).toEqual(expected)
    })

    it('should return the feedback feed regardless of path', () => {
      const value = 'https://example.reformal.ru/proj/?ia=123456'
      const expected = [
        {
          uri: 'https://example.reformal.ru/proj/rss',
          hint: { key: 'reformal:feedback', label: 'Feedback' },
        },
      ]

      expect(reformalHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for a URL outside Reformal', () => {
      expect(reformalHandler.resolve('https://example.com/')).toEqual([])
    })
  })
})
