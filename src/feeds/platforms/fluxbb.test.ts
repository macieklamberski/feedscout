import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { fluxbbHandler, isFluxbbHtml } from './fluxbb.js'

const fluxbbHtml = '<div id="brdheader"></div><div id="brdmain"></div>'
const partialHtml = '<div id="brdmain"></div>'

describe('isFluxbbHtml', () => {
  it('should return true when both board wrappers are present', () => {
    expect(isFluxbbHtml(fluxbbHtml)).toBe(true)
  })

  it('should return true for the menu and footer a custom template keeps', () => {
    expect(isFluxbbHtml('<div id="brdmenu"></div><div id="brdfooter"></div>')).toBe(true)
  })

  it('should return true for single-quoted board wrapper ids', () => {
    expect(isFluxbbHtml("<div id='brdheader'></div><div id='brdmain'></div>")).toBe(true)
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
    it('should return the forum feed for a capitalized viewforum.php segment', () => {
      const value = 'https://example.org/Viewforum.php?id=3'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.org/extern.php?action=feed&fid=3&type=atom',
          hint: { key: 'fluxbb:forum', label: 'Forum' },
        },
        {
          uri: 'https://example.org/extern.php?action=feed&type=RSS',
          hint: { key: 'fluxbb:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://example.org/extern.php?action=feed&type=atom',
          hint: { key: 'fluxbb:posts', label: 'Posts', format: 'atom' },
        },
      ]

      expect(fluxbbHandler.resolve(value)).toEqual(expected)
    })

    it('should return both feed formats', () => {
      const value = 'https://example.org/index.php'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.org/extern.php?action=feed&type=RSS',
          hint: { key: 'fluxbb:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://example.org/extern.php?action=feed&type=atom',
          hint: { key: 'fluxbb:posts', label: 'Posts', format: 'atom' },
        },
      ]

      expect(fluxbbHandler.resolve(value)).toEqual(expected)
    })

    it('should add the forum feed for a forum page', () => {
      const value = 'https://example.org/viewforum.php?id=3'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.org/extern.php?action=feed&fid=3&type=atom',
          hint: { key: 'fluxbb:forum', label: 'Forum' },
        },
        {
          uri: 'https://example.org/extern.php?action=feed&type=RSS',
          hint: { key: 'fluxbb:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://example.org/extern.php?action=feed&type=atom',
          hint: { key: 'fluxbb:posts', label: 'Posts', format: 'atom' },
        },
      ]

      expect(fluxbbHandler.resolve(value)).toEqual(expected)
    })

    it('should add the topic feed for a topic page', () => {
      const value = 'https://example.org/viewtopic.php?id=7520'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.org/extern.php?action=feed&tid=7520&type=atom',
          hint: { key: 'fluxbb:topic', label: 'Topic' },
        },
        {
          uri: 'https://example.org/extern.php?action=feed&type=RSS',
          hint: { key: 'fluxbb:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://example.org/extern.php?action=feed&type=atom',
          hint: { key: 'fluxbb:posts', label: 'Posts', format: 'atom' },
        },
      ]

      expect(fluxbbHandler.resolve(value)).toEqual(expected)
    })

    it('should build the feeds from a board under a sub-path', () => {
      const value = 'https://example.org/forums/index.php'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.org/forums/extern.php?action=feed&type=RSS',
          hint: { key: 'fluxbb:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://example.org/forums/extern.php?action=feed&type=atom',
          hint: { key: 'fluxbb:posts', label: 'Posts', format: 'atom' },
        },
      ]

      expect(fluxbbHandler.resolve(value)).toEqual(expected)
    })
  })
})
