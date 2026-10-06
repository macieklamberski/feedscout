import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import {
  getRedminePage,
  isRedmineHeaders,
  isRedmineHtml,
  type RedminePage,
  redmineHandler,
} from './redmine.js'

const footerHtml = `
  <div id="footer">
    Powered by <a
      target="_blank"
      rel="noopener"
      href="https://www.redmine.org/"
    >Redmine</a> &copy; 2006-2025 Jean-Philippe Lang
  </div>
`
const metaHtml = `
  <meta
    name="description"
    content="Redmine"
  />
`
const chiliProjectHtml = `
  <meta
    name="description"
    content="ChiliProject"
  />
  <div id="footer">Powered by <a href="https://www.chiliproject.org/">ChiliProject</a></div>
`
const projectHtml = `
  <body class="project-acme-tools has-main-menu controller-projects action-show avatars-on">
    <a class="home" href="/">Home</a>
    ${footerHtml}
  </body>
`
const subPathProjectHtml = `
  <body class="project-acme-tools has-main-menu controller-projects action-show">
    <a class="home" href="/redmine/">Home</a>
    ${footerHtml}
  </body>
`
const siteHtml = `
  <body class="has-main-menu controller-issues action-index avatars-on">
    <a class="home" href="/">Home</a>
    ${footerHtml}
  </body>
`
const missingProjectHtml = `
  <body class="has-main-menu controller-projects action-show avatars-on">
    <a class="home" href="/">Home</a>
    ${footerHtml}
  </body>
`
const signInHtml = `
  <body class="controller-account action-login avatars-on">
    <a class="home" href="/">Home</a>
    ${footerHtml}
  </body>
`
const menuProjectHtml = `
  <body class="project-acme-tools has-main-menu controller-projects action-show">
    <a class="home" href="/">Home</a>
    <div id="main-menu" class="tabs">
      <ul>
        <li><a class="overview selected" href="/projects/acme-tools">Overview</a></li>
        <li><a class="activity" href="/projects/acme-tools/activity">Activity</a></li>
        <li><a class="issues" href="/projects/acme-tools/issues">Issues</a></li>
        <li><a class="wiki" href="/projects/acme-tools/wiki">Wiki</a></li>
      </ul>
    </div>
    ${footerHtml}
  </body>
`
const newsMenuProjectHtml = menuProjectHtml.replace(
  '<li><a class="issues" href="/projects/acme-tools/issues">Issues</a></li>',
  '<li><a class="news" href="/projects/acme-tools/news">News</a></li>',
)
const formErrorProjectHtml = projectHtml.replace(
  '<a class="home" href="/">Home</a>',
  '<a class="home" href="/">Home</a><div id="errorExplanation"><ul><li>Invalid</li></ul></div>',
)
const notFoundHtml = `
  <body class="has-main-menu controller-users action-show avatars-on">
    <a class="home" href="/">Home</a>
    <div id="content">
      <h2>404</h2>
      <p id="errorExplanation">The page you were trying to access doesn&#39;t exist or has been removed.</p>
      <p><a href="javascript:history.back()">Back</a></p>
    </div>
    ${footerHtml}
  </body>
`
const repositoryHtml = `
  <head>
    <link
      rel="alternate"
      type="application/atom+xml"
      title="ATOM"
      href="https://example.com/projects/acme-tools/repository/core/revisions"
    />
  </head>
  <body class="project-acme-tools has-main-menu controller-repositories action-show">
    <a class="home" href="/">Home</a>
    <a
      class="atom"
      rel="nofollow"
      href="/projects/acme-tools/repository/core/revisions.atom"
    >Atom</a>
  </body>
`

describe('isRedmineHtml', () => {
  it('should return true for the footer link', () => {
    expect(isRedmineHtml(footerHtml)).toBe(true)
  })

  it('should return true for the description meta', () => {
    expect(isRedmineHtml(metaHtml)).toBe(true)
  })

  it('should return false for ChiliProject', () => {
    expect(isRedmineHtml(chiliProjectHtml)).toBe(false)
  })

  it('should return false for empty content', () => {
    expect(isRedmineHtml('')).toBe(false)
  })
})

describe('isRedmineHeaders', () => {
  it('should return true for the session cookie', () => {
    const headers = new Headers({ 'set-cookie': '_redmine_session=abc123; path=/; HttpOnly' })

    expect(isRedmineHeaders(headers)).toBe(true)
  })

  it('should return false for the ChiliProject session cookie', () => {
    const headers = new Headers({ 'set-cookie': '_chiliproject_session=abc123; path=/' })

    expect(isRedmineHeaders(headers)).toBe(false)
  })
})

describe('getRedminePage', () => {
  it('should return the project of a project page', () => {
    const expected: RedminePage = {
      kind: 'project',
      root: 'https://example.com',
      project: 'acme-tools',
      hasIssues: true,
      hasNews: true,
    }

    expect(getRedminePage('https://example.com/projects/acme-tools', projectHtml)).toEqual(expected)
  })

  it('should return the project of any other project page', () => {
    const value = 'https://example.com/projects/acme-tools/wiki/Install'
    const expected: RedminePage = {
      kind: 'project',
      root: 'https://example.com',
      project: 'acme-tools',
      hasIssues: true,
      hasNews: true,
    }

    expect(getRedminePage(value, projectHtml)).toEqual(expected)
  })

  it('should return the project identifier the body class names', () => {
    const expected: RedminePage = {
      kind: 'project',
      root: 'https://example.com',
      project: 'acme-tools',
      hasIssues: true,
      hasNews: true,
    }

    expect(getRedminePage('https://example.com/projects/12', projectHtml)).toEqual(expected)
  })

  it('should return the project issues', () => {
    const value = 'https://example.com/projects/acme-tools/issues'
    const expected: RedminePage = {
      kind: 'issues',
      root: 'https://example.com',
      project: 'acme-tools',
    }

    expect(getRedminePage(value, projectHtml)).toEqual(expected)
  })

  it('should return the project news', () => {
    const value = 'https://example.com/projects/acme-tools/news'
    const expected: RedminePage = {
      kind: 'news',
      root: 'https://example.com',
      project: 'acme-tools',
    }

    expect(getRedminePage(value, projectHtml)).toEqual(expected)
  })

  it('should return the project activity', () => {
    const value = 'https://example.com/projects/acme-tools/activity'
    const expected: RedminePage = {
      kind: 'activity',
      root: 'https://example.com',
      project: 'acme-tools',
    }

    expect(getRedminePage(value, projectHtml)).toEqual(expected)
  })

  it('should return the board of a forum page', () => {
    const value = 'https://example.com/projects/acme-tools/boards/3'
    const expected: RedminePage = {
      kind: 'board',
      root: 'https://example.com',
      project: 'acme-tools',
      boardId: '3',
    }

    expect(getRedminePage(value, projectHtml)).toEqual(expected)
  })

  it('should return the repository the page links', () => {
    const value = 'https://example.com/projects/acme-tools/repository'
    const expected: RedminePage = {
      kind: 'repository',
      root: 'https://example.com',
      project: 'acme-tools',
      repository: 'core',
    }

    expect(getRedminePage(value, repositoryHtml)).toEqual(expected)
  })

  it('should return the project of a repository page that links no revisions', () => {
    const value = 'https://example.com/projects/acme-tools/repository'
    const expected: RedminePage = {
      kind: 'project',
      root: 'https://example.com',
      project: 'acme-tools',
      hasIssues: true,
      hasNews: true,
    }

    expect(getRedminePage(value, projectHtml)).toEqual(expected)
  })

  it('should return the issue of an issue page', () => {
    const expected: RedminePage = { kind: 'issue', root: 'https://example.com', issueId: '4521' }

    expect(getRedminePage('https://example.com/issues/4521', projectHtml)).toEqual(expected)
  })

  it('should return the site issues', () => {
    const expected: RedminePage = { kind: 'issues', root: 'https://example.com' }

    expect(getRedminePage('https://example.com/issues', siteHtml)).toEqual(expected)
  })

  it('should return the site news', () => {
    const expected: RedminePage = { kind: 'news', root: 'https://example.com' }

    expect(getRedminePage('https://example.com/news', siteHtml)).toEqual(expected)
  })

  it('should return the site activity', () => {
    const expected: RedminePage = { kind: 'activity', root: 'https://example.com' }

    expect(getRedminePage('https://example.com/activity', siteHtml)).toEqual(expected)
  })

  it('should return the project list', () => {
    const expected: RedminePage = { kind: 'projects', root: 'https://example.com' }

    expect(getRedminePage('https://example.com/projects', siteHtml)).toEqual(expected)
  })

  it('should return the home page for the root', () => {
    const expected: RedminePage = { kind: 'home', root: 'https://example.com' }

    expect(getRedminePage('https://example.com/', siteHtml)).toEqual(expected)
  })

  it('should return the project of a news item page', () => {
    const expected: RedminePage = {
      kind: 'project',
      root: 'https://example.com',
      project: 'acme-tools',
      hasIssues: true,
      hasNews: true,
    }

    expect(getRedminePage('https://example.com/news/12', projectHtml)).toEqual(expected)
  })

  it('should return the home page for a page outside any project', () => {
    const expected: RedminePage = { kind: 'home', root: 'https://example.com' }

    expect(getRedminePage('https://example.com/users/7', siteHtml)).toEqual(expected)
  })

  it('should return the root of an install under a sub-path', () => {
    const value = 'https://example.com/redmine/projects/acme-tools/issues'
    const expected: RedminePage = {
      kind: 'issues',
      root: 'https://example.com/redmine',
      project: 'acme-tools',
    }

    expect(getRedminePage(value, subPathProjectHtml)).toEqual(expected)
  })

  it('should return the modules the project menu lists', () => {
    const expected: RedminePage = {
      kind: 'project',
      root: 'https://example.com',
      project: 'acme-tools',
      hasIssues: true,
      hasNews: false,
    }

    expect(getRedminePage('https://example.com/projects/acme-tools', menuProjectHtml)).toEqual(
      expected,
    )
  })

  it('should return the news module when the project menu lists only news', () => {
    const expected: RedminePage = {
      kind: 'project',
      root: 'https://example.com',
      project: 'acme-tools',
      hasIssues: false,
      hasNews: true,
    }

    expect(getRedminePage('https://example.com/projects/acme-tools', newsMenuProjectHtml)).toEqual(
      expected,
    )
  })

  it('should return the modules the project menu lists on a page outside the project path', () => {
    const expected: RedminePage = {
      kind: 'project',
      root: 'https://example.com',
      project: 'acme-tools',
      hasIssues: true,
      hasNews: false,
    }

    expect(getRedminePage('https://example.com/news/12', menuProjectHtml)).toEqual(expected)
  })

  it('should return the project of a page with a form error block', () => {
    const expected: RedminePage = {
      kind: 'project',
      root: 'https://example.com',
      project: 'acme-tools',
      hasIssues: true,
      hasNews: true,
    }

    expect(getRedminePage('https://example.com/projects/acme-tools', formErrorProjectHtml)).toEqual(
      expected,
    )
  })

  it('should return undefined for an error page', () => {
    expect(getRedminePage('https://example.com/users/999999999', notFoundHtml)).toBeUndefined()
  })

  it('should return undefined for the sign-in page of a private project', () => {
    expect(getRedminePage('https://example.com/projects/acme-tools', signInHtml)).toBeUndefined()
  })

  it('should return undefined for a project page without the project class', () => {
    const value = 'https://example.com/projects/acme-tools'

    expect(getRedminePage(value, missingProjectHtml)).toBeUndefined()
  })

  it('should return undefined for an issue page without the project class', () => {
    expect(getRedminePage('https://example.com/issues/4521', siteHtml)).toBeUndefined()
  })

  it('should return undefined for an unparsable URL', () => {
    expect(getRedminePage('not-a-url', siteHtml)).toBeUndefined()
  })
})

describe('redmineHandler', () => {
  describe('match', () => {
    it('should match a Redmine page', () => {
      expect(redmineHandler.match('https://example.com/projects/acme-tools', projectHtml)).toBe(
        true,
      )
    })

    it('should match a page by the session cookie', () => {
      const headers = new Headers({ 'set-cookie': '_redmine_session=abc123; path=/' })

      expect(redmineHandler.match('https://example.com/', '', headers)).toBe(true)
    })

    it('should not match ChiliProject', () => {
      expect(redmineHandler.match('https://example.com/', chiliProjectHtml)).toBe(false)
    })

    it('should not match the sign-in page of a private project', () => {
      expect(redmineHandler.match('https://example.com/projects/acme-tools', signInHtml)).toBe(
        false,
      )
    })
  })

  describe('resolve', () => {
    it('should return the project feeds for a project page', () => {
      const value = 'https://example.com/projects/acme-tools'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/projects/acme-tools/activity.atom',
          hint: { key: 'redmine:activity', label: 'Activity' },
        },
        {
          uri: 'https://example.com/projects/acme-tools/issues.atom',
          hint: { key: 'redmine:issues', label: 'Issues' },
        },
        {
          uri: 'https://example.com/projects/acme-tools/news.atom',
          hint: { key: 'redmine:news', label: 'News' },
        },
      ]

      expect(redmineHandler.resolve(value, projectHtml)).toEqual(expected)
    })

    it('should leave out the feeds of modules the project menu does not list', () => {
      const value = 'https://example.com/projects/acme-tools'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/projects/acme-tools/activity.atom',
          hint: { key: 'redmine:activity', label: 'Activity' },
        },
        {
          uri: 'https://example.com/projects/acme-tools/issues.atom',
          hint: { key: 'redmine:issues', label: 'Issues' },
        },
      ]

      expect(redmineHandler.resolve(value, menuProjectHtml)).toEqual(expected)
    })

    it('should leave out the issues feed when the project menu does not list issues', () => {
      const value = 'https://example.com/projects/acme-tools'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/projects/acme-tools/activity.atom',
          hint: { key: 'redmine:activity', label: 'Activity' },
        },
        {
          uri: 'https://example.com/projects/acme-tools/news.atom',
          hint: { key: 'redmine:news', label: 'News' },
        },
      ]

      expect(redmineHandler.resolve(value, newsMenuProjectHtml)).toEqual(expected)
    })

    it('should return the project issues feed for a project issues page', () => {
      const value = 'https://example.com/projects/acme-tools/issues'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/projects/acme-tools/issues.atom',
          hint: { key: 'redmine:issues', label: 'Issues' },
        },
      ]

      expect(redmineHandler.resolve(value, projectHtml)).toEqual(expected)
    })

    it('should return the project news feed for a project news page', () => {
      const value = 'https://example.com/projects/acme-tools/news'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/projects/acme-tools/news.atom',
          hint: { key: 'redmine:news', label: 'News' },
        },
      ]

      expect(redmineHandler.resolve(value, projectHtml)).toEqual(expected)
    })

    it('should return the project activity feed for a project activity page', () => {
      const value = 'https://example.com/projects/acme-tools/activity'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/projects/acme-tools/activity.atom',
          hint: { key: 'redmine:activity', label: 'Activity' },
        },
      ]

      expect(redmineHandler.resolve(value, projectHtml)).toEqual(expected)
    })

    it('should return the board feed for a forum page', () => {
      const value = 'https://example.com/projects/acme-tools/boards/3'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/projects/acme-tools/boards/3.atom',
          hint: { key: 'redmine:board', label: 'Forum' },
        },
      ]

      expect(redmineHandler.resolve(value, projectHtml)).toEqual(expected)
    })

    it('should spell the feed as the page links it over http', () => {
      const value = 'https://example.com/projects/acme-tools/boards/3'
      const content = `
        <head>
          <link
            rel="alternate"
            type="application/atom+xml"
            href="http://example.com/projects/acme-tools/boards/3.atom"
          />
        </head>
        ${projectHtml}
      `
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://example.com/projects/acme-tools/boards/3.atom',
          hint: { key: 'redmine:board', label: 'Forum' },
        },
      ]

      expect(redmineHandler.resolve(value, content)).toEqual(expected)
    })

    it('should return the revisions feed for a repository page', () => {
      const value = 'https://example.com/projects/acme-tools/repository'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/projects/acme-tools/repository/core/revisions.atom',
          hint: { key: 'redmine:revisions', label: 'Revisions' },
        },
      ]

      expect(redmineHandler.resolve(value, repositoryHtml)).toEqual(expected)
    })

    it('should return the issue feed for an issue page', () => {
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/issues/4521.atom',
          hint: { key: 'redmine:issue', label: 'Issue updates' },
        },
      ]

      expect(redmineHandler.resolve('https://example.com/issues/4521', projectHtml)).toEqual(
        expected,
      )
    })

    it('should return the site issues feed for the issues page', () => {
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/issues.atom',
          hint: { key: 'redmine:issues', label: 'Issues' },
        },
      ]

      expect(redmineHandler.resolve('https://example.com/issues', siteHtml)).toEqual(expected)
    })

    it('should return the site news feed for the news page', () => {
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/news.atom',
          hint: { key: 'redmine:news', label: 'News' },
        },
      ]

      expect(redmineHandler.resolve('https://example.com/news', siteHtml)).toEqual(expected)
    })

    it('should return the site activity feed for the activity page', () => {
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/activity.atom',
          hint: { key: 'redmine:activity', label: 'Activity' },
        },
      ]

      expect(redmineHandler.resolve('https://example.com/activity', siteHtml)).toEqual(expected)
    })

    it('should return the projects feed for the project list', () => {
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/projects.atom',
          hint: { key: 'redmine:projects', label: 'Projects' },
        },
      ]

      expect(redmineHandler.resolve('https://example.com/projects', siteHtml)).toEqual(expected)
    })

    it('should return the site news and activity feeds for the home page', () => {
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/news.atom',
          hint: { key: 'redmine:news', label: 'News' },
        },
        {
          uri: 'https://example.com/activity.atom',
          hint: { key: 'redmine:activity', label: 'Activity' },
        },
      ]

      expect(redmineHandler.resolve('https://example.com/', siteHtml)).toEqual(expected)
    })

    it('should return empty array for the sign-in page', () => {
      expect(redmineHandler.resolve('https://example.com/login', signInHtml)).toEqual([])
    })
  })
})
