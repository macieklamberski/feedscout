import { describe, expect, it } from 'bun:test'
import { podloveHandler } from './podlove.js'

const stylesheet = `
  <link
    rel="stylesheet"
    id="podlove-frontend-css-css"
    href="https://example.com/wp-content/plugins/podlove-podcasting-plugin-for-wordpress/css/frontend.css?ver=1.0"
  >
`
const mp3Link = `
  <link
    rel="alternate"
    type="application/rss+xml"
    title="Podcast Feed: Example Show (MP3 Audio)"
    href="https://example.com/feed/mp3/"
  >
`
const blogLink = `
  <link
    rel="alternate"
    type="application/rss+xml"
    title="Example Show &raquo; Feed"
    href="https://example.com/feed/"
  >
`

describe('podloveHandler', () => {
  describe('match', () => {
    it('should match a page of a site running the plugin', () => {
      const value = `${stylesheet}${mp3Link}`

      expect(podloveHandler.match('https://example.com/', value)).toBe(true)
    })

    it('should not match a feed link without the plugin stylesheet', () => {
      expect(podloveHandler.match('https://example.com/', mp3Link)).toBe(false)
    })

    it('should not match the plugin stylesheet without a discoverable feed', () => {
      const value = `${stylesheet}${blogLink}`

      expect(podloveHandler.match('https://example.com/', value)).toBe(false)
    })

    it('should not match without content', () => {
      expect(podloveHandler.match('https://example.com/')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(podloveHandler.match('not-a-url', `${stylesheet}${mp3Link}`)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return every podcast feed the page links, skipping the blog feed', () => {
      const opusLink = `
        <link
          rel="alternate"
          type="application/rss+xml"
          title="Podcast Feed: Example Show (Ogg Opus Audio)"
          href="https://example.com/feed/opus/"
        >
      `
      const value = `${stylesheet}${blogLink}${mp3Link}${opusLink}`
      const expected = [
        {
          uri: 'https://example.com/feed/mp3/',
          hint: { key: 'podlove:podcast', label: 'Podcast' },
        },
        {
          uri: 'https://example.com/feed/opus/',
          hint: { key: 'podlove:podcast', label: 'Podcast' },
        },
      ]

      expect(podloveHandler.resolve('https://example.com/an-episode/', value)).toEqual(expected)
    })

    it('should resolve a relative feed link against the page', () => {
      const relativeLink = `
        <link
          rel="alternate"
          type="application/rss+xml"
          title="Podcast Feed: Example Show (Podcast MP3)"
          href="/feed/podcast-mp3/"
        >
      `
      const value = `${stylesheet}${relativeLink}`
      const expected = [
        {
          uri: 'https://example.com/feed/podcast-mp3/',
          hint: { key: 'podlove:podcast', label: 'Podcast' },
        },
      ]

      expect(podloveHandler.resolve('https://example.com/', value)).toEqual(expected)
    })

    it('should skip a feed link whose address does not parse', () => {
      const brokenLink = `
        <link
          rel="alternate"
          type="application/rss+xml"
          title="Podcast Feed: Example Show (MP3 Audio)"
          href="https://["
        >
      `
      const value = `${stylesheet}${brokenLink}`

      expect(podloveHandler.resolve('https://example.com/', value)).toEqual([])
    })
  })
})
