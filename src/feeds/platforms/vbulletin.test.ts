import { describe, expect, it } from 'bun:test'
import { isVbulletinHeaders, isVbulletinHtml, vbulletinHandler } from './vbulletin.js'

const juliForumHtml = `
  <script
    type="text/javascript"
    src="https://juli-forum.de/clientscript/vbulletin-core.js?v=425"
  ></script>
`
const aquaticQuotientHtml = `
  <script
    type="text/javascript"
    src="https://www.aquaticquotient.com/forum/clientscript/vbulletin-core.js?v=425"
  ></script>
`
const gpspowerHtml = `
  <base href="https://www.gpspower.net/other-gps-systems.html" />
  <script
    type="text/javascript"
    src="https://www.gpspower.net/clientscript/vbulletin-core.js?v=424"
  ></script>
`
const apolytonHtml = `
  <base href="https://apolyton.net/" />
  <script
    type="text/javascript"
    src="js/header-rollup-575.js"
  ></script>
`
const loganClubHtml = `
  <base href="https://www.loganclub.ro/forum/" />
  <script
    type="text/javascript"
    src="js/header-rollup-575.js"
  ></script>
`

const getCookieHeaders = (names: Array<string>): Headers => {
  const headers = new Headers()

  for (const name of names) {
    headers.append('set-cookie', `${name}=1; path=/`)
  }

  return headers
}

describe('isVbulletinHtml', () => {
  it('should return true for the vBulletin 4 core script', () => {
    expect(isVbulletinHtml(juliForumHtml)).toBe(true)
  })

  it('should return true for a core script renamed by PageSpeed', () => {
    const value = `
      <script
        type="text/javascript"
        src="https://www.tennisforum.gr/clientscript/vbulletin-core.js,qv=425.pagespeed.ce.Q1QoBgTl-w.js"
      ></script>
    `

    expect(isVbulletinHtml(value)).toBe(true)
  })

  it('should return true for the vBulletin 5 header rollup script', () => {
    expect(isVbulletinHtml(apolytonHtml)).toBe(true)
  })

  it('should return true for the vBulletin 6 header rollup script', () => {
    const value = `
      <base href="https://www.lesamisdelaprog.com/" />
      <script
        type="text/javascript"
        src="js/header-rollup.js?c=EyJ8Ct"
      ></script>
    `

    expect(isVbulletinHtml(value)).toBe(true)
  })

  it('should return false for another script under clientscript', () => {
    const value = '<script src="clientscript/vbulletin_read_marker.js?v=425"></script>'

    expect(isVbulletinHtml(value)).toBe(false)
  })

  it('should return false for empty content', () => {
    expect(isVbulletinHtml('')).toBe(false)
  })
})

describe('isVbulletinHeaders', () => {
  it('should return true for the visit cookies under one prefix', () => {
    const value = getCookieHeaders(['vb_sessionhash', 'vb_lastvisit', 'vb_lastactivity'])

    expect(isVbulletinHeaders(value)).toBe(true)
  })

  it('should return true for a page that sets no session hash', () => {
    expect(isVbulletinHeaders(getCookieHeaders(['bb_lastvisit', 'bb_lastactivity']))).toBe(true)
  })

  it('should return true for a prefix with a double underscore', () => {
    const value = getCookieHeaders(['AQ_vB3__lastvisit', 'AQ_vB3__lastactivity'])

    expect(isVbulletinHeaders(value)).toBe(true)
  })

  it('should return false for the visit cookies under two prefixes', () => {
    expect(isVbulletinHeaders(getCookieHeaders(['bb_lastvisit', 'jf_lastactivity']))).toBe(false)
  })

  it('should return false for a lone last visit cookie', () => {
    expect(isVbulletinHeaders(getCookieHeaders(['lastvisit']))).toBe(false)
  })
})

describe('vbulletinHandler', () => {
  describe('match', () => {
    it('should match a vBulletin page by its core script', () => {
      expect(vbulletinHandler.match('https://juli-forum.de/', juliForumHtml)).toBe(true)
    })

    it('should match a vBulletin page by its cookies', () => {
      const value = getCookieHeaders(['bb_sessionhash', 'bb_lastvisit', 'bb_lastactivity'])

      expect(vbulletinHandler.match('https://tennisforum.gr/', '<html></html>', value)).toBe(true)
    })

    it('should match a vBulletin 5 page by its cookies', () => {
      const value = getCookieHeaders(['bbsessionhash', 'bblastvisit', 'bblastactivity'])

      expect(vbulletinHandler.match('https://apolyton.net/', apolytonHtml, value)).toBe(true)
    })

    it('should not match without content', () => {
      expect(vbulletinHandler.match('https://juli-forum.de/')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL that does not parse', () => {
      expect(vbulletinHandler.resolve('not-a-url')).toEqual([])
    })

    it('should return the site feed from the root of the core script', () => {
      const value = 'https://www.aquaticquotient.com/forum/forum.php'

      expect(vbulletinHandler.resolve(value, aquaticQuotientHtml)).toEqual([
        {
          uri: 'https://www.aquaticquotient.com/forum/external.php?type=RSS2',
          hint: { key: 'vbulletin:site', label: 'Site' },
        },
      ])
    })

    it('should return the site feed for a rewritten page URL', () => {
      const value = 'https://www.gpspower.net/other-gps-systems.html'

      expect(vbulletinHandler.resolve(value, gpspowerHtml)).toEqual([
        {
          uri: 'https://www.gpspower.net/external.php?type=RSS2',
          hint: { key: 'vbulletin:site', label: 'Site' },
        },
      ])
    })

    it('should return the site feed from the script directory without the core script', () => {
      const value = 'https://www.al-shaaba.net/vb/showthread.php?t=1'

      expect(vbulletinHandler.resolve(value, '<html></html>')).toEqual([
        {
          uri: 'https://www.al-shaaba.net/vb/external.php?type=RSS2',
          hint: { key: 'vbulletin:site', label: 'Site' },
        },
      ])
    })

    it('should return the forum feed for a plain forum URL', () => {
      const value = 'https://rangeroverclub.com/forumdisplay.php?f=28'

      expect(vbulletinHandler.resolve(value, '<html></html>')).toEqual([
        {
          uri: 'https://rangeroverclub.com/external.php?type=RSS2&forumids=28',
          hint: { key: 'vbulletin:forum', label: 'Forum' },
        },
        {
          uri: 'https://rangeroverclub.com/external.php?type=RSS2',
          hint: { key: 'vbulletin:site', label: 'Site' },
        },
      ])
    })

    it('should return the forum feed for a friendly forum URL', () => {
      const value = 'https://www.vbforums.com/forumdisplay.php?1-Visual-Basic-6-and-Earlier'

      expect(vbulletinHandler.resolve(value, '<html></html>')).toEqual([
        {
          uri: 'https://www.vbforums.com/external.php?type=RSS2&forumids=1',
          hint: { key: 'vbulletin:forum', label: 'Forum' },
        },
        {
          uri: 'https://www.vbforums.com/external.php?type=RSS2',
          hint: { key: 'vbulletin:site', label: 'Site' },
        },
      ])
    })

    it('should return the vBulletin 5 site feed from the base URL', () => {
      const value = 'https://www.loganclub.ro/forum/'

      expect(vbulletinHandler.resolve(value, loganClubHtml)).toEqual([
        {
          uri: 'https://www.loganclub.ro/forum/external?type=rss2',
          hint: { key: 'vbulletin:site', label: 'Site' },
        },
      ])
    })

    it('should return the vBulletin 5 site feed on a channel page', () => {
      const value = 'https://apolyton.net/forum/civilization-7'

      expect(vbulletinHandler.resolve(value, apolytonHtml)).toEqual([
        {
          uri: 'https://apolyton.net/external?type=rss2',
          hint: { key: 'vbulletin:site', label: 'Site' },
        },
      ])
    })

    it('should return the vBulletin 6 channel feed before the site feed', () => {
      const value = 'https://megomuseum.com/community/forum/custom-mego-buzz'
      const content = `
        <base href="https://megomuseum.com/community/" />
        <script
          type="text/javascript"
          src="js/header-rollup-601.js"
        ></script>
        <script>var pageData = { "channelid": "19" };</script>
      `

      expect(vbulletinHandler.resolve(value, content)).toEqual([
        {
          uri: 'https://megomuseum.com/community/external?type=rss2&nodeid=19',
          hint: { key: 'vbulletin:forum', label: 'Forum' },
        },
        {
          uri: 'https://megomuseum.com/community/external?type=rss2',
          hint: { key: 'vbulletin:site', label: 'Site' },
        },
      ])
    })

    it('should return the vBulletin 6.2 channel feed from the page data element', () => {
      const value =
        'https://www.miva.com/forums/forum/archived-mailing-lists/merchant-4-x-users-mru'
      const content = `
        <base href="https://www.miva.com/forums/" />
        <script
          type="text/javascript"
          src="js/header-rollup.js?c=We0zTb"
        ></script>
        <div id='pagedata' class='h-hide-imp' data-channelid='57' data-nodeid='57'></div>
      `

      expect(vbulletinHandler.resolve(value, content)).toEqual([
        {
          uri: 'https://www.miva.com/forums/external?type=rss2&nodeid=57',
          hint: { key: 'vbulletin:forum', label: 'Forum' },
        },
        {
          uri: 'https://www.miva.com/forums/external?type=rss2',
          hint: { key: 'vbulletin:site', label: 'Site' },
        },
      ])
    })

    it('should skip the root channel on a vBulletin 5 home page', () => {
      const value = 'https://apolyton.net/'
      const content = `${apolytonHtml}<script>var pageData = { "channelid": "1" };</script>`

      expect(vbulletinHandler.resolve(value, content)).toEqual([
        {
          uri: 'https://apolyton.net/external?type=rss2',
          hint: { key: 'vbulletin:site', label: 'Site' },
        },
      ])
    })

    it('should not return external.php on a vBulletin 5 page with a forum URL', () => {
      const value = 'https://apolyton.net/forumdisplay.php?f=28'

      expect(vbulletinHandler.resolve(value, apolytonHtml)).toEqual([
        {
          uri: 'https://apolyton.net/external?type=rss2',
          hint: { key: 'vbulletin:site', label: 'Site' },
        },
      ])
    })

    it('should return the forum feed for a bare forum id', () => {
      const value = 'https://tennisforum.gr/forumdisplay.php?22'

      expect(vbulletinHandler.resolve(value, '<html></html>')).toEqual([
        {
          uri: 'https://tennisforum.gr/external.php?type=RSS2&forumids=22',
          hint: { key: 'vbulletin:forum', label: 'Forum' },
        },
        {
          uri: 'https://tennisforum.gr/external.php?type=RSS2',
          hint: { key: 'vbulletin:site', label: 'Site' },
        },
      ])
    })
  })
})
