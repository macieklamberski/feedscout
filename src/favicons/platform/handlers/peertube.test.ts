import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../../common/types.js'
import { peertubeHandler } from './peertube.js'

const peertubeHeaders = new Headers({ 'x-powered-by': 'PeerTube' })

describe('peertubeHandler', () => {
  describe('match', () => {
    it('should match channel page with PeerTube header', () => {
      expect(peertubeHandler.match('https://example.com/c/news', '', peertubeHeaders)).toBe(true)
    })

    it('should match account page with PeerTube header', () => {
      expect(peertubeHandler.match('https://example.com/a/alice', '', peertubeHeaders)).toBe(true)
    })

    it('should match account subpage with PeerTube header', () => {
      const value = 'https://example.com/a/alice/video-channels'

      expect(peertubeHandler.match(value, '', peertubeHeaders)).toBe(true)
    })

    it('should not match instance home with PeerTube header', () => {
      expect(peertubeHandler.match('https://example.com/', '', peertubeHeaders)).toBe(false)
    })

    it('should not match video page with PeerTube header', () => {
      expect(peertubeHandler.match('https://example.com/w/abc123', '', peertubeHeaders)).toBe(false)
    })

    it('should not match channel page without PeerTube header', () => {
      const headers = new Headers({ 'x-powered-by': 'Express' })

      expect(peertubeHandler.match('https://example.com/c/news', '', headers)).toBe(false)
    })

    it('should not match without headers', () => {
      expect(peertubeHandler.match('https://example.com/c/news')).toBe(false)
    })

    it('should not match invalid URL', () => {
      expect(peertubeHandler.match('not-a-url', '', peertubeHeaders)).toBe(false)
    })
  })

  describe('resolve', () => {
    describe('happy paths', () => {
      it('should resolve channel avatar from og:image', () => {
        const value = `
          <meta
            property="og:image"
            content="https://example.com/lazy-static/avatars/abc.png"
          />
        `
        const expected: Array<DiscoverUriEntry> = [
          { uri: 'https://example.com/lazy-static/avatars/abc.png' },
        ]

        expect(peertubeHandler.resolve('https://example.com/c/news', value)).toEqual(expected)
      })

      it('should resolve account avatar from og:image', () => {
        const value = `
          <meta
            property="og:image"
            content="https://example.com/lazy-static/avatars/def.jpg"
          />
        `
        const expected: Array<DiscoverUriEntry> = [
          { uri: 'https://example.com/lazy-static/avatars/def.jpg' },
        ]

        expect(peertubeHandler.resolve('https://example.com/a/alice', value)).toEqual(expected)
      })
    })

    describe('sad paths', () => {
      it('should return empty array for instance home', () => {
        const value = `
          <meta
            property="og:image"
            content="https://example.com/lazy-static/avatars/instance.png"
          />
        `

        expect(peertubeHandler.resolve('https://example.com/', value)).toEqual([])
      })

      it('should return empty array for invalid URL', () => {
        expect(peertubeHandler.resolve('not-a-url')).toEqual([])
      })

      it('should return empty array without content', () => {
        expect(peertubeHandler.resolve('https://example.com/c/news')).toEqual([])
      })

      it('should return empty array without og:image', () => {
        const value = '<html></html>'

        expect(peertubeHandler.resolve('https://example.com/c/news', value)).toEqual([])
      })

      it('should return empty array when og:image is outside the avatars path', () => {
        const value = '<meta property="og:image" content="https://example.com/client/og.png" />'

        expect(peertubeHandler.resolve('https://example.com/c/news', value)).toEqual([])
      })
    })

    describe('edge cases', () => {
      it('should resolve remote channel avatar from og:image', () => {
        const value = `
          <meta
            property="og:image"
            content="https://example.com/lazy-static/avatars/remote.png"
          />
        `
        const expected: Array<DiscoverUriEntry> = [
          { uri: 'https://example.com/lazy-static/avatars/remote.png' },
        ]

        expect(peertubeHandler.resolve('https://example.com/c/news@example.org', value)).toEqual(
          expected,
        )
      })
    })
  })
})
