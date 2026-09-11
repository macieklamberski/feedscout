import { describe, expect, it } from 'bun:test'
import { homelandHandler, isHomelandHtml } from './homeland.js'

const homelandHtml = '<meta name="generator" content="Homeland 3.11.0" />'
const otherHtml = '<meta name="generator" content="Discourse 3.2">'

describe('isHomelandHtml', () => {
  it('should return true for the Homeland generator meta tag', () => {
    expect(isHomelandHtml(homelandHtml)).toBe(true)
  })

  it('should return false for another forum platform', () => {
    expect(isHomelandHtml(otherHtml)).toBe(false)
  })

  it('should return false for empty content', () => {
    expect(isHomelandHtml('')).toBe(false)
  })
})

describe('homelandHandler', () => {
  describe('match', () => {
    it('should match a Homeland page', () => {
      expect(homelandHandler.match('https://example.org/topics', homelandHtml)).toBe(true)
    })

    it('should not match without content', () => {
      expect(homelandHandler.match('https://example.org/topics')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(homelandHandler.match('not-a-url', homelandHtml)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the node and topics feeds for a node page', () => {
      const value = 'https://example.org/topics/node41'
      const expected = [
        {
          uri: 'https://example.org/topics/node41/feed',
          hint: { key: 'homeland:node', label: 'Node' },
        },
        {
          uri: 'https://example.org/topics/feed',
          hint: { key: 'homeland:topics', label: 'Topics' },
        },
      ]

      expect(homelandHandler.resolve(value)).toEqual(expected)
    })

    it('should return only the topics feed elsewhere', () => {
      const value = 'https://example.org/topics'
      const expected = [
        {
          uri: 'https://example.org/topics/feed',
          hint: { key: 'homeland:topics', label: 'Topics' },
        },
      ]

      expect(homelandHandler.resolve(value)).toEqual(expected)
    })

    it('should return an empty array for invalid URLs', () => {
      expect(homelandHandler.resolve('not-a-url')).toEqual([])
    })
  })
})
