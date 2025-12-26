---
prev: Discover Feeds
next: HTML Method
---

# Platform Method

The Platform method generates feed URLs for known platforms using URL pattern matching. It works without HTTP requests by recognizing URL structures specific to each platform.

## How It Works

The Platform method uses handlers for each supported platform:

1. **Pattern Matching** — Each handler checks if the URL matches its platform (e.g., `github.com`, `youtube.com`).
2. **URL Generation** — The matching handler generates feed URLs based on the URL structure.
3. **First Match** — The first matching handler wins; subsequent handlers are skipped.

> [!TIP]
> Even when feeds are discoverable via HTML `<link>` tags, the Platform method is useful because it generates feed URLs directly from the page URL—no HTTP request needed. This makes it faster when you only have a URL and want to avoid fetching the page content first.

## Supported Platforms

### YouTube

Discovers Atom feeds for channels and playlists. Generates three feed variants for channels: all uploads, videos-only (excludes Shorts), and shorts-only.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `youtube.com/channel/{id}` | Channel feed + videos-only + shorts-only |
| `youtube.com/@{handle}` | Channel feed + videos-only + shorts-only* |
| `youtube.com/user/{name}` | Channel feed + videos-only + shorts-only* |
| `youtube.com/c/{custom}` | Channel feed + videos-only + shorts-only* |
| `youtube.com/watch?v={id}` | Channel feed + videos-only + shorts-only* |
| `youtu.be/{id}` | Channel feed + videos-only + shorts-only* |
| `youtube.com/playlist?list={id}` | Playlist feed |

\* *Requires HTML content to extract channel ID.*

### Reddit

Discovers RSS feeds for subreddits, users, multireddits, and domains.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `reddit.com` | Homepage feed |
| `reddit.com/r/{subreddit}` | Subreddit posts + comments |
| `reddit.com/r/{subreddit}/{sort}` | Sorted posts (hot/new/rising/top) |
| `reddit.com/r/{subreddit}/comments/{id}` | Post comments |
| `reddit.com/u/{username}` | User activity |
| `reddit.com/user/{username}/m/{multireddit}` | Multireddit feed |
| `reddit.com/domain/{domain}` | Domain submissions |

### Medium

Discovers RSS feeds for Medium user profiles, publications, tags, and subdomains.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `medium.com/@{username}` | User posts feed |
| `medium.com/{publication}` | Publication feed |
| `medium.com/{publication}/tagged/{tag}` | Tagged publication feed |
| `*.medium.com` | Subdomain publication feed |
| `*.medium.com/tagged/{tag}` | Subdomain tagged feed |

### Substack

Discovers RSS feeds for Substack newsletters.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.substack.com` | Newsletter feed |

### WordPress.com

Discovers RSS and Atom feeds for WordPress.com blogs, with category, tag, and author support.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.wordpress.com` | Posts feed (RSS + Atom + RDF) + comments |
| `*.wordpress.com/category/{category}` | Category feed (+ above) |
| `*.wordpress.com/tag/{tag}` | Tag feed (+ above) |
| `*.wordpress.com/author/{author}` | Author feed (+ above) |

### Blogspot

Discovers RSS and Atom feeds for Blogspot blogs, including label-specific feeds.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.blogspot.com` | Posts feed (Atom + RSS) |
| `*.blogspot.com/search/label/{label}` | Label feed (+ above) |

### DEV.to

Discovers RSS feeds for DEV.to user profiles and tags.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `dev.to/{username}` | User posts feed |
| `dev.to/t/{tag}` | Tag posts feed |

### Lobsters

Discovers RSS feeds for Lobsters homepage, users, tags, and domains.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `lobste.rs` | Homepage feed |
| `lobste.rs/newest` | Newest posts feed |
| `lobste.rs/top` | Top stories feed |
| `lobste.rs/top/{period}` | Top stories by period (1d/3d/1w/1m/1y) |
| `lobste.rs/comments` | Site-wide comments feed |
| `lobste.rs/~{username}` | User stories feed |
| `lobste.rs/t/{tag}` | Tag feed |
| `lobste.rs/t/{tag1},{tag2}` | Multi-tag feed |
| `lobste.rs/domains/{domain}` | Domain feed |

### GitHub

Discovers Atom feeds for users, organizations, and repositories.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `github.com/{user}` | User activity feed |
| `github.com/{owner}/{repo}` | Releases, commits, tags |
| `github.com/{owner}/{repo}/wiki` | Wiki changes (+ above) |
| `github.com/{owner}/{repo}/discussions` | Discussions (+ above) |
| `github.com/{owner}/{repo}/tree/{branch}` | Branch commits (+ above) |
| `github.com/{owner}/{repo}/blob/{branch}/{path}` | File commits (+ above) |
| `github.com/{owner}/{repo}/commits/{branch}/{path}` | File commits (+ above) |

### GitHub Gist

Discovers Atom feeds for GitHub Gist users and starred gists.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `gist.github.com/{username}` | User gists feed |
| `gist.github.com/{username}/{gist-id}` | User gists feed |
| `gist.github.com/{username}/starred` | User starred gists feed |

### GitLab

Discovers Atom feeds for GitLab users, repositories, releases, and tags.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `gitlab.com/{user}` | User activity feed |
| `gitlab.com/{user}/{repo}` | Releases, tags, commits |

### Product Hunt

Discovers RSS feeds for Product Hunt homepage, topics, and categories.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `producthunt.com` | Homepage feed |
| `producthunt.com/topics/{topic}` | Topic feed |
| `producthunt.com/categories/{category}` | Category feed |

### Dailymotion

Discovers RSS feeds for Dailymotion users and playlists.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `dailymotion.com/{username}` | User videos feed |
| `dailymotion.com/playlist/{id}` | Playlist feed |

### DeviantArt

Discovers RSS feeds for DeviantArt user portfolios, gallery folders, favourites, and tags.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `deviantart.com/{username}` | User deviations feed |
| `deviantart.com/{username}/gallery` | User gallery feed |
| `deviantart.com/{username}/gallery/{id}` | Gallery folder feed |
| `deviantart.com/{username}/favourites` | User favourites feed |
| `deviantart.com/tag/{tag}` | Tag feed |

### Bluesky

Discovers RSS feeds for Bluesky profiles.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `bsky.app/profile/{handle}` | Profile posts feed |

### Tumblr

Discovers RSS feeds for Tumblr blogs and tagged posts.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.tumblr.com` | Blog posts feed |
| `*.tumblr.com/tagged/{tag}` | Tagged posts feed |

### Behance

Discovers RSS feeds for Behance user portfolios and appreciated works.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `behance.net/{username}` | User portfolio feed |
| `behance.net/{username}/appreciated` | User appreciated feed |

### SoundCloud

Discovers RSS feeds for SoundCloud user profiles.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `soundcloud.com/{user}` | User sounds feed* |

\* *Requires HTML content to extract user ID.*

### Kickstarter

Discovers Atom feeds for Kickstarter projects and global new projects.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `kickstarter.com` | Global new projects feed |
| `kickstarter.com/discover` | Global new projects feed |
| `kickstarter.com/projects/{creator}/{project}` | Project updates feed |

## Basic Usage

```typescript
import { discoverFeeds } from 'feedscout'

const feeds = await discoverFeeds('https://github.com/feedstand/feedstand', {
  methods: ['platform'],
})

// [
//   { url: 'https://github.com/feedstand/feedstand/releases.atom', ... },
//   { url: 'https://github.com/feedstand/feedstand/commits.atom', ... },
//   { url: 'https://github.com/feedstand/feedstand/tags.atom', ... },
// ]
```

## Configuration

### Handler Order

Handlers are checked in order. The first matching handler generates the feeds:

```typescript
import { githubHandler, youtubeHandler } from 'feedscout/platform'

const feeds = await discoverFeeds(url, {
  methods: {
    platform: {
      handlers: [youtubeHandler, githubHandler, redditHandler],
    },
  },
})
```

## Default Values

Import the default Platform options:

```typescript
import { defaultPlatformOptions } from 'feedscout/platform'
```

Or import individual handlers:

```typescript
import {
  behanceHandler,
  blogspotHandler,
  blueskyHandler,
  dailymotionHandler,
  deviantartHandler,
  devtoHandler,
  githubGistHandler,
  githubHandler,
  gitlabHandler,
  kickstarterHandler,
  lobstersHandler,
  mediumHandler,
  producthuntHandler,
  redditHandler,
  soundcloudHandler,
  substackHandler,
  tumblrHandler,
  wordpressHandler,
  youtubeHandler,
} from 'feedscout/platform'
```

## Using Directly

Use the Platform discovery function directly to get URIs without validation:

```typescript
import { discoverUrisFromPlatform } from 'feedscout/platform'

const uris = discoverUrisFromPlatform(htmlContent, {
  baseUrl: 'https://www.youtube.com/@mkbhd',
  handlers: [youtubeHandler],
})

// [
//   'https://www.youtube.com/feeds/videos.xml?channel_id=UCBJycsmduvYEL83R_U4JriQ',
//   'https://www.youtube.com/feeds/videos.xml?playlist_id=UULFBJycsmduvYEL83R_U4JriQ',
// ]
```

> [!NOTE]
> The YouTube handler requires HTML content for `@handle`, `/user/`, and `/c/` URLs to extract the channel ID. For `/channel/UC...` URLs, no content is needed.

## Creating Custom Handlers

You can create handlers for platforms not included by default.

### Handler Interface

A `PlatformHandler` has two methods:

```typescript
type PlatformHandler = {
  match: (url: string) => boolean
  resolve: (url: string, content?: string) => Array<string>
}
```

| Method | Description |
|--------|-------------|
| `match(url)` | Returns `true` if this handler should process the URL |
| `resolve(url, content?)` | Returns an array of feed URLs for the given page URL |

### Basic Example

A handler that appends `/feed.xml` to any URL on a specific domain:

```typescript
import type { PlatformHandler } from 'feedscout/platform'

const myHandler: PlatformHandler = {
  match: (url) => {
    return new URL(url).hostname === 'example.com'
  },

  resolve: (url) => {
    const { origin } = new URL(url)

    return [`${origin}/feed.xml`]
  },
}
```

### Using URL Patterns

A handler that extracts a username from the URL path:

```typescript
const profileHandler: PlatformHandler = {
  match: (url) => {
    const { hostname, pathname } = new URL(url)

    return hostname === 'example.com' && pathname.startsWith('/users/')
  },

  resolve: (url) => {
    const { origin, pathname } = new URL(url)
    const match = pathname.match(/^\/users\/([^/]+)/)

    if (match?.[1]) {
      return [`${origin}/users/${match[1]}/feed.rss`]
    }

    return []
  },
}
```

### Using Page Content

When feed URLs can only be found in the HTML, use the `content` parameter:

```typescript
const contentHandler: PlatformHandler = {
  match: (url) => new URL(url).hostname === 'example.com',

  resolve: (url, content) => {
    if (!content) {
      return []
    }

    const match = content.match(/data-feed-url="([^"]+)"/)

    return match?.[1] ? [match[1]] : []
  },
}
```

### Combining with Defaults

Add custom handlers alongside the built-in ones:

```typescript
import { defaultPlatformOptions } from 'feedscout/platform'

const feeds = await discoverFeeds(url, {
  methods: {
    platform: {
      handlers: [myHandler, ...defaultPlatformOptions.handlers],
    },
  },
})
```
