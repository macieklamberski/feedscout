import { describe, expect, it } from 'bun:test'
import { edlioHandler, isEdlioHtml } from './edlio.js'

const homeHtml = `
  <html class="edlio desktop">
    <head>
      <meta
        name="generator"
        content="Edlio CMS"
      >
      <script src="/apps/js/common/list-pack.js"></script>
    </head>
  </html>
`
const newsHtml = `
  <html class="edlio desktop">
    <head>
      <link
        rel="alternate"
        type="application/rss+xml"
        title="Example School: News &amp; Announcements"
        href="/apps/news/rss?categoryid=12345"
      />
      <script src="/apps/js/common/list-pack.js"></script>
    </head>
  </html>
`
const classHtml = `
  <html class="edlio desktop">
    <head>
      <script src="/apps/js/common/list-pack.js"></script>
    </head>
    <body>
      <section id="upcoming_homework">
        <h2 id="upcoming_homework_header">
          Upcoming Assignments
          <a
            class="homework-rss-button"
            href="/apps/classes/assignment_rss.jsp?classREC_ID=67890"
          >
            <img src="/apps/pics/feed-icon-28x28.png" alt="RSS Feed">
          </a>
        </h2>
      </section>
    </body>
  </html>
`
const generatorOnlyHtml = `
  <head>
    <meta
      name="generator"
      content="Edlio CMS"
    >
  </head>
`

describe('isEdlioHtml', () => {
  it('should return true for the list-pack script', () => {
    expect(isEdlioHtml(homeHtml)).toBe(true)
  })

  it('should return false for the generator meta alone', () => {
    expect(isEdlioHtml(generatorOnlyHtml)).toBe(false)
  })

  it('should return false for empty content', () => {
    expect(isEdlioHtml('')).toBe(false)
  })
})

describe('edlioHandler', () => {
  describe('match', () => {
    it('should match an Edlio page', () => {
      expect(edlioHandler.match('https://example.com/', homeHtml)).toBe(true)
    })

    it('should not match without content', () => {
      expect(edlioHandler.match('https://example.com/')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the news feed for the home page', () => {
      const value = 'https://example.com/'
      const expected = [
        {
          uri: 'https://example.com/apps/news/rss',
          hint: { key: 'edlio:news', label: 'News' },
        },
      ]

      expect(edlioHandler.resolve(value, homeHtml)).toEqual(expected)
    })

    it('should return the linked category feed for the news page', () => {
      const value = 'https://example.com/apps/news/'
      const expected = [
        {
          uri: 'https://example.com/apps/news/rss?categoryid=12345',
          hint: { key: 'edlio:news', label: 'News' },
        },
      ]

      expect(edlioHandler.resolve(value, newsHtml)).toEqual(expected)
    })

    it('should return the linked assignments feed for a class page', () => {
      const value = 'https://example.com/apps/classes/67890/assignments/'
      const expected = [
        {
          uri: 'https://example.com/apps/classes/assignment_rss.jsp?classREC_ID=67890',
          hint: { key: 'edlio:assignments', label: 'Assignments' },
        },
      ]

      expect(edlioHandler.resolve(value, classHtml)).toEqual(expected)
    })

    it('should return the news feed for a class page without the assignments link', () => {
      const value = 'https://example.com/apps/classes/67890/assignments/'
      const expected = [
        {
          uri: 'https://example.com/apps/news/rss',
          hint: { key: 'edlio:news', label: 'News' },
        },
      ]

      expect(edlioHandler.resolve(value, homeHtml)).toEqual(expected)
    })

    it('should return the news feed for a class page linking another class', () => {
      const value = 'https://example.com/apps/classes/11111/assignments/'
      const expected = [
        {
          uri: 'https://example.com/apps/news/rss',
          hint: { key: 'edlio:news', label: 'News' },
        },
      ]

      expect(edlioHandler.resolve(value, classHtml)).toEqual(expected)
    })

    it('should return the news feed for a page linking a class outside the class path', () => {
      const value = 'https://example.com/'
      const expected = [
        {
          uri: 'https://example.com/apps/news/rss',
          hint: { key: 'edlio:news', label: 'News' },
        },
      ]

      expect(edlioHandler.resolve(value, classHtml)).toEqual(expected)
    })
  })
})
