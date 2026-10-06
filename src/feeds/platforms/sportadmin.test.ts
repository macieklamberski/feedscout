import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { getSportadminPage, type SportadminPage, sportadminHandler } from './sportadmin.js'

const menu = `
  <ul>
    <li class=""><a href='../?SID=1001'>EXAMPLE</a></li>
    <li class="" style=padding-left:10px><b>Ungdom</b>
    <li class=""><a href='../?SID=1002' ><span>Flickor 2014</span></a></li>
  </ul>
`
const teamContent = `
  ${menu}
  <div
    style="border:0px solid"
    class="visible-phone"
  ><a href="../?SID=1002&platform=WEB">Gå till Webbversion</a></div>
`
const homeContent = `
  ${menu}
  <div id=nextGame></div><script>ajax('#nextGame', '../match/wNextGame.asp?SID=1001');</script>
  <div
    style="border:0px solid"
    class="visible-phone"
  ><a href="../?SID=1001&platform=WEB">Gå till Webbversion</a></div>
`
const newTemplateContent = `
  <base href="/">
  <link rel="canonical" href="https://exampleclub.web.sportadmin.se/start/?ID=2001" />
  <a href="/start/?ID=2000">Start</a>
`

describe('getSportadminPage', () => {
  it('should return the team its mobile layout link names', () => {
    const value = 'https://exampleclub.web.sportadmin.se/start/?ID=2001'
    const expected: SportadminPage = { kind: 'team', sectionId: '1002' }

    expect(getSportadminPage(value, teamContent)).toEqual(expected)
  })

  it('should return the team its desktop layout link names', () => {
    const value = 'https://exampleclub.web.sportadmin.se/start/?ID=2001'
    const content = `
      ${menu}
      <div
        style="font-size:30px;border:0px solid"
        class="visible-desktop"
      ><a href="../?SID=1002&platform=APP">Gå till Appversion</a></div>
    `
    const expected: SportadminPage = { kind: 'team', sectionId: '1002' }

    expect(getSportadminPage(value, content)).toEqual(expected)
  })

  it('should return the team on a club whose menu starts with that team', () => {
    const value = 'https://exampleclub.web.sportadmin.se/start/?ID=2001'
    const content = `
      <li class=""><a href='../?SID=1002' ><span>A-lag</span></a></li>
      <div
        style="border:0px solid"
        class="visible-phone"
      ><a href="../?SID=1002&platform=WEB">Gå till Webbversion</a></div>
    `
    const expected: SportadminPage = { kind: 'team', sectionId: '1002' }

    expect(getSportadminPage(value, content)).toEqual(expected)
  })

  it('should return the team its url names on the new template', () => {
    const value = 'https://exampleclub.web.sportadmin.se/?SID=1002'
    const expected: SportadminPage = { kind: 'team', sectionId: '1002' }

    expect(getSportadminPage(value, newTemplateContent)).toEqual(expected)
  })

  it('should return the club for a url whose section the new template does not know', () => {
    const value = 'https://exampleclub.web.sportadmin.se/?SID=1002'
    const content = '<link rel="canonical" href="https://exampleclub.web.sportadmin.se/" />'
    const expected: SportadminPage = { kind: 'club' }

    expect(getSportadminPage(value, content)).toEqual(expected)
  })

  it('should return the club for a url whose section id has trailing letters', () => {
    const value = 'https://exampleclub.web.sportadmin.se/?SID=1002abc'
    const expected: SportadminPage = { kind: 'club' }

    expect(getSportadminPage(value, newTemplateContent)).toEqual(expected)
  })

  it('should return the club for a url whose page prints no canonical', () => {
    const value = 'https://exampleclub.web.sportadmin.se/?SID=1002'
    const expected: SportadminPage = { kind: 'club' }

    expect(getSportadminPage(value, '<a href="/start/?ID=2000">Start</a>')).toEqual(expected)
  })

  it('should return the club for a url whose section id has leading letters', () => {
    const value = 'https://exampleclub.web.sportadmin.se/?SID=abc1002'
    const expected: SportadminPage = { kind: 'club' }

    expect(getSportadminPage(value, newTemplateContent)).toEqual(expected)
  })

  it('should return the club when the layout link names the root section', () => {
    const value = 'https://exampleclub.web.sportadmin.se/start/?ID=2000'
    const expected: SportadminPage = { kind: 'club' }

    expect(getSportadminPage(value, homeContent)).toEqual(expected)
  })

  it('should return the club for a page without a layout link', () => {
    const value = 'https://exampleclub.web.sportadmin.se/nyheter/?ID=2002'
    const expected: SportadminPage = { kind: 'club' }

    expect(getSportadminPage(value, menu)).toEqual(expected)
  })

  it('should return the club without content', () => {
    const value = 'https://exampleclub.web.sportadmin.se/'
    const expected: SportadminPage = { kind: 'club' }

    expect(getSportadminPage(value, undefined)).toEqual(expected)
  })

  it('should return undefined for a dotted subdomain', () => {
    const value = 'https://www.exampleclub.web.sportadmin.se/start/?ID=2001'

    expect(getSportadminPage(value, teamContent)).toBeUndefined()
  })

  it('should return undefined for the www subdomain', () => {
    expect(getSportadminPage('https://www.web.sportadmin.se/', teamContent)).toBeUndefined()
  })

  it('should return undefined for the apex domain', () => {
    expect(getSportadminPage('https://web.sportadmin.se/', teamContent)).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(getSportadminPage('https://example.com/start/?ID=2001', teamContent)).toBeUndefined()
  })
})

describe('sportadminHandler', () => {
  describe('match', () => {
    it('should return true for a club page', () => {
      expect(sportadminHandler.match('https://exampleclub.web.sportadmin.se/start/?ID=2000')).toBe(
        true,
      )
    })

    it('should return false for another host', () => {
      expect(sportadminHandler.match('https://example.com/start/?ID=2000')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the team and club news feeds for a team page', () => {
      const value = 'https://exampleclub.web.sportadmin.se/start/?ID=2001'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://exampleclub.web.sportadmin.se/rss/?SID=1002',
          hint: { key: 'sportadmin:team', label: 'Team news' },
        },
        {
          uri: 'https://exampleclub.web.sportadmin.se/rss/',
          hint: { key: 'sportadmin:news', label: 'Club news' },
        },
      ]

      expect(sportadminHandler.resolve(value, teamContent)).toEqual(expected)
    })

    it('should return the club news feed for the home page', () => {
      const value = 'https://exampleclub.web.sportadmin.se/start/?ID=2000'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://exampleclub.web.sportadmin.se/rss/',
          hint: { key: 'sportadmin:news', label: 'Club news' },
        },
      ]

      expect(sportadminHandler.resolve(value, homeContent)).toEqual(expected)
    })

    it('should return no feeds for another host', () => {
      expect(sportadminHandler.resolve('https://example.com/', teamContent)).toEqual([])
    })
  })
})
