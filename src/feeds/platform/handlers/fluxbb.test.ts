import { describe, expect, it } from 'bun:test'
import { fluxbbHandler, isFluxbbHtml } from './fluxbb.js'

const fluxbbHtml = '<div id="brdheader"></div><div id="brdmain"></div>'
const partialHtml = '<div id="brdmain"></div>'

describe('isFluxbbHtml', () => {
  it('should return true when both board wrappers are present', () => {
    expect(isFluxbbHtml(fluxbbHtml)).toBe(true)
  })

  it('should return false when only one wrapper is present', () => {
    expect(isFluxbbHtml(partialHtml)).toBe(false)
  })

  it('should return false for empty content', () => {
    expect(isFluxbbHtml('')).toBe(false)
  })
})

describe('fluxbbHandler', () => {
  describe('match', () => {
    it('should match a FluxBB board', () => {
      expect(fluxbbHandler.match('https://example.org/', fluxbbHtml)).toBe(true)
    })

    it('should not match without content', () => {
      expect(fluxbbHandler.match('https://example.org/')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(fluxbbHandler.match('not-a-url', fluxbbHtml)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return both feed formats', () => {
      const value = 'https://example.org/viewforum.php?id=3'
      const expected = [
        {
          uri: 'https://example.org/extern.php?action=feed&type=RSS',
          hint: { key: 'fluxbb:posts-rss', label: 'Posts (RSS)' },
        },
        {
          uri: 'https://example.org/extern.php?action=feed&type=atom',
          hint: { key: 'fluxbb:posts-atom', label: 'Posts (Atom)' },
        },
      ]

      expect(fluxbbHandler.resolve(value)).toEqual(expected)
    })

    it('should return an empty array for invalid URLs', () => {
      expect(fluxbbHandler.resolve('not-a-url')).toEqual([])
    })
  })
})
