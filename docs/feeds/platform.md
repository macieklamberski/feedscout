---
title: "Discover Feeds: Platform Method"
---

# Platform Method

The Platform method generates feed URLs for known platforms using URL pattern matching. Most handlers work from the URL alone by recognizing URL structures specific to each platform. Some also read the page content or response headers to detect self-hosted instances or to extract an ID.

## How It Works

The Platform method uses handlers for each supported platform:

1. **Pattern Matching**: Each handler checks if the URL matches its platform (e.g., `github.com`, `youtube.com`).
2. **URL Generation**: The matching handler generates feed URLs based on the URL structure.
3. **First Match**: The first matching handler that generates feeds wins. Subsequent handlers are skipped. A handler that matches but generates nothing passes the page to the next one.

> [!TIP]
> Even when feeds are discoverable via HTML `<link>` tags, the Platform method is useful because it generates feed variants the page does not advertise, like a channel's Shorts feed or a repository's releases feed. Handlers that work from the URL alone need no page content, which helps when you [use the method directly](#using-directly) and only have a URL.

## Hints

Platform handlers attach a `hint` to each feed URI they generate. Hints provide a machine-readable `key` and a human-readable `label` that describe what type of feed the URI represents (e.g., "All uploads", "Videos", "Shorts"). This is useful when a single URL generates multiple feed variants and you need to let users pick the right one, especially for feeds that don't include a descriptive title.

Hints are propagated to the final [`DiscoverResult`](/reference/types#discoverresult) objects returned by `discoverFeeds`. Results from non-platform methods (HTML, headers, guess) do not include hints.

When a platform serves the same feed in several formats, like WordPress posts in RSS, Atom and RDF, each variant gets the same `label` and its own `format`. The hint carries the format the platform serves at that URL, so it is there for results that failed to validate too.

```typescript
type DiscoverUriHint = {
  key: string                              // e.g., 'youtube:all', 'wordpress:posts'
  label: string                            // e.g., 'All uploads', 'Posts'
  format?: 'rss' | 'atom' | 'rdf' | 'json' // e.g., 'atom'
}
```

## Supported Platforms

A † after a feed marks one that only the Platform method finds. The page doesn't link it, and the HTML, Headers and Guess methods miss it. A ? marks a feed that failed to load when it was measured, so there's no result for it. The marks come from discovery runs on real pages, so a row with no measured page carries none.

### Apple Podcasts

Discovers RSS feeds for Apple Podcasts shows by extracting the feed URL from the page content.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `podcasts.apple.com/{locale}/podcast/{name}/id{id}` | Podcast<sup>†</sup>* |

\* *Requires HTML content to extract feed URL.*

<sup>†</sup> *Found only by the Platform method.*

### YouTube

Discovers Atom feeds for channels and playlists. Generates ten feed variants for channels: all uploads, then videos, shorts and live streams, each also as a popular and a members-only feed.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `youtube.com/channel/{id}` | All uploads · videos<sup>?</sup> · shorts<sup>?</sup> · live streams<sup>†</sup> · popular videos<sup>?</sup> · popular shorts<sup>†</sup> · popular live streams<sup>†</sup> · member videos<sup>?</sup> · member shorts<sup>?</sup> · member live streams<sup>?</sup> |
| `music.youtube.com/channel/{id}` | All uploads<sup>†</sup> · videos<sup>?</sup> · shorts<sup>?</sup> · live streams<sup>†</sup> · popular videos<sup>?</sup> · popular shorts<sup>†</sup> · popular live streams<sup>?</sup> · member videos<sup>?</sup> · member shorts<sup>?</sup> · member live streams<sup>?</sup> |
| `youtube.com/@{handle}` | All uploads · videos<sup>?</sup> · shorts<sup>?</sup> · live streams<sup>†</sup> · popular videos<sup>?</sup> · popular shorts<sup>?</sup> · popular live streams<sup>?</sup> · member videos<sup>?</sup> · member shorts<sup>?</sup> · member live streams<sup>?</sup>* |
| `youtube.com/user/{name}` | All uploads · videos<sup>?</sup> · shorts<sup>?</sup> · live streams<sup>?</sup> · popular videos<sup>†</sup> · popular shorts<sup>?</sup> · popular live streams<sup>?</sup> · member videos<sup>?</sup> · member shorts<sup>?</sup> · member live streams<sup>?</sup>* |
| `youtube.com/c/{custom}` | All uploads · videos<sup>?</sup> · shorts<sup>?</sup> · live streams<sup>†</sup> · popular videos<sup>?</sup> · popular shorts<sup>†</sup> · popular live streams<sup>†</sup> · member videos<sup>?</sup> · member shorts<sup>?</sup> · member live streams<sup>?</sup>* |
| `youtube.com/watch?v={id}` | All uploads<sup>†</sup> · videos<sup>?</sup> · shorts<sup>?</sup> · live streams<sup>†</sup> · popular videos<sup>?</sup> · popular shorts<sup>†</sup> · popular live streams<sup>?</sup> · member videos<sup>?</sup> · member shorts<sup>?</sup> · member live streams<sup>?</sup>* |
| `youtu.be/{id}` | All uploads<sup>†</sup> · videos<sup>?</sup> · shorts<sup>?</sup> · live streams<sup>†</sup> · popular videos<sup>?</sup> · popular shorts<sup>†</sup> · popular live streams<sup>?</sup> · member videos<sup>?</sup> · member shorts<sup>?</sup> · member live streams<sup>?</sup>* |
| `youtube.com/shorts/{id}` | All uploads<sup>†</sup> · videos<sup>?</sup> · shorts<sup>?</sup> · live streams<sup>†</sup> · popular videos<sup>?</sup> · popular shorts<sup>†</sup> · popular live streams<sup>†</sup> · member videos<sup>?</sup> · member shorts<sup>?</sup> · member live streams<sup>?</sup>* |
| `youtube.com/live/{id}` | All uploads<sup>?</sup> · videos<sup>?</sup> · shorts<sup>?</sup> · live streams<sup>†</sup> · popular videos<sup>†</sup> · popular shorts<sup>?</sup> · popular live streams<sup>†</sup> · member videos<sup>?</sup> · member shorts<sup>?</sup> · member live streams<sup>?</sup>* |
| `youtube.com/playlist?list={id}` | Playlist<sup>†</sup> |

\* *Requires HTML content to extract channel ID.*

<sup>†</sup> *Found only by the Platform method.*

<sup>?</sup> *Not measured, the feed failed to load during the run.*

### Reddit

Discovers Atom feeds for subreddits, users, multireddits, and domains.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `reddit.com` | Homepage<sup>†</sup> |
| `reddit.com/search?q={query}` | Search results<sup>†</sup> |
| `reddit.com/subreddits` | Subreddits |
| `reddit.com/r/{subreddit}` | Subreddit posts · comments<sup>†</sup> |
| `reddit.com/r/{subreddit}/{sort}` | Sorted posts<sup>†</sup> (hot/new/rising/top) · comments<sup>†</sup> |
| `reddit.com/r/{subreddit}/comments/{id}` | Post comments<sup>†</sup> |
| `reddit.com/u/{username}` | User activity<sup>†</sup> |
| `reddit.com/user/{username}/submitted` | Submitted posts<sup>†</sup>, plus the feeds above |
| `reddit.com/user/{username}/m/{multireddit}` | Multireddit<sup>†</sup> |
| `reddit.com/domain/{domain}` | Domain submissions |

<sup>†</sup> *Found only by the Platform method.*

### Medium

Discovers RSS feeds for Medium user profiles, publications, tags, and subdomains.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `medium.com/@{username}` | User posts |
| `medium.com/{publication}` | Publication |
| `medium.com/tag/{tag}` | Tag<sup>†</sup> |
| `medium.com/{publication}/tagged/{tag}` | Tagged publication |
| `*.medium.com` | Subdomain publication |
| `*.medium.com/tagged/{tag}` | Subdomain tagged |

<sup>†</sup> *Found only by the Platform method.*

### Substack

Discovers RSS feeds for Substack newsletters.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.substack.com` | Newsletter |
| `substack.com/@{user}` | Newsletter<sup>†</sup>* |

\* *The publication can differ from the handle and can sit on a custom domain. It is read from the page content when available, with the handle as the fallback.*

<sup>†</sup> *Found only by the Platform method.*

### WordPress.com

Discovers RSS and Atom feeds for WordPress.com and Unblog blogs, with category, tag, and author support.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.wordpress.com` | Posts (RSS + Atom + RDF<sup>†</sup>) · comments (RSS + Atom<sup>†</sup>) |
| `*.wordpress.com/category/{category}` | Category (RSS + Atom<sup>†</sup> + RDF<sup>†</sup>), plus the feeds above |
| `*.wordpress.com/category/{parent}/{category}` | Nested category (RSS + Atom<sup>†</sup> + RDF<sup>†</sup>), plus the feeds above |
| `*.wordpress.com/tag/{tag}` | Tag (RSS + Atom<sup>†</sup> + RDF<sup>†</sup>), plus the feeds above |
| `*.wordpress.com/author/{author}` | Author (RSS + Atom + RDF<sup>†</sup>), plus the feeds above |
| `*.unblog.fr` | Same as `*.wordpress.com` (Unblog) |
| `*.hypotheses.org` | Same as `*.wordpress.com` |
| `*.hypotheses.org/{post_id}` | Post comments (RSS + Atom<sup>†</sup>), plus the feeds above |
| `*.home.blog` | Same as `*.wordpress.com` |
| `*.wpcomstaging.com` | Same as `*.wordpress.com` |
| `*.edublogs.org` | Same as `*.wordpress.com` |

<sup>†</sup> *Found only by the Platform method.*

### WP Engine

Discovers feeds for WP Engine-hosted WordPress sites. Uses the same feed structure as [WordPress.com](#wordpress-com).

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.wpenginepowered.com` | Posts (RSS + Atom<sup>†</sup> + RDF<sup>†</sup>) · comments (RSS + Atom<sup>†</sup>) |
| `*.wpengine.com` | Same as WordPress.com (legacy domain) |

<sup>†</sup> *Found only by the Platform method.*

### Blogspot

Discovers RSS and Atom feeds for Blogspot blogs, including label, comments, summary, and per-post comments feeds. Also matches country-coded TLDs (`*.blogspot.co.uk`, `*.blogspot.de`, etc.), and Blogger blogs on custom domains, detected by the `www.blogger.com/static/v1/widgets/` assets every Blogger page loads.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.blogspot.com` | Posts (Atom + RSS) · summary (Atom + RSS) · comments (Atom + RSS<sup>†</sup>) |
| `*.blogspot.com/search/label/{label}` | Label<sup>†</sup> (Atom + RSS), plus the feeds above |
| `*.blogspot.com/{year}/{month}/{slug}.html` | Post comments (Atom + RSS<sup>†</sup>)*, plus the feeds above |
| Custom domain, any of the paths above | Same as on `*.blogspot.com` |

\* *Requires HTML content to extract the post ID.*

<sup>†</sup> *Found only by the Platform method.*

### DEV.to

Discovers RSS feeds for DEV.to user profiles, tags, the global community, and the latest sort.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `dev.to` | Community |
| `dev.to/latest` | Latest sort<sup>†</sup> · community |
| `dev.to/{username}` | User or organization posts |
| `dev.to/{username}/{article}` | Author's posts<sup>†</sup> |
| `dev.to/t/{tag}` | Tag posts<sup>†</sup> |

<sup>†</sup> *Found only by the Platform method.*

### Lobsters

Discovers RSS feeds for Lobsters homepage, users, tags, and domains.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `lobste.rs` | Homepage · site-wide comments |
| `lobste.rs/newest` | Newest posts |
| `lobste.rs/top` | Top stories |
| `lobste.rs/top/{period}` | Top stories by period (1d/3d/1w/1m/1y) |
| `lobste.rs/comments` | Site-wide comments |
| `lobste.rs/~{username}` | User stories<sup>†</sup> |
| `lobste.rs/t/{tag}` | Tag |
| `lobste.rs/t/{tag1},{tag2}` | Multi-tag |
| `lobste.rs/domains/{domain}` | Domain |

<sup>†</sup> *Found only by the Platform method.*

### Goodreads

Discovers RSS feeds for Goodreads user activity and bookshelves.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `goodreads.com/user/show/{id}` | User updates · reviews |
| `goodreads.com/review/list/{id}` | Reviews · user updates |

### GitHub

Discovers Atom feeds for users, organizations, and repositories.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `github.com/{user}`, `github.com/{user}.atom` or `github.com/{user}.png` | User activity<sup>†</sup> |
| `github.com/orgs/{org}/discussions` | Organization discussions<sup>†</sup> |
| `github.com/orgs/{org}/discussions/categories/{category}` | Discussion category<sup>†</sup>, plus the feeds above |
| `github.com/{owner}/{repo}` | Releases<sup>†</sup> · commits<sup>†</sup> · tags<sup>†</sup> |
| `github.com/{owner}/{repo}/wiki` | Wiki changes<sup>†</sup>, plus the feeds above |
| `github.com/{owner}/{repo}/discussions` | Discussions<sup>†</sup>, plus the feeds above |
| `github.com/{owner}/{repo}/discussions/categories/{category}` | Discussion category<sup>†</sup>, plus the feeds above |
| `github.com/{owner}/{repo}/tree/{branch}` | Branch commits<sup>†</sup>, plus the feeds above |
| `github.com/{owner}/{repo}/blob/{branch}/{path}` | File commits<sup>†</sup>, plus the feeds above |
| `github.com/{owner}/{repo}/commits/{branch}/{path}` | File commits<sup>†</sup>, plus the feeds above |

<sup>†</sup> *Found only by the Platform method.*

### GitHub Gist

Discovers Atom feeds for GitHub Gist users, starred gists, forked gists, and the discover stream.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `gist.github.com/{username}` | User gists |
| `gist.github.com/{username}/{gist-id}` | User gists |
| `gist.github.com/{username}/public` or `/secret` | User gists |
| `gist.github.com/{username}/starred` or `/starred.atom` | User starred gists |
| `gist.github.com/{username}/forks` or `/forked` | User forked gists<sup>†</sup> |
| `gist.github.com/discover` | Discover gists<sup>†</sup> |

<sup>†</sup> *Found only by the Platform method.*

### Gitea

Discovers Atom feeds for Gitea users, repositories, releases, tags, branch commits and file history, with RSS as the fallback. Codeberg and `gitea.com` are matched by host; any other instance is matched by the session cookie Gitea sets on a repository page.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{instance}/{user}`, `{instance}/{user}.rss`, `.atom` or `.keys` | User activity |
| `{instance}/{user}/{repo}` | Releases<sup>†</sup> · tags<sup>†</sup> · activity |
| `{instance}/{user}/{repo}/src/branch/{branch}` | Branch commits<sup>†</sup>, plus the feeds above |
| `{instance}/{user}/{repo}/src/branch/{branch}/{path}` | File history<sup>†</sup>, plus the feeds above |
| `{instance}/{user}/{repo}/commits/branch/{branch}` | Branch commits<sup>†</sup>, plus the feeds above |
| `{instance}/{user}/{repo}/commits/branch/{branch}/{path}` | File history<sup>†</sup>, plus the feeds above |

<sup>†</sup> *Found only by the Platform method.*

> [!NOTE]
> A self-hosted Forgejo instance sets no cookie on an anonymous request and is not matched; Codeberg, which runs Forgejo, is covered by the host list. `gitea.com` sends anonymous visitors of branch, file and commit history pages to its sign-in page, so discovery from those pages finds no feeds there.

### GitLab

Discovers Atom feeds for GitLab users and repositories. Self-hosted instances are detected via the `og:site_name` HTML meta tag or the `X-Gitlab-Meta` response header, on project paths only: `/{group}/{project}` or any path containing `/-/`.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `gitlab.com/{user}` or `gitlab.com/{user}.atom` | User activity |
| `gitlab.com/{project}` | Releases<sup>†</sup> · tags<sup>†</sup> · issues<sup>†</sup> · merge requests<sup>†</sup> · activity |
| `gitlab.com/{project}/-/commits/{branch}` | Branch commits, plus the feeds above |
| `gitlab.com/{project}/-/tree/{branch}` | Branch commits, plus the feeds above |

<sup>†</sup> *Found only by the Platform method.*

> `{project}` is the full path and can be any depth, because groups nest: `group/subgroup/project` is one project. GitLab puts `/-/` between the project path and the feature path, which is where the split happens.

### Product Hunt

Discovers the Atom feed for Product Hunt.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `producthunt.com` | Products (Atom) |

> There is one feed. Topic and category pages have no feed of their own, and the `?topic=` and `?category=` parameters are ignored.

### Pinboard

Discovers RSS feeds for Pinboard users, user tags, and the popular and recent lists.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `pinboard.in` | Popular bookmarks<sup>†</sup> |
| `pinboard.in/popular` | Popular bookmarks<sup>†</sup> |
| `pinboard.in/recent` | Recent bookmarks<sup>†</sup> |
| `pinboard.in/u:{username}` | User bookmarks<sup>†</sup> |
| `pinboard.in/u:{username}/t:{tag}` | User tag<sup>†</sup> |
| `pinboard.in/u:{username}/t:{tag1}/t:{tag2}` | User multi-tag<sup>†</sup> |
| `pinboard.in/t:{tag}` | Site-wide tag<sup>?</sup> |

<sup>†</sup> *Found only by the Platform method.*

<sup>?</sup> *Not measured, the feed failed to load during the run.*

### Pinterest

Discovers RSS feeds for Pinterest user profiles.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `pinterest.com/{username}` | User pins<sup>†</sup> |

<sup>†</sup> *Found only by the Platform method.*

### Dailymotion

Discovers RSS feeds for Dailymotion users, playlists, channels, and the global trending feed.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `dailymotion.com/{username}` | User videos<sup>†</sup> |
| `dailymotion.com/playlist/{id}` | Playlist<sup>†</sup> |
| `dailymotion.com/channel/{name}` | Channel<sup>†</sup> |
| `dailymotion.com` or `dailymotion.com/trending` | Trending<sup>†</sup> |

<sup>†</sup> *Found only by the Platform method.*

### DeviantArt

Discovers RSS feeds for DeviantArt user portfolios, gallery folders, favourites, and tags.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `deviantart.com/{username}` | User deviations<sup>†</sup> |
| `deviantart.com/{username}/gallery` | User gallery<sup>†</sup> |
| `deviantart.com/{username}/gallery/{id}` | Gallery folder<sup>†</sup> |
| `deviantart.com/{username}/favourites` | User favourites<sup>†</sup> |
| `deviantart.com/{username}/journal` | Journal |
| `deviantart.com/tag/{tag}` | Tag<sup>†</sup> |
| `deviantart.com/daily-deviations` | Daily deviations<sup>†</sup> |

<sup>†</sup> *Found only by the Platform method.*

### Mastodon

Discovers RSS feeds for Mastodon user profiles and hashtag pages. Detects Mastodon instances via the `<meta name="generator">` HTML tag, the `<div id="mastodon">` app root or the `Server` response header. There is no hardcoded instance list.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{instance}/@{username}` or `{instance}/users/{username}` | User posts |
| `{instance}/@{username}/tagged/{tag}` | User posts tagged · posts<sup>†</sup> |
| `{instance}/@{username}/with_replies` | User posts with replies<sup>†</sup> · posts |
| `{instance}/@{username}/media` | User media-only<sup>†</sup> · posts |
| `{instance}/tags/{tag}` | Hashtag<sup>†</sup> |

<sup>†</sup> *Found only by the Platform method.*

> [!NOTE]
> Requires page content or response headers to detect Mastodon instances. Works with any Mastodon-compatible server, not just well-known instances.

### Bluesky

Discovers RSS feeds for Bluesky profiles.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `bsky.app/profile/{handle}` | Profile posts |

### Tumblr

Discovers RSS feeds for Tumblr blogs and tagged posts.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.tumblr.com` | Blog posts |
| `*.tumblr.com/tagged/{tag}` | Tagged posts<sup>†</sup> |
| `www.tumblr.com/{blog}` | Blog posts |

<sup>†</sup> *Found only by the Platform method.*

### Behance

Discovers RSS feeds for Behance user portfolios, plus the homepage Featured-projects feed.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `behance.net` or `behance.net/galleries` | Featured projects |
| `behance.net/{username}` | User portfolio<sup>†</sup> |
| `behance.net/{username}/appreciated` | User portfolio* |

\* *Behance ignores `content=appreciated` and serves the user's own projects, so the appreciated page gets the portfolio feed.*

<sup>†</sup> *Found only by the Platform method.*

### SoundCloud

Discovers RSS feeds for SoundCloud user profiles.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `soundcloud.com/{user}` | User sounds<sup>†</sup>* |

\* *Requires HTML content to extract user ID.*

<sup>†</sup> *Found only by the Platform method.*

### Vimeo

Discovers RSS feeds for Vimeo user profiles, channels, groups, and albums (showcases).

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `vimeo.com/{user}` | User videos |
| `vimeo.com/{user}/likes` | User likes · user videos<sup>†</sup> |
| `vimeo.com/channels/{channel}` | Channel |
| `vimeo.com/groups/{group}` | Group |
| `vimeo.com/album/{id}` | Album/showcase<sup>†</sup> |

<sup>†</sup> *Found only by the Platform method.*

### SourceForge

Discovers RSS feeds for SourceForge project activity, file releases, news, and discussion.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `sourceforge.net/projects/{project}` or `sourceforge.net/p/{project}` | Activity · project · files · news<sup>†</sup> (RSS + Atom) · discussion<sup>†</sup> (RSS + Atom) · bugs<sup>†</sup> |

<sup>†</sup> *Found only by the Platform method.*

### Kickstarter

Discovers Atom feeds for Kickstarter projects and global new projects.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `kickstarter.com` | Global new projects<sup>†</sup> |
| `kickstarter.com/discover` | Global new projects |
| `kickstarter.com/projects/{creator}/{project}` | Project updates<sup>†</sup> |

<sup>†</sup> *Found only by the Platform method.*

### Launchpad

Discovers the Atom feeds Launchpad serves on `feeds.launchpad.net` for projects, distributions, people, teams, bugs and Bazaar branches. The `bugs.` and `code.` subdomains get the feeds of their own section.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `launchpad.net` | Announcements<sup>†</sup> |
| `bugs.launchpad.net` | Latest bugs<sup>†</sup> |
| `launchpad.net/{project}` | Announcements · latest bugs · branches · revisions |
| `bugs.launchpad.net/{project}` | Latest bugs |
| `code.launchpad.net/{project}` | Branches · revisions |
| `launchpad.net/~{user}` | Latest bugs · branches · revisions |
| `bugs.launchpad.net/~{user}` | Latest bugs |
| `code.launchpad.net/~{user}` | Branches<sup>†</sup> · revisions<sup>†</sup> |
| `bugs.launchpad.net/{distro}/+source/{package}` | Package latest bugs |
| `bugs.launchpad.net/{project}/+bug/{id}` or `bugs.launchpad.net/bugs/{id}` | Bug |
| `code.launchpad.net/~{user}/{project}/{branch}` | Branch |

<sup>†</sup> *Found only by the Platform method.*

### Letterboxd

Discovers RSS feeds for Letterboxd user profiles.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `letterboxd.com/{username}` | User diary |
| `letterboxd.com/journal` | Journal |

### Steam

Discovers RSS feeds for Steam game news and community groups.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `store.steampowered.com` | Global news<sup>†</sup> · daily deals<sup>†</sup> |
| `store.steampowered.com/news` | Global news<sup>†</sup> · daily deals<sup>†</sup> |
| `store.steampowered.com/app/{id}` | Game news<sup>†</sup> |
| `store.steampowered.com/news/app/{id}` | Game news<sup>†</sup> |
| `store.steampowered.com/newshub/app/{id}` | Game news |
| `steamcommunity.com/app/{id}` | Game news<sup>†</sup> |
| `steamcommunity.com/groups/{name}` | Group<sup>†</sup> (RSS) |

<sup>†</sup> *Found only by the Platform method.*

### Stack Exchange

Discovers Atom feeds for Stack Overflow, Server Fault, Super User, Ask Ubuntu, MathOverflow, Stack Apps, and all `*.stackexchange.com` sites.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{site}` | Site-wide newest questions |
| `{site}/questions/tagged/{tag}` | Tag<sup>†</sup> |
| `{site}/questions/{id}` | Question |
| `{site}/users/{id}` | User<sup>†</sup> |
| `{site}/collectives/{name}` | Collective<sup>†</sup> |

<sup>†</sup> *Found only by the Platform method.*

> [!NOTE]
> Tag feeds accept `?sort={newest|active|votes|creation|hot|week|month}` (also `?tab=…`). The value is passed through to the generated feed URL when it matches one of the allowed sorts. Unknown values are silently dropped.

### Hashnode

Discovers RSS feeds for Hashnode blogs on `*.hashnode.dev`.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.hashnode.dev` | Blog |

### Paragraph

Discovers RSS feeds for Paragraph blogs (successor to Mirror.xyz).

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `paragraph.com/@{username}` | Blog |

### Hatena Antenna

Discovers RSS feeds for Hatena Antenna users and their groups.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `a.hatena.ne.jp/{user}` | Antenna |
| `a.hatena.ne.jp/{user}/?gid={group}` | Group<sup>?</sup> |

<sup>?</sup> *Not measured, the feed failed to load during the run.*

> A group id the user does not have falls back to the antenna feed, since Hatena serves an empty feed under any made-up group id. A real group with no updated page keeps its own feed.

### Hatena Bookmark

Discovers RSS feeds for Hatena Bookmark listings, searches, sites and user bookmarks.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `b.hatena.ne.jp` | Hot entries |
| `b.hatena.ne.jp/hotentry/{category}` | Hot entries by category |
| `b.hatena.ne.jp/entrylist/{category}` | New entries by category |
| `b.hatena.ne.jp/search/{tag\|text\|title}?q={query}` | Search |
| `b.hatena.ne.jp/site/{domain}` | Site bookmarks<sup>†</sup> |
| `b.hatena.ne.jp/{user}` | User bookmarks |

<sup>†</sup> *Found only by the Platform method.*

> Categories are `it`, `general`, `social`, `economics`, `life`, `knowledge`, `fun`, `entertainment` and `game`. Search and site feeds keep any filters already on the URL and add `mode=rss`.

### Hatena Fotolife

Discovers RSS feeds for Hatena Fotolife users, folders, tags, camera models and stars.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `f.hatena.ne.jp/{user}` | Photos |
| `f.hatena.ne.jp/{user}?model={model}` | Camera model |
| `f.hatena.ne.jp/{user}/{folder}/` | Folder |
| `f.hatena.ne.jp/{user}/t/{tag}` | Tag |
| `f.hatena.ne.jp/{user}/favorite` | Stars |
| `f.hatena.ne.jp/{user}/starfriends` | Star Friends |

> A folder, tag or camera model page that lists no photo falls back to the user's photos feed, since Hatena serves an empty feed under any made-up name.

### Hatena Blog

Discovers RSS and Atom feeds for Hatena Blog on `*.hatenablog.com`, `*.hatenablog.jp`, and `*.hateblo.jp`.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.hatenablog.com` | Posts (RSS + Atom) |
| `*.hatenablog.jp` | Posts (RSS + Atom) |
| `*.hateblo.jp` | Posts (RSS + Atom) |
| `*/archive/category/{category}` | Category (RSS + Atom) · posts |
| `*/archive/author/{author}` | Author (RSS + Atom) · posts |

### Itch.io

Discovers RSS feeds for Itch.io games, creators, devlogs, and browse pages.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{creator}.itch.io/{game}` | Game devlog |
| `{creator}.itch.io` | Creator's games<sup>†</sup> |
| `itch.io/games` or `/games.xml` | Games<sup>†</sup> |
| `itch.io/games/by-{username}` or `/by-{username}.xml` | Creator's games<sup>†</sup> |
| `itch.io/games/tag-{tag}` or `/tag-{tag}.xml` | Tag<sup>†</sup> |
| `itch.io/games/platform-{platform}` or `/platform-{platform}.xml` | Platform<sup>†</sup> |
| `itch.io/games/genre-{genre}` or `/genre-{genre}.xml` | Genre<sup>†</sup> |
| `itch.io/games/made-with-{engine}` or `/made-with-{engine}.xml` | Engine<sup>†</sup> |
| `itch.io/games/{sort}` or `/{sort}.xml` | Sorted games<sup>†</sup> (newest/top-rated/top-sellers/on-sale/free/released/in-development) |
| `itch.io/{section}` or `/{section}.xml` | Section<sup>†</sup> (tools/game-assets/soundtracks/physical-games/books/comics/misc) |
| `itch.io/devlogs` or `/devlogs.xml` | All devlogs |
| `itch.io` | Featured · new<sup>†</sup> · sales<sup>†</sup> · all devlogs<sup>†</sup> · itch.io blog |
| `itch.io/feed/{feed}.xml` | Curated (featured/new/sales) |
| `itch.io/blog` or `itch.io/blog.rss` | itch.io blog |

<sup>†</sup> *Found only by the Platform method.*

### CSDN

Discovers RSS feeds for CSDN user blogs.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `blog.csdn.net/{username}` | Blog<sup>†</sup> |

<sup>†</sup> *Found only by the Platform method.*

### Douban

Discovers RSS feeds for Douban user interests, reviews, notes, and subject reviews.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `www.douban.com/people/{user}` | Interests · reviews<sup>†</sup> · notes<sup>†</sup> |
| `{subdomain}.douban.com/subject/{id}` | Subject reviews |
| `www.douban.com` | Book<sup>†</sup> · movie<sup>†</sup> · music<sup>†</sup> · drama<sup>†</sup> reviews |

<sup>†</sup> *Found only by the Platform method.*

### V2EX

Discovers Atom feeds for V2EX index, nodes, members, and tabs.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `v2ex.com` | Index |
| `v2ex.com/go/{node}` | Node |
| `v2ex.com/member/{username}` | Member |
| `v2ex.com/?tab={tab}` | Tab · index |

### Ximalaya

Discovers RSS feeds for Ximalaya podcast albums.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `www.ximalaya.com/album/{id}` | Album<sup>†</sup> |

<sup>†</sup> *Found only by the Platform method.*

### Write.as

Discovers RSS feeds for Write.as blogs, including tag feeds.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `write.as/{user}` | Blog |
| `write.as/{user}/tag:{tag}` | Tag · blog |

### Prose.sh

Discovers Atom feeds for Prose.sh blogs.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `prose.sh` | Discovery |
| `*.prose.sh` | Blog |

### Pagecord

Discovers RSS feeds for Pagecord blogs.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.pagecord.com` | Blog |

### ArtStation

Discovers RSS feeds for ArtStation portfolios and the global artwork feed.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `artstation.com/{user}` | Portfolio<sup>†</sup> |
| `{user}.artstation.com` | Portfolio |
| `artstation.com/artwork` | Artwork<sup>†</sup> · Artwork (Latest)<sup>†</sup> |

<sup>†</sup> *Found only by the Platform method.*

> `?sorting=trending` is the feed default and returns the same items as the bare URL, so only `?sorting=latest` is emitted alongside it.

### Bear Blog

Discovers Atom and RSS feeds for Bear Blog, including tag-filtered feeds.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `bearblog.dev` | Trending<sup>†</sup> (Atom + RSS) |
| `*.bearblog.dev` | Posts (Atom + RSS) |
| `*.bearblog.dev/?q={tag}` | Tag (Atom + RSS) · posts |

<sup>†</sup> *Found only by the Platform method.*

### Buttondown

Discovers RSS feeds for Buttondown newsletters.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `buttondown.com/{user}` | Newsletter |

### Dreamwidth

Discovers RSS and Atom feeds for Dreamwidth blogs.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.dreamwidth.org` | Posts (RSS + Atom) · userpics<sup>†</sup> (Atom) |

<sup>†</sup> *Found only by the Platform method.*

### Excite Blog

Discovers RSS and Atom feeds for Excite Blog, including category feeds.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{blog}.exblog.jp` | Posts (RSS + Atom) |
| `{blog}.exblog.jp/i{N}` | Category (RSS + Atom) · posts |

### Fireside.fm

Discovers RSS and JSON feeds for Fireside.fm-hosted podcasts.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.fireside.fm` | Podcast (RSS + JSON) |

### Firstory

Discovers the RSS feed of a Firstory podcast. The feed is keyed by the show's ID, which the handler reads from the page.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `open.firstory.fm/user/{show}` | Podcast (RSS) |
| `open.firstory.fm/story/{episodeId}` | Podcast (RSS) |
| `{show}.firstory.cc` | Podcast (RSS) |
| `{show}.firstory.cc/episodes/{episodeId}` | Podcast (RSS) |

### Hacker News

Discovers RSS feeds for Hacker News.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `news.ycombinator.com` | Front page (RSS) |
| `news.ycombinator.com/show` | Show HN (RSS) |

### Listed

Discovers RSS feeds for Listed (Standard Notes) blogs.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `listed.to/@{user}` | Blog |

### MyAnimeList

Discovers RSS feeds for MyAnimeList user lists and site-wide news.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `myanimelist.net/profile/{user}` | Anime list<sup>†</sup> · Manga list<sup>†</sup> · Recently watched<sup>†</sup> · Recently read<sup>†</sup> · Blog (RSS) |
| `myanimelist.net/animelist/{user}` | Anime list<sup>†</sup> · Manga list<sup>†</sup> · Recently watched<sup>†</sup> · Recently read<sup>†</sup> · Blog<sup>†</sup> (RSS) |
| `myanimelist.net/mangalist/{user}` | Anime list<sup>†</sup> · Manga list<sup>†</sup> · Recently watched<sup>†</sup> · Recently read<sup>†</sup> · Blog<sup>†</sup> (RSS) |
| `myanimelist.net/history/{user}` | (same as above) |
| `myanimelist.net/news` | Site-wide news |
| `myanimelist.net/featured` | Featured articles |

<sup>†</sup> *Found only by the Platform method.*

### Nebula

Discovers RSS feeds for Nebula channels, the global video feed, and category feeds, each with a Plus-only variant.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `nebula.tv/{channel}` | Videos · Videos (Plus) |
| `nebula.tv` | All videos · All videos (Plus) · Nebula Originals · recently added channels |
| `nebula.tv/videos` | All videos · All videos (Plus) · Nebula Originals · recently added channels |
| `nebula.tv/videos?category={slug}` | Category · Category (Plus), plus the feeds above |

### note.com

Discovers RSS feeds for note.com, including hashtag and magazine feeds.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `note.com` | Featured |
| `note.com/{user}` | Blog |
| `note.com/hashtag/{tag}` or `note.com/tag/{tag}` | Hashtag<sup>†</sup> |
| `note.com/{user}/m/{magazineId}` | Magazine<sup>†</sup> |

<sup>†</sup> *Found only by the Platform method.*

### Odysee

Discovers RSS feeds for Odysee channels.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `odysee.com/@{channel}:{id}` | Videos<sup>†</sup> |

<sup>†</sup> *Found only by the Platform method.*

### Tistory

Discovers RSS feeds for Tistory blogs.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.tistory.com` | Blog<sup>†</sup> |

<sup>†</sup> *Found only by the Platform method.*

### Transistor

Discovers RSS feeds for Transistor-hosted podcasts.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.transistor.fm` | Podcast* |

\* *The feed slug can differ from the subdomain. It is read from the page content when available, with the subdomain as the fallback.*

### Velog

Discovers RSS feeds for Velog users and the platform-wide trending feed.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `velog.io/@{user}` | Posts<sup>†</sup> |
| `velog.io` | Trending posts<sup>†</sup> |

<sup>†</sup> *Found only by the Platform method.*

### Acast

Discovers RSS feeds for Acast-hosted podcasts.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `shows.acast.com/{slug}` | Podcast (RSS) |
| `play.acast.com/s/{slug}` | Podcast (RSS) |
| `embed.acast.com/{slug}` | Podcast<sup>†</sup> (RSS) |

<sup>†</sup> *Found only by the Platform method.*

### Ameba Blog

Discovers RSS, Atom, and RDF feeds for Ameba Blog.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `ameblo.jp/{user}` | Posts (RSS + Atom + RDF<sup>†</sup>) |

<sup>†</sup> *Found only by the Platform method.*

### Are.na

Discovers RSS feeds for Are.na user profiles and channels.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `are.na/{user}` | User profile |
| `are.na/{user}/{channel}` | Channel |
| `are.na/editorial` | Editorial |

### Audioboom

Discovers RSS feeds for Audioboom channels.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `audioboom.com/channels/{id}` | Podcast (RSS) |

### Ausha

Discovers the RSS feed of an Ausha show by reading its feed id from the page content.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `podcast.ausha.co/{show}` | Podcast<sup>†</sup> (RSS)* |
| `podcast.ausha.co/{show}/{episode}` | Podcast<sup>†</sup> (RSS)* |
| `smartlink.ausha.co/{show}` | Podcast (RSS)* |
| `smartlink.ausha.co/{show}/{episode}` | Podcast (RSS)* |

\* *Requires HTML content to extract the feed id.*

<sup>†</sup> *Found only by the Platform method.*

### BookWyrm

Discovers RSS feeds for BookWyrm user activity, reviews, quotes, comments, and per-shelf feeds. Detected by the link to the BookWyrm source code in the page footer, or by the `BookWyrm` generator meta tag.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{instance}/user/{user}` | Activity · reviews<sup>†</sup> · quotes<sup>†</sup> · comments<sup>†</sup> (RSS) |
| `{instance}/user/{user}/(shelf\|books)/{shelf-id}` | Shelf (RSS) · activity/reviews<sup>†</sup>/quotes<sup>†</sup>/comments<sup>†</sup> |

<sup>†</sup> *Found only by the Platform method.*

### Buzzsprout

Discovers RSS feeds for Buzzsprout-hosted podcasts.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `buzzsprout.com/{id}` | Podcast |

### CANPAN Blog

Discovers RSS 2.0 and RDF feeds for CANPAN Blog.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `blog.canpan.info/{blog}` | Posts (RSS 2.0<sup>†</sup> + RDF) |

<sup>†</sup> *Found only by the Platform method.*

### Canalblog

Discovers RSS feeds for Canalblog.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.canalblog.com` | Posts |

### Captivate

Discovers RSS feeds for Captivate-hosted podcasts.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.captivate.fm` | Podcast (RSS) |

### Castopod

Discovers the RSS feed of a podcast hosted on a Castopod instance. Detected by the theme colors stylesheet that Castopod prints in every page head.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{instance}/@{handle}` | Podcast (RSS) |
| `{instance}/@{handle}/episodes/{slug}` | Podcast (RSS) |

### Castos

Discovers RSS feeds for podcasts with a Castos-hosted website.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.castos.com` | Podcast (RSS) |

### Discourse

Discovers RSS feeds for Discourse forums. Detected by the `Discourse` generator meta tag, the `data-discourse-setup` meta tag or the `X-Discourse-Route` response header.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{instance}/u/{user}` | User activity<sup>†</sup> (RSS) |
| `{instance}/c/{slug}` | Category (RSS) |
| `{instance}/t/{slug}/{id}` | Topic (RSS) |
| `{instance}/top` or `/top/{period}` | Top topics (RSS) |
| `{instance}/` (or any other path) | Latest topics · latest posts (RSS) |

<sup>†</sup> *Found only by the Platform method.*

> [!NOTE]
> The top topics feed accepts `{daily|weekly|monthly|quarterly|yearly|all}` via either the `/top/{period}` path or `?period={period}` query param. An unknown path period falls back to the query param, and an unknown value in both is dropped.

### Flickr

Discovers Atom feeds for Flickr photostreams, favorites, tags, groups and the help forum.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `flickr.com/photos/tags/{tag}` | Tag<sup>†</sup> |
| `flickr.com/photos/{nsid}` | Photostream |
| `flickr.com/photos/{nsid}/favorites` | Favorites |
| `flickr.com/groups/{nsid}` | Group pool<sup>†</sup> · discussions · pool with location |
| `flickr.com/groups/{nsid}/pool` | Group pool<sup>†</sup> · pool with location |
| `flickr.com/groups/{nsid}/discuss` | Group discussions |
| `flickr.com/help/forum` | Forum<sup>†</sup> |

<sup>†</sup> *Found only by the Platform method.*

> The photo and group feeds take an NSID such as `24662369@N07`, never a vanity alias: `photos_public.gne?id={alias}` answers 404. A URL carrying an alias is left to the other methods, and the page itself links the right feed.

### Friendica

Discovers Atom feeds for Friendica user profiles. Detected by the `Friendica` generator meta tag or the `X-Friendica-Version` response header.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{instance}/profile/{user}` | Posts · comments · replies · activity (Atom) |

### Ghost

Discovers RSS feeds for Ghost-hosted blogs, including tag and author feeds.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.ghost.io` | Blog |
| `*.ghost.io/tag/{slug}` | Tag · blog |
| `*.ghost.io/author/{slug}` | Author · blog |

### Hearthis.at

Discovers RSS feeds for Hearthis.at user profiles, plus the site-wide new tracks feed every page links.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `hearthis.at/{user}` | Tracks · new tracks |

### HEY World

Discovers Atom feeds for HEY World blogs.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `world.hey.com/{user}` | Blog |

### Huffduffer

Discovers RSS feeds for Huffduffer users and their huffduffed episodes.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `huffduffer.com/{user}` | Huffduffs |
| `huffduffer.com/{user}/{id}` | Possibly related<sup>†</sup> · huffduffs |
| `huffduffer.com/{user}/{id}/related` | Possibly related |

<sup>†</sup> *Found only by the Platform method.*

### InsaneJournal

Discovers RSS and Atom feeds for InsaneJournal journals.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.insanejournal.com` | Posts (RSS + Atom) · userpics<sup>†</sup> (Atom) |

<sup>†</sup> *Found only by the Platform method.*

### JUGEM

Discovers RSS 1.0 and Atom feeds for JUGEM blogs. A blog on a custom domain is detected by `imaging.jugem.jp` assets or the `./template/js/cookie.js` script.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{blog}.jugem.jp` | Posts (RSS 1.0 + Atom) |
| `{blog}.jugem.cc` | Posts (RSS 1.0 + Atom) |
| Any page on a custom domain | Posts (RSS 1.0 + Atom) |

### Lemmy

Discovers RSS feeds for Lemmy instances, communities and users. Detected by the `lemmy-site` app root, the `Lemmy` generator meta tag or the `X-Powered-By` response header. There is no hardcoded instance list.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{instance}/` | All posts · local posts |
| `{instance}/c/{community}` | Community |
| `{instance}/u/{user}` | User |

> [!NOTE]
> Requires page content or response headers to detect Lemmy instances. The `?sort=` and `?limit=` query params are passed through to the generated feed URL. Unknown sort values are silently dropped. When the page URL has no valid sort, the feed takes the sort the page advertises.

### Libsyn

Discovers RSS feeds for Libsyn-hosted podcasts.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{slug}.libsyn.com` | Podcast |
| `feeds.libsyn.com/{showId}` | Podcast |

### Livedoor Blog

Discovers RDF and Atom feeds for Livedoor Blog on `*.blog.jp`, `*.doorblog.jp`, `*.ldblog.jp`, and `*.livedoor.biz`, including category feeds.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{blog}.blog.jp` | Posts (RDF + Atom) |
| `{blog}.blog.jp/archives/cat_{N}.html` | Category (RDF) · posts |
| `{blog}.doorblog.jp` | Posts (RDF + Atom) |
| `{blog}.doorblog.jp/archives/cat_{N}.html` | Category (RDF) · posts |
| `{blog}.ldblog.jp` | Posts (RDF + Atom) |
| `{blog}.ldblog.jp/archives/cat_{N}.html` | Category (RDF) · posts |
| `{blog}.livedoor.biz` | Posts (RDF + Atom) |
| `{blog}.livedoor.biz/archives/cat_{N}.html` | Category (RDF) · posts |

### LiveJournal

Discovers RSS and Atom feeds for LiveJournal blogs.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.livejournal.com` | Posts (RSS + Atom) · userpics<sup>†</sup> (Atom) |

<sup>†</sup> *Found only by the Platform method.*

### Mataroa

Discovers RSS feeds for Mataroa blogs.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.mataroa.blog` | Blog |

### Megaphone

Discovers RSS feeds for Megaphone-hosted podcasts from their embed players.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `playlist.megaphone.fm/?p={id}` | Podcast<sup>†</sup> |
| `player.megaphone.fm/{episode}` | Podcast (read from the page) |

<sup>†</sup> *Found only by the Platform method.*

### Micro.blog

Discovers RSS, JSON, and podcast feeds for Micro.blog-hosted blogs, including category, archive, photos, and replies feeds.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.micro.blog` | Posts (RSS + JSON) · podcast (RSS + JSON<sup>†</sup>) |
| `*.micro.blog/categories/{slug}` | Category (RSS + JSON), plus the feeds above |
| `*.micro.blog/archive` | Archive<sup>†</sup>, plus the feeds above |
| `*.micro.blog/photos` | Photos<sup>†</sup>, plus the feeds above |
| `*.micro.blog/replies` | Replies, plus the feeds above |

<sup>†</sup> *Found only by the Platform method.*

### Misskey

Discovers Atom, RSS, and JSON feeds for Misskey and Sharkey user profiles. Detected by the `Misskey` or `Sharkey` application-name meta tag, or the `misskey_meta` script tag.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{instance}/@{user}` | Posts<sup>†</sup> (Atom + RSS + JSON) |

<sup>†</sup> *Found only by the Platform method.*

### Naver Blog

Discovers RSS feeds for Naver Blog.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `blog.naver.com/{id}` | Blog |
| `m.blog.naver.com/{id}` | Blog<sup>†</sup> |

<sup>†</sup> *Found only by the Platform method.*

### Observable

Discovers RSS feeds for Observable user notebooks and collections.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `observablehq.com/@{user}` | Notebooks<sup>†</sup> |
| `observablehq.com/@{user}/collection/{slug}` or `/@{user}/-/collection/{slug}` | Collection<sup>†</sup> |
| `observablehq.com/recent` or `/public?sort=publish_time` | Recent<sup>†</sup> |
| `observablehq.com/trending` or `/public` | Trending<sup>†</sup> |

<sup>†</sup> *Found only by the Platform method.*

### Pika

Discovers Atom and RSS feeds for Pika blogs, including tag feeds.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.pika.page` | Posts (Atom + RSS<sup>†</sup>) |
| `*.pika.page/tag/{tag}` | Tag (Atom + RSS<sup>†</sup>) · posts (Atom + RSS<sup>†</sup>) |

<sup>†</sup> *Found only by the Platform method.*

### Pixelfed

Discovers Atom feeds for Pixelfed user profiles. Detected by the `pixelfed` generator meta tag or the `Pixelfed` application-name meta tag.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{instance}/{user}` or `{instance}/users/{user}` | Posts (Atom) |

### Pleroma

Discovers Atom and RSS feeds for Pleroma (and Akkoma) user profiles. Detected by Pleroma-specific API endpoint references in HTML.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{instance}/users/{user}` | Posts (Atom + RSS<sup>†</sup>) |

<sup>†</sup> *Found only by the Platform method.*

### Podbean

Discovers RSS feeds for Podbean-hosted podcasts.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.podbean.com` | Podcast |

### Podhome

Discovers the RSS feed of a Podhome show, on `serve.podhome.fm` or a custom domain. Detected by the show site's assets on `cdn.podhome.fm`, and the feed is read from the page, since its URL carries an ID the page URL does not.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `serve.podhome.fm/{show}` | Podcast (RSS) |
| `serve.podhome.fm/episodepage/{show}/{episode}` | Podcast (RSS) |
| Any page of a show on a custom domain | Podcast (RSS) |

### Podigee

Discovers RSS feeds for Podigee-hosted podcasts.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.podigee.io` | Podcast (RSS) |

### Postach.io

Discovers Atom feeds for Postach.io sites.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.postach.io` | Posts (Atom) |

### Posthaven

Discovers Atom feeds for Posthaven blogs.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.posthaven.com` | Posts (Atom) |

### Qiita

Discovers Atom feeds for Qiita users, tags, organizations, and popular items.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `qiita.com/{user}` | User posts |
| `qiita.com/tags/{tag}` | Tag |
| `qiita.com/organizations/{org}` | Organization |
| `qiita.com/popular-items` | Popular items |
| `qiita.com/official-columns` | Qiita Zine |

### RSS.com

Discovers RSS feeds for RSS.com-hosted podcasts.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `rss.com/podcasts/{slug}` | Podcast |

### RubyGems

Discovers Atom feeds for RubyGems.org gems and the site-wide latest gems.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `rubygems.org/gems/{name}` | Gem versions (Atom) |
| `rubygems.org` | Latest gems<sup>†</sup> (Atom) |

<sup>†</sup> *Found only by the Platform method.*

> Every page links the latest gems feed through a FeedBurner address that now serves HTML, so the handler emits the rubygems.org copy.

### Sakura blog

Discovers RSS 2.0 and RDF feeds for Sakura blog.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.sblo.jp` | Posts (RSS 2.0 + RDF) |

### SAPO Blogs

Discovers the posts, comments and tag feeds of a blog on `*.blogs.sapo.pt`. Comment feeds are served from `blogs.sapo.pt`.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{blog}.blogs.sapo.pt` | Posts (RSS + Atom) · comments<sup>†</sup> |
| `{blog}.blogs.sapo.pt/{slug}-{id}` | Post comments<sup>†</sup>, plus the blog feeds |
| `{blog}.blogs.sapo.pt/{id}.html` | Post comments<sup>†</sup>, plus the blog feeds |
| `{blog}.blogs.sapo.pt/tag/{tag}` | Tag<sup>†</sup>, plus the blog feeds |

<sup>†</sup> *Found only by the Platform method.*

### Seesaa Blog

Discovers RSS 2.0 and RDF feeds for Seesaa Blog on `*.seesaa.net` and its other blog domains.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.seesaa.net` | Posts (RSS 2.0 + RDF) |
| `*.iiblog.jp` | Posts (RSS 2.0 + RDF) |
| `*.seesaa.blog` | Posts<sup>†</sup> (RSS 2.0 + RDF) |
| `*.seesaa.space` | Posts (RSS 2.0 + RDF) |
| `*.sokuho.org` | Posts (RSS 2.0 + RDF) |
| `*.stablo.jp` | Posts (RSS 2.0 + RDF) |
| `*.xblog.jp` | Posts (RSS 2.0 + RDF) |

<sup>†</sup> *Found only by the Platform method.*

### Sermon.net

Discovers the audio podcast feed of every channel a church page lists, or of the one channel a channel page names.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.sermon.net` | Channel podcasts (RSS), or the church feed when no channel is listed |
| `*.sermon.net/{mediaCentre}/{channel}` | That channel's podcast<sup>†</sup> (RSS) |

<sup>†</sup> *Found only by the Platform method.*

### Shinobi Blog

Discovers RSS and Atom feeds for Shinobi Blog, on `blog.shinobi.jp` and on 100 other Ninja Blog domains such as `ni-3.net`.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{blog}.blog.shinobi.jp` | Posts (RSS + Atom) |
| `{blog}.{domain}` | Posts (RSS + Atom) |

### Spotify for Creators

Discovers RSS feeds for Spotify for Creators (formerly Anchor) podcasts by extracting the station ID from the page content.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `creators.spotify.com/pod/profile/{name}` | Podcast* |
| `creators.spotify.com/pod/show/{name}` | Podcast* |
| `creators.spotify.com/pod/profile/{name}/episodes/{slug}` | Podcast* |

\* *Requires HTML content to extract the station ID.*

### Spreaker

Discovers RSS feeds for Spreaker-hosted podcasts.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `spreaker.com/podcast/{slug}--{id}` | Podcast |
| `spreaker.com/show/{id}` | Podcast |

### Tildes

Discovers RSS and Atom feeds for Tildes homepage and groups.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `tildes.net` | Topics (RSS + Atom) |
| `tildes.net/~{group}` | Group (RSS + Atom) |

### Viabloga

Discovers RSS, Atom and RDF feeds for Viabloga.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.viabloga.com` | Posts (RSS + Atom + RDF) · comments<sup>†</sup> · wiki<sup>†</sup> |

<sup>†</sup> *Found only by the Platform method.*

### weblog.lol

Discovers RSS, Atom, and JSON feeds for weblog.lol blogs.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.weblog.lol` | Posts (RSS + Atom + JSON) |

### Weebly

Discovers RSS feeds for Weebly-hosted blogs.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.weebly.com` | Blog |
| `*.weebly.com/{slug}` | Blog (custom page slug) · default blog |

### Zenn

Discovers RSS feeds for Zenn users, topics, publications, and the platform-wide trending feed.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `zenn.dev/{user}` | User posts |
| `zenn.dev/topics/{topic}` | Topic |
| `zenn.dev/p/{pub}` | Publication |
| `zenn.dev/publications/{pub}` | Publication |
| `zenn.dev` | Trending posts |

### BitChute

Discovers RSS feeds for BitChute channels. Channel pages carry only an oEmbed link, so nothing finds these without the handler.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `bitchute.com/channel/{slug}` | Channel<sup>†</sup> (RSS) |

<sup>†</sup> *Found only by the Platform method.*

> [!NOTE]
> The feed endpoint accepts only the vanity slug that appears in the channel URL. A channel's internal id returns 404.

### Confluence

Discovers the Atom activity streams of a Confluence Data Center site. Detected by the `confluence-base-url` meta tag, with the context path and space key read from the page.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| Any page on a space | Space stream<sup>†</sup> · site stream<sup>†</sup> (Atom) |
| Any other page | Site stream<sup>†</sup> (Atom) |

<sup>†</sup> *Found only by the Platform method.*

> [!NOTE]
> Confluence Cloud is not supported. It renders client-side, serves no `confluence-*` meta tag, and its stream needs a session.

### diaspora*

Discovers the Atom feed of a diaspora* profile. Detected by the `Diaspora.Page` global.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{pod}/u/{user}` | Posts (Atom) |
| `{pod}/public/{user}` | Posts (Atom) |
| `{pod}/people/{guid}` | Posts (Atom)* |

\* *Requires HTML content to read the username from the profile's diaspora ID.*

### Instatus

Discovers the incident history feeds of an Instatus status page. Detected by the status page route Instatus names in the `x-matched-path` response header, or by the custom HTML slots of its page template, so custom domains are covered as well as `*.instatus.com` hosts.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| Any status page | Incident history (RSS + Atom) |
| `{page}/{language}/...` | Translated incident history (RSS + Atom) |

### Jira

Discovers the Atom activity streams of a Jira site. Cloud is detected by the `atlassian.net` host, Data Center by the `ajs-base-url` meta tag together with a Jira path.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{base}/browse/{KEY}-{n}` | Project stream<sup>†</sup> · site stream<sup>†</sup> (Atom) |
| `{base}/projects/{KEY}` | Project stream<sup>†</sup> · site stream<sup>†</sup> (Atom) |
| Any other Jira page | Site stream<sup>†</sup> (Atom) |

<sup>†</sup> *Found only by the Platform method.*

> [!NOTE]
> Bitbucket Server ships the same meta tag and uses `/projects/{KEY}/repos/`, which is excluded. Confluence under `/wiki/` on a Cloud site is excluded too.

### Neocities

Discovers the RSS feed of a Neocities site. The feed is served from `neocities.org`, not from the site's own host, and lists file updates rather than posts.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{user}.neocities.org` | Site updates<sup>†</sup> (RSS) |
| `neocities.org/site/{user}` | Site updates<sup>†</sup> (RSS) |

<sup>†</sup> *Found only by the Platform method.*

> [!NOTE]
> A site served on a custom domain carries no username, so it is not matched.

### OpenStatus

Discovers the incident feeds of an OpenStatus status page. Detected by the `/api/status/summary.json` link the page carries, or by its generated preview image.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| Any status page | Updates<sup>†</sup> (RSS + Atom) |

<sup>†</sup> *Found only by the Platform method.*

### Postype

Discovers RSS feeds for Postype channels. Channel pages carry no feed link.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `postype.com/@{id}` | Posts (RSS) |
| `{id}.postype.com` | Posts (RSS) |

### Sourcehut

Discovers the commit and ref feeds of a Sourcehut repository. Repository pages carry no feed link.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `git.sr.ht/~{user}/{repo}` | Commits · refs<sup>†</sup> (RSS) |

<sup>†</sup> *Found only by the Platform method.*

### Squarespace

Discovers the RSS feed of a Squarespace collection. Detected by the `Server: Squarespace` response header.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{site}/{collection}` | Collection (RSS) |

> [!NOTE]
> The collection slug is operator-chosen, commonly `blog`, `news` or `journal`, so it is taken from the first path segment. The site root is not matched: it answers `?format=rss` with a 400.

### Statuspage

Discovers the incident history feeds of an Atlassian Statuspage status page. Detected by the `x-statuspage-version` response header or the page's `dka575ofm4ao0.cloudfront.net/packs/` assets, so custom domains are covered as well as `*.statuspage.io` hosts.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| Any status page | Incident history (RSS + Atom) |

### Wikidot

Discovers the site and forum feeds of a Wikidot wiki. Detected by the `WIKIDOT.page.listeners.editClick()` call in the page, so custom domains are covered as well as `*.wikidot.com` hosts.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| Any wiki page | Site changes<sup>†</sup> · forum threads<sup>†</sup> (RSS) |

<sup>†</sup> *Found only by the Platform method.*

### Drupal

Discovers the site feed of a Drupal site. Detected by the `Generator` meta tag or the `X-Generator` response header.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| Any page | Site (RSS) |

> [!NOTE]
> Both signals are Drupal 8 and later, and a site builder can disable the `/rss.xml` view, so treat the feed as a probe.

### Shopify

Discovers the Atom feed of a Shopify store's blog. Detected by the `Powered-By` response header.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{store}/blogs/{handle}` | Blog (Atom) |

> [!NOTE]
> There is no store-wide feed, so the blog handle is required. A missing blog answers 404 with an Atom content type and an empty body.

### HubSpot

Discovers the RSS feeds of a HubSpot blog. Detected by the `HubSpot` generator meta tag or the `x-hs-hub-id` response header. A page the `x-hs-cfworker-meta` header marks as something other than a blog page is not matched.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{site}/{blog-path}` | Blog (RSS) |
| `{site}/{blog-path}/author/{slug}` | Author<sup>†</sup> · blog (RSS) |
| `{site}/{blog-path}/topic/{slug}` | Tag<sup>†</sup> · blog (RSS) |

<sup>†</sup> *Found only by the Platform method.*

> [!NOTE]
> The feed hangs off the blog path, never the host root, which answers 404.

### Publii

Discovers the feeds of a Publii-built site. Detected by the `Publii` generator meta tag or by media linked under `/media/website/` or `/media/posts/`. The media links also name the site root, so a site under a sub-path gets its own feeds.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| Any page | Posts (Atom) · JSON Feed |

> [!NOTE]
> `/feed.xml` is Atom despite the name, and the theme decides whether either file is linked.

### Wix

Discovers the blog feed of a Wix site. Detected by the `Wix.com` generator meta tag, `static.parastorage.com` assets or the `x-wix-request-id` response header.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{account}.wixsite.com/{site}/…` | Blog (RSS), under the site path |
| Any other page | Blog (RSS) |

> [!NOTE]
> The feed sits at the site root wherever the blog appears in navigation, and only sites with the Wix Blog app installed have it.

### Webnode

Discovers the article feeds of a Webnode site. Detected by the classic editor's client script, so custom domains are covered. Sites built in Webnode 2 serve no feeds and are not matched.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{site}/{page}/` | Section articles<sup>†</sup> · all articles (RSS) |
| `{site}/news/{article}/` | All articles (RSS) |
| Any other page | All articles (RSS) |

<sup>†</sup> *Found only by the Platform method.*

> [!NOTE]
> A section feed is named after the page that holds its articles, so a page without an articles block has none. A block whose name repeats another's is numbered, `blog1.xml`, and a page holding one gets the unnumbered feed.

### Joomla

Discovers the feed forms of a Joomla list view. Detected by the `Joomla!` generator meta tag or the `joomla-script-options` script every Joomla 3, 4 and 5 page ships.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| Any list view | View (RSS + Atom) |

> [!NOTE]
> Only list views produce a feed. A non-list view answers 404 as `application/xml` with an `<error>` root. The `?format=feed` form is used because it works with and without search-engine friendly URLs, while the `.feed` suffix answers 404 on a site without the `.html` suffix.

### WriteFreely

Discovers the feeds of a WriteFreely blog. Detected by the `WriteFreely` generator meta tag or the `/css/write.css` stylesheet.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{instance}/{blog}` | Blog · instance reader<sup>†</sup> (RSS) |
| `{instance}/{blog}/tag:{tag}` | Tag · blog · instance reader<sup>†</sup> (RSS) |
| `{instance}/{post}` on a single-user instance | Blog (RSS) |
| `{instance}/page/{n}` on a single-user instance | Blog (RSS) |
| `{instance}/lang:{code}` on a single-user instance | Blog (RSS) |
| `{instance}/archive` on a single-user instance | Blog (RSS) |
| `{instance}/tag:{tag}` on a single-user instance | Tag · blog (RSS) |

<sup>†</sup> *Found only by the Platform method.*

> [!NOTE]
> A single-user instance serves its blog at the root, so the blog path of a post is read from the link in the blog title rather than from the URL.

### Svbtle

Discovers the Atom feed of a Svbtle blog. Detected by the `Svbtle.com` generator meta tag or `lightning.svbtle.com/cargo/` assets.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| Any page on a blog host | Posts (Atom) |

> [!NOTE]
> `svbtle.com` itself is excluded: its `/feed` answers 200 with an HTML discovery page, and the `svbtle.com/{user}/feed` form does not exist.

### Textpattern

Discovers the feeds of a Textpattern site. Detected by the `Textpattern` generator meta tag.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| Any page | Posts (RSS + Atom) |

### Grav

Discovers the feed forms of a Grav listing page. Detected by the `GravCMS` generator meta tag, a `/user/themes/` or `/user/plugins/` asset path, or the `grav-site-{hash}` cookie.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{site}/` | Site root<sup>†</sup> (RSS + Atom) at `/.rss` and `/.atom` |
| Any listing page | Page (RSS + Atom) |

<sup>†</sup> *Found only by the Platform method.*

> [!NOTE]
> The generator value is matched in full, because the meta content is compared as a prefix and `Grav` alone also matches Gravity Forms.

### Mailchimp

Discovers the RSS feed of a Mailchimp campaign archive.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{dc}.campaign-archive.com/?u={u}&id={id}` | Archive (RSS) |

> [!NOTE]
> The datacentre prefix and both ids come from the input URL; none of them can be derived.

### Discuz!

Discovers the feeds of a Discuz! board. Detected by the `Discuz!` generator meta tag or the `{prefix}_saltkey` cookie.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{board}/forum-{fid}-1.html` | Board · site<sup>†</sup> (RSS) |
| `{board}/forumdisplay.php?fid={fid}` on Discuz! 7 and older | Board · site<sup>†</sup> (RSS) from `rss.php` |
| `{board}/archiver/?fid-{fid}.html` or `{board}/archiver/fid-{fid}.html` | Board<sup>†</sup> · site<sup>†</sup> (RSS), from `rss.php` on Discuz! 7 and older |
| Any other page | Site (RSS) |

<sup>†</sup> *Found only by the Platform method.*

> [!NOTE]
> Many installs gate the feed behind a login and answer with an HTML notice at status 200, so the body is what decides.

### XenForo

Discovers the feeds of a XenForo board. Detected by the `XF` or `XenForo` id on the html element.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{board}/f/{slug}.{id}` or `{board}/forums/{slug}.{id}` | Forum · board (RSS) |
| Any other page | Board (RSS)* |

\* *The board feed sits under the forum route prefix, `/forums/-/index.rss` by default and `/f/-/index.rss` where the board renames it. A page outside a forum carries no prefix, so both are emitted.*

> [!NOTE]
> A missing forum answers with an XML error document rather than HTML, so a check for well-formed XML passes on a 404.

### FC2 Blog

Discovers the RSS feeds of an FC2 blog.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{user}.blog.fc2.com` | Posts · comments · trackbacks (RSS) |
| `{user}.blog{n}.fc2.com` | Posts · comments · trackbacks (RSS) |
| `{user}.fc2.net` | Posts · comments · trackbacks (RSS) |
| `{user}.blog.2nt.com` | Posts · comments<sup>†</sup> · trackbacks<sup>†</sup> (RSS) |

<sup>†</sup> *Found only by the Platform method.*

> [!NOTE]
> The canonical host redirects to a numbered host from the old sharding scheme, so both shapes are matched and the feed is built from whichever host answers.

### Togetter

Discovers the feeds of a Togetter curator or the site-wide popular feed.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `togetter.com/id/{user}` | Curator<sup>†</sup> · popular<sup>†</sup> (RSS) |
| Any other page | Popular (RSS) |

<sup>†</sup> *Found only by the Platform method.*

### Syosetu

Discovers the Atom feeds of a Syosetu author.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `mypage.syosetu.com/{writerId}` | Author novels<sup>†</sup> · activity (Atom) |

<sup>†</sup> *Found only by the Platform method.*

> [!NOTE]
> There is no per-work feed, and a novel URL carries an ncode rather than the numeric writer id, so only an author page resolves.

### Cnblogs

Discovers the feed of a Cnblogs blog.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `cnblogs.com/{user}` | Posts |

> [!NOTE]
> The response says RSS while the document is Atom, and the body opens with a byte order mark before the XML declaration.

### Homeland

Discovers the feeds of a Homeland forum. Detected by the `Homeland` generator meta tag or the `_homeland_session` cookie.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{site}/topics/node{id}` | Node<sup>†</sup> · topics (RSS) |
| Any other page | Topics (RSS) |

<sup>†</sup> *Found only by the Platform method.*

### LearnKu

Discovers the feeds of a LearnKu community.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `learnku.com/{community}` | Community<sup>†</sup> · site (RSS) |
| Any other page | Site (RSS) |

<sup>†</sup> *Found only by the Platform method.*

### Habr

Discovers the feeds of a Habr hub, user or company, plus the site articles feed.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `habr.com/{lang}/hubs/{hub}` | Hub · articles (RSS) |
| `habr.com/{lang}/users/{user}` | User · articles (RSS) |
| `habr.com/{lang}/companies/{company}` | Company · articles (RSS) |
| Any other page | Articles (RSS) |

> [!NOTE]
> The language segment is taken from the page URL and every one of these paths needs its trailing slash.

### phpBB

Discovers the feeds of a phpBB board. Detected by the `phpbb` body id or the `{name}_u`, `{name}_k` and `{name}_sid` cookies.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{board}/viewtopic.php?t={id}` | Topic · forum<sup>?</sup>, plus the board feeds (Atom) |
| `{board}/viewtopic.php?p={id}` | Topic from the page's canonical link, plus the board feeds (Atom) |
| `{board}/viewforum.php?f={id}` | Forum<sup>?</sup>, plus the board feeds (Atom) |
| Any other page | Board: all posts · news<sup>†</sup> · new topics · active topics<sup>?</sup> · forums (Atom) |

<sup>†</sup> *Found only by the Platform method.*

<sup>?</sup> *Not measured, the feed failed to load during the run.*

> [!NOTE]
> A board is routinely mounted under a sub-path, so the feed is built from the directory holding the script. Each feed is an administrator toggle, so a board serves any subset of them.

### NodeBB

Discovers the feeds of a NodeBB forum. Detected by the `X-Powered-By` response header.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{forum}/category/{cid}` | Category, plus the site feeds (RSS) |
| `{forum}/topic/{tid}` | Topic, plus the site feeds (RSS) |
| Any other page | Recent<sup>†</sup> · popular<sup>†</sup> (RSS) |

<sup>†</sup> *Found only by the Platform method.*

### FluxBB

Discovers the feeds of a FluxBB board. Detected by the `brdheader` and `brdmain` ids together, or the `brdmenu` and `brdfooter` ids together, which the board prints whatever its template.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{board}/viewforum.php?id={id}` | Forum (Atom) · posts<sup>†</sup> (RSS + Atom) |
| `{board}/viewtopic.php?id={id}` | Topic (Atom) · posts<sup>†</sup> (RSS + Atom) |
| Any other page | Posts (RSS<sup>†</sup> + Atom) |

<sup>†</sup> *Found only by the Platform method.*

### MyBB

Discovers the feeds of a MyBB board. Detected by the `mybb[lastvisit]` cookie, under any cookie prefix, or the `cookiePrefix` and `cookieDomain` script variables core prints in every page head.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{board}/forumdisplay.php?fid={id}` or `{board}/forum-{id}.html` | Forum · latest threads (RSS + Atom) |
| `{board}/showthread.php?tid={id}` or `{board}/thread-{id}.html` | Forum<sup>†</sup> from the breadcrumb · latest threads (RSS + Atom) |
| Any other page | Latest threads (RSS + Atom) |

<sup>†</sup> *Found only by the Platform method.*

> [!NOTE]
> A board is routinely mounted under a sub-path, so the feed is built from the board URL the page prints as `rootpath`, or from the page's directory on a board older than 1.8.

### SMF

Discovers the feeds of a Simple Machines Forum. Detected by the `smf_scripturl` and `smf_theme_url` script variables core prints in every page head.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{script}?board={id}` | Board · recent posts (RSS + Atom<sup>†</sup>) |
| `{script}?topic={id}` | Board from the `rel="index"` link · recent posts (RSS + Atom<sup>†</sup>) |
| Any other page | Recent posts (RSS + Atom) |

<sup>†</sup> *Found only by the Platform method.*

> [!NOTE]
> A forum is routinely mounted under a sub-path, so the feed is built from the script URL the page prints as `smf_scripturl`. A forum can disable feeds, and then the feed URLs answer with an HTML page.

### Mobilizon

Discovers the feeds of a Mobilizon instance or group. Detected by the noscript notice, which is the only text the server renders on every page.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{instance}/@{group}` | Group · instance<sup>†</sup> (Atom) |
| Any other page | Instance (Atom) |

<sup>†</sup> *Found only by the Platform method.*

### Hubzilla

Discovers the Atom feed of a Hubzilla channel. Detected by the `hubzilla` generator meta tag or the `var zid` script core prints in every page head.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{hub}/channel/{name}`, `{hub}/profile/{name}` or `{hub}/@{name}` | Channel (Atom) |

> [!NOTE]
> There is no site-wide feed, so a page outside a channel is not matched.

### snac

Discovers the RSS feed of a snac user. Detected by the `snac/` generator meta tag or the `x-creator: snac/…` response header.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{instance}/{user}`, `{instance}/{user}/p/{id}` or `{instance}/{user}/h/{month}.html` | Posts (RSS) |

> [!NOTE]
> An instance is routinely mounted under a sub-path, so the feed is built from the page path and never from the origin.

### Shaarli

Discovers the feeds of a Shaarli instance. Detected by the `shaarli-menu` id or the `shaarli` cookie. An instance under a sub-path gets its feeds there, read from `js_base_path` or from the page directory.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| Any page | Posts (RSS + Atom), plus the pre-0.12 shape |

### PeerTube

Discovers the feeds of a PeerTube instance, channel or account. Detected by the `X-Powered-By` response header.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{instance}/c/{channel}` | Channel · instance |
| `{instance}/a/{account}` | Account<sup>†</sup> · instance |
| Any other page | Instance |

<sup>†</sup> *Found only by the Platform method.*

> [!NOTE]
> A channel federated from another instance is addressed as `handle@remote.host`, and the bare handle answers 404.

### Funkwhale

Discovers the RSS feed of a Funkwhale channel. Detected by the `Funkwhale` generator meta tag or the `fake-app` element of its app shell.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{instance}/channels/{handle}` | Channel (RSS) |
| `{instance}/channels/{handle}@{domain}` | Channel (RSS) on the channel's own instance |

> [!NOTE]
> The v1 API path is emitted rather than v2, which one instance advertises in its own link tag while another answers 404 for it. An unknown channel answers 404 carrying an RSS content type and an `<rss>` root.

### Art19

Discovers the RSS feed of an Art19 show.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `art19.com/shows/{slug}` | Show (RSS) |

> [!NOTE]
> The feed is derived from the URL in hand, never from where it redirects: a show can redirect to a site that mentions no feed while the derived feed still resolves.

### Omny Studio

Discovers the RSS feed of an Omny Studio show.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `omny.fm/shows/{slug}` | Show (RSS) |

> [!NOTE]
> A show whose page answers 404 can still resolve through this shortcut, which redirects to an identifier path on the content host.

### Blubrry PowerPress

Discovers the podcast feed of a WordPress site running the PowerPress plugin. Detected by the player function the plugin writes into the page.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| Any page | Podcast (RSS) |

> [!NOTE]
> Generic discovery finds `{site}/feed/`, which is the blog feed. This adds the podcast feed. A site can redirect it to its podcast host, which resolves normally.

### Podlove Publisher

Discovers the podcast feeds of a WordPress site running the Podlove Publisher plugin. Detected by the plugin's asset path, and the feeds are read from the alternate links the plugin prints on every page, since the owner sets each feed's slug.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| Any page | Podcasts (RSS), one per feed the site marks discoverable |

### Podomatic

Discovers the RSS feed of a Podomatic show.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{show}.podomatic.com` | Show (RSS) |
| `podomatic.com/podcasts/{show}` | Show (RSS) |

### iVoox

Discovers the RSS feed of an iVoox podcast.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `ivoox.com/{slug}_sq_f{id}_1.html` | Podcast<sup>†</sup> (RSS) |
| `ivoox.com/{slug}_rf_{episode}_1.html` | Podcast<sup>†</sup> (RSS), read from the episode page's series link |

<sup>†</sup> *Found only by the Platform method.*

### Atypon

Discovers the table of contents feed of a journal hosted on Atypon Literatum: ACM, ASCE, Health Affairs, INFORMS, Mary Ann Liebert, NEJM, Sage, Science, SIAM, Taylor & Francis, University of Chicago Press and Wiley.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{host}/toc/{code}/…` | Journal (RDF) |
| `{host}/journal/{code}` | Journal (RDF) |
| `{host}/loi/{code}` | Journal (RDF) |
| `tandfonline.com/journals/{code}` | Journal (RDF) |
| `journals.sagepub.com/home/{code}` | Journal (RDF) |
| `onlinelibrary.wiley.com/journal/{code}` | Journal (RSS) · Most cited (RSS) |

> [!NOTE]
> Journal pages answer a server-side fetch with a Cloudflare challenge, so the feed is derived from the URL alone. Article pages under `/doi/` name no journal and are not matched.

### SoundOn

Discovers the RSS feed of a SoundOn podcast. The player page is a script-only shell with no feed link.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `player.soundon.fm/p/{id}` | Podcast<sup>†</sup> (RSS) |
| `player.soundon.fm/p/{id}/episodes/{episodeId}` | Podcast<sup>†</sup> (RSS) |
| `player.soundon.fm/embed?podcast={id}` | Podcast<sup>†</sup> (RSS) |

<sup>†</sup> *Found only by the Platform method.*

### crates.io

Discovers the RSS feeds of crates.io, built from the URL, since the page answers 404 to a request without `Accept: text/html`.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `crates.io` | New crates<sup>†</sup> · recent updates<sup>†</sup> (RSS) |
| `crates.io/crates/{name}` | Crate releases<sup>†</sup> (RSS) |

<sup>†</sup> *Found only by the Platform method.*

> [!NOTE]
> The feed path takes the crate name exactly as crates.io spells it, so a page URL with another case or `-` in place of `_` leads to a feed that answers 403.

### Packagist

Discovers the RSS and Atom feeds of Packagist packages, vendors and the site.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `packagist.org/packages/{vendor}/{package}` | Package releases (RSS + Atom<sup>†</sup>) |
| `packagist.org/packages/{vendor}` | Vendor releases (RSS + Atom<sup>†</sup>) |
| `packagist.org/extensions` | New extensions (RSS + Atom<sup>†</sup>) · extension releases (RSS + Atom<sup>†</sup>) |
| `packagist.org/*` | New packages (RSS + Atom<sup>†</sup>) · new releases (RSS + Atom<sup>†</sup>) |

<sup>†</sup> *Found only by the Platform method.*

### Plurk

Discovers Atom feeds for Plurk users and single plurks.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `plurk.com/{username}` | User plurks (Atom) |
| `plurk.com/u/{username}` | User plurks (Atom) |
| `plurk.com/m/{username}` | User plurks<sup>†</sup> (Atom) |
| `plurk.com/p/{id}` | Plurk responses (Atom) |
| `plurk.com/m/p/{id}` | Plurk responses<sup>†</sup> (Atom) |

<sup>†</sup> *Found only by the Platform method.*

### Internet Archive

Discovers the RSS feeds of Internet Archive collections and searches. A collection page is told from an item page by its markup: collections serve the app shell that loads `/offshoot_assets/`, and items serve full HTML. Item pages resolve nothing.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `archive.org/details/{collection}` | Collection<sup>†</sup> (RSS) |
| `archive.org/search?query={query}` | Search<sup>†</sup> (RSS) |

<sup>†</sup> *Found only by the Platform method.*

### Sveriges Radio

Discovers the feed of a Sveriges Radio program.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `sverigesradio.se/{program}` | Program (RSS) |
| `sverigesradio.se/...?programid={id}` | Program<sup>†</sup> (Atom) |

<sup>†</sup> *Found only by the Platform method.*

> [!NOTE]
> Program pages answer 403 to many server-side fetches, so the feed is derived from the URL alone. A discontinued program's feed answers 404.

### DokuWiki

Discovers the recent changes feeds of a DokuWiki wiki. Detected by the `DokuWiki` session cookie. A wiki under a sub-path gets its feeds there, read from the `start` link the page prints or from the cookie path.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| A page inside a namespace | Namespace recent changes<sup>†</sup> · namespace pages · recent changes |
| Any other page | Recent changes |

<sup>†</sup> *Found only by the Platform method.*

> [!NOTE]
> The feed format is a wiki setting, so one wiki serves RSS 1.0 and the next Atom from the same `feed.php`.

### MediaWiki

Discovers the page history and recent changes feeds of a MediaWiki wiki. Detected by the `EditURI` link to `api.php?action=rsd` that core prints in every page head, which also gives the script path, so a wiki under `/w/` gets its feeds there. The page title is read from the `wgPageName` config core prints, whatever the URL rewriting.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| Any page with a title | Page history<sup>†</sup> · recent changes |
| A special page | Recent changes |

<sup>†</sup> *Found only by the Platform method.*

### Gancio

Discovers the RSS feeds of a Gancio event calendar. Detected by the `custom_css` stylesheet its layout prints in every page head, which also gives the install root, so a calendar under a sub-path gets its feeds there.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{instance}/tag/{tag}` | Tag (RSS) |
| `{instance}/place/{id}/{name}` | Place (RSS) |
| `{instance}/collection/{name}` | Collection (RSS) |
| Any other page | Site (RSS) |

> [!NOTE]
> The iCal feeds Gancio serves beside each RSS feed are not emitted, since they are not RSS, Atom or JSON feeds. Gancio 2 answers 404 on the tag and place feed paths its own pages advertise.

### Niconico

Discovers the video, live and blog feeds of a Niconico channel on `ch.nicovideo.jp`.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `ch.nicovideo.jp/{channel}` | Videos · Live<sup>†</sup> · Blog<sup>†</sup> |
| `ch.nicovideo.jp/{channel}/video` | Videos first, then Live<sup>†</sup> · Blog<sup>†</sup> |
| `ch.nicovideo.jp/{channel}/live` | Live first, then Videos<sup>†</sup> · Blog<sup>†</sup> |
| `ch.nicovideo.jp/{channel}/blomaga` or `ch.nicovideo.jp/{channel}/blomaga/ar{id}` | Blog first, then Videos<sup>†</sup> · Live<sup>†</sup> |

<sup>†</sup> *Found only by the Platform method.*

### LibriVox

Discovers the RSS feed of a LibriVox audiobook, read from the feed link on the audiobook page.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `librivox.org/{slug}` | Audiobook (RSS) |

### PyPI

Discovers the RSS feeds of the Python Package Index, built from the URL.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `pypi.org` | New packages · recent updates (RSS) |
| `pypi.org/project/{name}` | Project releases (RSS) |
| `pypi.org/project/{name}/{version}` | Project releases (RSS) |

### RedCircle

Discovers the RSS feed of a RedCircle show. A show under a slug is read from the show uuid its page names in `og:url`.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `redcircle.com/shows/{uuid}` or `redcircle.com/shows/{slug}` | Show (RSS) |
| `redcircle.com/shows/{uuid}/ep/{episode}` or `redcircle.com/shows/{slug}/ep/{episode}` | Show (RSS) |

### Royal Road

Discovers the update feed of a Royal Road fiction.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `royalroad.com/fiction/{id}` or `royalroad.com/fiction/{id}/{slug}` | Fiction updates (RSS) |
| `royalroad.com/fiction/{id}/{slug}/chapter/{chapterId}/{chapterSlug}` | Fiction updates (RSS) |

> [!NOTE]
> Profile pages and fiction lists serve no feed, so only fiction and chapter pages resolve.

### Flipboard

Discovers the RSS feeds of Flipboard profiles, magazines, storyboards and topics.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `flipboard.com/@{username}` | Profile |
| `flipboard.com/@{username}/{magazine}` | Magazine or storyboard |
| `flipboard.com/topic/{topic}` | Topic |

### Webtoons

Discovers the episode feed of a WEBTOON series, Originals and Canvas alike.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `webtoons.com/{language}/{genre}/{name}/list?title_no={id}` | Series |
| `webtoons.com/{language}/{genre}/{name}/{episode}/viewer?title_no={id}` | Series<sup>†</sup> |
| `webtoons.com/{language}/canvas/{name}/list?title_no={id}` | Series |

<sup>†</sup> *Found only by the Platform method.*

### Lichess

Discovers Atom feeds for Lichess user blogs, the official blog and the community blogs.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `lichess.org/@/{user}/blog` or `lichess.org/@/{user}/blog/{slug}/{id}` | User blog |
| `lichess.org/blog` or `lichess.org/blog/{id}/{slug}` | Official Lichess blog |
| `lichess.org/blog/community` or `lichess.org/{lang}/blog/community` | Community blogs, in that language when the URL names one |
| Any other page | Site-wide updates |

### @wiki

Discovers the updated pages and new pages feeds of an @wiki (atwiki.jp) wiki. Links to the legacy `www{N}.atwiki.jp` hosts redirect to `w.atwiki.jp`.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `w.atwiki.jp/{wiki}/…` | Updated pages (RDF + Atom) · new pages (RDF) |

### Teletype.in

Discovers RSS and Atom feeds for Teletype.in blogs.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `teletype.in/@{user}` | Posts (RSS + Atom) |
| `teletype.in/@{user}/{post}` | Posts (RSS + Atom) |

### PmWiki

Discovers the recent changes feeds of a PmWiki wiki. Detected by the `<!--HTMLHeader-->` comment every skin prints, so any domain is covered. A wiki under a sub-path gets its feeds there.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{wiki}/{Group}/{Page}` | Group recent changes<sup>†</sup> · site recent changes (RSS + Atom<sup>†</sup>) |
| `{wiki}?n={Group}.{Page}` | Group recent changes<sup>†</sup> · site recent changes (RSS + Atom<sup>†</sup>) |
| Any other page | Site recent changes<sup>†</sup> (RSS + Atom) |

<sup>†</sup> *Found only by the Platform method.*

> [!NOTE]
> Feeds are off in a default PmWiki install and a wiki owner turns them on, so many wikis answer these URLs with the page itself.

### Ning

Discovers the site feeds of a Ning network and the feed of a forum topic. Detected by the `static.ning.com/socialnetworkmain/` asset path, so `ning.com` subdomains and custom domains are both covered. Ning 3 networks load their assets from another path and serve none of these feeds, so they are left to generic discovery.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{network}/forum/topics/{topic}` | Topic · latest activity<sup>†</sup> · blog posts<sup>†</sup> · forum |
| Any other page | Latest activity<sup>†</sup> · blog posts<sup>†</sup> · forum<sup>†</sup> |

<sup>†</sup> *Found only by the Platform method.*

### vBulletin

Discovers the feeds of a vBulletin 3 to 6 forum. Detected by the `clientscript/vbulletin-core.js` script of vBulletin 4, the `js/header-rollup` script of vBulletin 5 and 6, or the `{prefix}lastvisit` and `{prefix}lastactivity` cookies.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{forum}/forumdisplay.php?f={id}` | Forum · site (RSS) |
| `{forum}/forumdisplay.php?{id}-{title}` | Forum · site (RSS) |
| Any other page | Site (RSS) |
| Any vBulletin 5 or 6 channel page | Channel · site (RSS) |
| Any vBulletin 5 or 6 page | Site at `{forum}/external?type=rss2` (RSS) |

> [!NOTE]
> The forum root is read from the core script's URL, or the page's `<base>` on vBulletin 5 and 6, so a forum under a sub-path or behind rewritten page URLs gets its feeds there. A vBulletin 3 or 4 forum with feeds turned off answers these URLs with an empty page.

### Omeka

Discovers the item feeds of an Omeka Classic site, self-hosted or on `omeka.net`. Detected by the plugin and core script asset paths every page loads, so any domain is covered. A site under a sub-path gets its feeds there.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{site}/items/browse?{filters}` | Filtered items for the same tags, collection or search (RSS + Atom) |
| Any other page | Items (RSS + Atom) |

### Koha

Discovers the feeds of a Koha library catalogue. Detected by the `/opac-tmpl/` asset path every OPAC theme loads, so any domain is covered.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{catalogue}/cgi-bin/koha/opac-search.pl?q={query}` | Search results, newest acquisitions first (RSS) |
| `{catalogue}/cgi-bin/koha/opac-shelves.pl?op=view&shelfnumber={id}` | List<sup>†</sup> (RSS) |
| `{catalogue}/cgi-bin/koha/opac-showreviews.pl` | Recent comments (RSS) |

<sup>†</sup> *Found only by the Platform method.*

### public-inbox

Discovers the Atom feeds of a public-inbox mailing list archive. Detected by the help and color links every page prints, so any domain is covered, and `lore.kernel.org` by its host, since its pages answer a plain fetch with a bot challenge. An inbox under a sub-path or at the root of its host gets its feeds there.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{inbox}/` | Messages (Atom) |
| `{inbox}/{message-id}/` | Thread · messages (Atom) |
| `{inbox}/{message-id}/T/` | Thread · messages (Atom) |

### CivicPlus

Discovers the module feeds of a CivicPlus government website. Detected by the `CP_IsMobile` cookie or the `/Areas/Layout/Assets/` scripts, so any domain is covered. The module is read from the page's `pageModuleID` field, and a page with no module feed gets the site-wide Pages feed.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{site}/CivicAlerts.aspx`, `{site}/m/newsflash` | News Flash<sup>†</sup> (RSS) |
| `{site}/Blog.aspx` | Blog<sup>†</sup> (RSS) |
| `{site}/Gallery.aspx` | Photo Gallery<sup>†</sup> (RSS) |
| `{site}/Calendar.aspx`, `{site}/m/calendar` | Calendar<sup>†</sup> (RSS) |
| `{site}/AlertCenter.aspx` | Alert Center<sup>†</sup> (RSS) |
| `{site}/RealEstate.aspx` | Real Estate Locator<sup>†</sup> (RSS) |
| `{site}/AgendaCenter` | Agenda Center<sup>†</sup> (RSS) |
| `{site}/Jobs.aspx` | Jobs<sup>†</sup> (RSS) |
| `{site}/CivicMedia.aspx` | Media Center<sup>†</sup> (RSS) |
| `{site}/`, any other page | Pages<sup>†</sup> (RSS) |

<sup>†</sup> *Found only by the Platform method.*

> [!NOTE]
> Each feed covers every category of its module. The home page, content pages and modules with no feed of their own get the Pages feed.

### DSpace

Discovers the feeds of a DSpace repository, on any domain. DSpace 7 and later is detected by the `ds-app` element of its Angular app, and its OpenSearch feeds are built on the REST API the page's config names, which can sit on another host. DSpace 6 and older is detected by the `dspace-theme.css` stylesheet of the JSPUI, the `X-Cocoon-Version` header of the XMLUI or the `DSpace` generator meta of older JSPUI releases, each beside a feed link in the DSpace shape, and its feeds are the ones the page links.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{repository}/collections/{uuid}` | Collection<sup>†</sup> · site<sup>†</sup> (RSS + Atom) |
| `{repository}/communities/{uuid}` | Community · site<sup>†</sup> (RSS + Atom) |
| Any other page, DSpace 7 and later | Site<sup>†</sup> (RSS + Atom) |
| `{repository}/handle/{prefix}/{id}`, DSpace 6 and older | Collection or community (RSS 1.0, RSS 2.0 + Atom, as linked) |
| `{repository}/`, DSpace 6 and older | Site (RSS 1.0, RSS 2.0 + Atom, as linked) |

<sup>†</sup> *Found only by the Platform method.*

> [!NOTE]
> The search endpoint ignores a scope it does not know and answers with the site feed, so only an id the page URL names is used.

### SPIP

Discovers the feeds of a SPIP site. Detected by the `Composed-By` or `X-Spip-Cache` header SPIP sends with every page, so any domain is covered. A site under a sub-path gets its feeds there.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{site}/spip.php?article{id}`, `article{id}.html` | Article comments<sup>†</sup> · latest articles |
| `{site}/spip.php?rubrique{id}`, `rubrique{id}.html` | Section · latest articles |
| `{site}/spip.php?mot{id}`, `mot{id}.html` | Keyword<sup>†</sup> · latest articles |
| `{site}/spip.php?auteur{id}`, `auteur{id}.html` | Author · latest articles |
| Any other page | Latest articles |

<sup>†</sup> *Found only by the Platform method.*

> [!NOTE]
> Comment feeds come from the comments plugin, so a site without it answers them with an error. Each page is also recognised in its `spip.php?page=article&id_article={id}` form. Rewritten URLs such as `/Some-Title` name no id, and those pages get the latest articles feed alone.

### Odoo

Discovers the Atom feed of a blog on an Odoo website. Detected by the `frontend_lang` and `session_id` cookies Odoo sets on every website page, so any domain is covered. A page under a language prefix gets the feed in that language.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{site}/blog/{blog}-{id}` | Blog (Atom) |
| `{site}/blog/{blog}-{id}/{post}-{id}` | Blog (Atom) |
| `{site}/blog/{blog}-{id}/post/{post}-{id}` | Blog (Atom) |
| `{site}/blog/{blog}-{id}/tag/{tag}-{id}` | Blog (Atom) |

### Zenfolio

Discovers the gallery and blog feeds of a Zenfolio photography site. A custom domain is detected by `cdn.zenfolio.com/zf/` stylesheets or the `zf_5y_visitor` cookie.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{user}.zenfolio.com/…` | Recent galleries · featured galleries · blog (RSS + Atom) |
| Any other page | Recent galleries · featured galleries · blog (RSS + Atom) |

> [!NOTE]
> The featured and blog feeds answer with no items on a site that has no featured galleries or blog posts.

### BubbleLife

Discovers the RSS feed of a BubbleLife community. The page's alternate link has no `href`, so the feed id is read from the community's library links.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{city}.bubblelife.com/community/{name}` | Posts<sup>†</sup> (RSS) |
| `{city}.bubblelife.com/community/{name}/library/{id}` | Library<sup>†</sup> (RSS) |
| `{city}.bubblelife.com/community/{name}/type/rssinfo` | Posts<sup>†</sup> (RSS) |

<sup>†</sup> *Found only by the Platform method.*

> [!NOTE]
> A city news community links no library of its own, so its page yields no feed. Its rssinfo page names the feed.

### BigCommerce

Discovers the product and blog feeds of a BigCommerce store. Detected by the `SHOP_SESSION_TOKEN` cookie, so any domain is covered. Interspire Shopping Cart installs set the same cookie and serve the same feeds.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| Category page | Category new products · category popular products · new products · popular products · featured products<sup>†</sup> · blog (RSS + Atom) |
| `{store}/search.php?search_query={query}` | Product search · new products · popular products · featured products<sup>†</sup> · blog (RSS + Atom) |
| Any other page | New products · popular products · featured products<sup>†</sup> · blog (RSS + Atom) |

<sup>†</sup> *Found only by the Platform method.*

> [!NOTE]
> A category URL carries only its slug, so the category id is read from the feed link the category page prints.

### Cocolog

Discovers the posts feeds of a Cocolog blog on `cocolog-nifty.com` and its sibling domains. One account can host several blogs, each under its own path. The home page names its blog only in its feed links, so a home page URL needs the page content.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{user}.cocolog-nifty.com/{blog}/…` | Posts (Atom + RDF + RSS) |
| `{user}.cocolog-nifty.com` | Posts of the blog the page links (Atom + RDF + RSS) |

### blog.hu

Discovers the feeds of blog.hu blogs, and the activity feed of a blog.hu user.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.blog.hu` | Posts (RSS + Atom) · comments (RSS + Atom) |
| `blog.hu/user/{id}` | User activity<sup>†</sup> (RSS) |

<sup>†</sup> *Found only by the Platform method.*

### ChamberMaster

Discovers the RSS feeds of a ChamberMaster (GrowthZone) chamber of commerce directory. Detected by the `x-source: cmdotnet…` response header, so any domain is covered. The pages link none of these feeds. On a `chambermaster.com` or `memberzone.com` subdomain the feeds are spelled with `http`, since over `https` they redirect to the sign-in page.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{site}/events/…` | Upcoming events<sup>†</sup> · new events<sup>†</sup> · featured events<sup>†</sup> |
| `{site}/list/…` | New members<sup>†</sup> · featured members<sup>†</sup> |
| `{site}/jobs/…` | New jobs<sup>†</sup> |
| `{site}/hotdeals/…` | New coupons<sup>†</sup> |
| `{site}/marketspace/…`, `{site}/marketplace/…` | New marketplace items<sup>†</sup> |
| `{site}/news/…` | News releases<sup>†</sup> |
| `{site}/MemberToMember/…` | New member to member deals<sup>†</sup> |

<sup>†</sup> *Found only by the Platform method.*

### PChome Online 個人新聞台

Discovers RSS feeds for papers on PChome's blog host, including category feeds. Pages on the mobile host `mypaper.m.pchome.com.tw` get the same feeds.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `mypaper.pchome.com.tw/{user}` | Posts |
| `mypaper.pchome.com.tw/{user}/category/{id}` | Category<sup>†</sup> · posts |

<sup>†</sup> *Found only by the Platform method.*

### PukiWiki

Discovers the recent changes feed of a PukiWiki wiki or a Quick Homepage Maker site. Detected by the default `pukiwiki.css` stylesheet, or by Quick Homepage Maker's `QHMSSID` session cookie, so any domain is covered. A wiki under a sub-path or on rewritten page URLs gets its feed at its own root.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{wiki}/index.php?{Page}` | Recent changes (RSS) |
| `{wiki}/?{Page}` | Recent changes (RSS) |
| `{wiki}/{Page}` | Recent changes (RSS) |

### Gnuboard

Discovers the RSS feed of a Gnuboard 4 or 5 board. Detected by the visit cookie Gnuboard sets under the md5 of `ck_visit_ip`, so any domain is covered. A board under a sub-path gets its feed there.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{site}/bbs/board.php?bo_table={board}` | Board<sup>†</sup> |
| `{site}/bbs/board.php?bo_table={board}&wr_id={post}` | Board |
| `{site}/{board}` or `{site}/{board}/{post}` on Gnuboard 5 | Board, read from the page's `g5_bo_table` variable |

<sup>†</sup> *Found only by the Platform method.*

> [!NOTE]
> A board owner can turn its feed off, and Gnuboard then answers the feed URL with an HTML page, so discovery finds nothing there.

### ProBoards

Discovers the posts feed of a ProBoards forum. A forum on a custom domain is detected by the `proboards.combined` script ProBoards serves from its own storage hosts.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.proboards.com` | Posts (RSS) |
| `*.freeforums.net` | Posts (RSS) |
| `*.boards.net` | Posts (RSS) |
| Any page on a custom domain | Posts (RSS) |

> [!NOTE]
> On a ProBoards domain, a request with a browser user agent gets a proof-of-work challenge instead of the page, so the feed is built from the forum host alone. The feed answers 406 to a bare `Mozilla/5.0` or an empty user agent.

### The Mail Archive

Discovers the RSS feed of a mailing list archived on The Mail Archive (mail-archive.com). The list is named by its posting address in the first path segment.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `mail-archive.com/{list}/` | Mailing list |
| `mail-archive.com/{list}/msg{n}.html` | Mailing list<sup>†</sup> |

<sup>†</sup> *Found only by the Platform method.*

### Bloggang

Discovers RSS feeds for Bloggang blogs. A blog lives on its own subdomain, which redirects to its pages on `www.bloggang.com`.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{user}.bloggang.com` | Posts |
| `www.bloggang.com/mainblog.php?id={user}` | Posts |
| `www.bloggang.com/viewblog.php?id={user}` | Posts |
| `www.bloggang.com/viewdiary.php?id={user}` | Posts |

### SME Blog

Discovers the RSS feeds of blogs on SME Blog, the blog platform of the Slovak daily SME.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `blog.sme.sk/{user}` | Posts |
| `blog.sme.sk/{user}/{category}/{slug}` | Posts |
| `blog.sme.sk` | Site |
| `blog.sme.sk/t/{topic}` | Site |

### Acomics

Discovers RSS feeds for Acomics comics and users. A user's feed carries the new issues of the comics the user subscribes to.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `acomics.ru/~{comic}` | Comic issues |
| `acomics.ru/-{user}` | User subscriptions<sup>†</sup> |

<sup>†</sup> *Found only by the Platform method.*

### OpenCart Journal

Discovers the blog feed of an OpenCart store running the Journal theme. Detected by the `data-jv` or `data-j2v` version attribute Journal prints on the `<html>` element, so any domain is covered. A store under a sub-path gets its feed there, read from the page's `<base href>`.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| Any page of a Journal 3 store | Blog<sup>†</sup> (RSS), `route=journal3/blog/feed`, or `journal3/blog.feed` on OpenCart 4 |
| Any page of a Journal 2 store | Blog (RSS), `route=journal2/blog/feed` |

<sup>†</sup> *Found only by the Platform method.*

### Eklablog

Discovers the posts and comments feeds of an Eklablog blog. A blog on a custom domain is detected by the script it loads from `connect.eklablog.com`. This also covers blogs on `*.fatalblog.com`, `*.shonenblog.com`, `*.kilariblog.com`, `*.blogy.fr` and `*.shojoblog.com`.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.blogg.org`, `*.blogueuse.fr`, `*.cd.st`, `*.doremiblog.com`, `*.ek.la`, `*.eklablog.com`, `*.eklablog.fr`, `*.eklablog.net`, `*.id.st`, `*.jeblog.fr`, `*.kazeo.com`, `*.kif.fr`, `*.lo.gs`, `*.revolublog.com`, `*.zic.fr` | Posts · comments<sup>†</sup> |
| Any page on a custom domain | Posts · comments<sup>†</sup> |

<sup>†</sup> *Found only by the Platform method.*

### ComicFury

Discovers the feeds of a ComicFury webcomic.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{comic}.thecomicseries.com`, `.thecomicstrip.org`, `.the-comic.org`, `.webcomic.ws` or `.cfw.me` | Comic |
| `comicfury.com/comicprofile.php?url={comic}` | Comic<sup>†</sup> |
| `comicfury.com/read/{comic}` | Comic feed in the ComicFury reader |

<sup>†</sup> *Found only by the Platform method.*

### Haley Marketing job boards

Discovers the jobs feed of a job board Haley Marketing hosts for a staffing firm. Detected by the `x-sasnode` response header naming a `haleymarketing.com` node together with a link to the board's `/index.smpl?arg=jb_` routes, so any domain is covered.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| Any board page | Jobs |

### Jimdo

Discovers the blog feed of a Jimdo site. Detected by the `x-jimdo-wid` response header, so `*.jimdofree.com` sites and custom domains are both covered.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| Any page | Blog (RSS) |

> [!NOTE]
> Only sites with a blog have the feed.

### YesWiki

Discovers the Bazar entry feeds and the recent changes feed of a YesWiki wiki. Detected by the `YesWiki-` session cookie. A wiki under a sub-path gets its feeds there, read from the cookie path. Form ids come only from the entries and lists the page shows.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| A page showing Bazar entries or lists | Entries of each form shown · all entries · recent changes |
| Any other page | All entries · recent changes |

### Forumotion

Discovers the feeds of a Forumotion forum, also branded Forumactif, Foroactivo, Forumeiros and Ahlamontada. Detected by the `_userdata` script every page prints, so custom domains are covered. The forum comes from the page's breadcrumb.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{forum}/f{id}-{slug}` | Forum<sup>†</sup> · latest topics (RSS + Atom<sup>†</sup>) |
| `{forum}/t{id}-{slug}` | The topic's forum<sup>†</sup> · latest topics (RSS + Atom<sup>†</sup>) |
| Any other page | Latest topics (RSS + Atom) |

<sup>†</sup> *Found only by the Platform method.*

### Noticeable

Discovers the feeds of a Noticeable newspage. Newspages on `noticeable.news` are matched by host, and a newspage on a custom domain by the `assets.noticeable.news/templates/` stylesheets every template loads.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{newspage}/labels/{label}` | Label<sup>†</sup> · newspage (RSS + Atom<sup>†</sup> + JSON Feed) |
| Any other page | Newspage (RSS + Atom<sup>†</sup> + JSON Feed) |

<sup>†</sup> *Found only by the Platform method.*

> [!NOTE]
> A label page links only the newspage feed, never its own label feed.

### Legistar

Discovers the history feed of a Legistar legislation record or meeting, on any `*.legistar.com` client site. A client site on a custom domain is detected by the `BIGipServerinsite.legistar.com_443` cookie Legistar's load balancer sets, or by the `addthis_widget.js#username=legistarinsite` script every page loads.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{client}.legistar.com/LegislationDetail.aspx?ID={id}&GUID={guid}` | Legislation (RSS) |
| `{client}.legistar.com/MeetingDetail.aspx?ID={id}&GUID={guid}` | Meeting (RSS) |
| `/LegislationDetail.aspx?ID={id}&GUID={guid}` on a custom domain | Legislation (RSS) |
| `/MeetingDetail.aspx?ID={id}&GUID={guid}` on a custom domain | Meeting (RSS) |

### Nethouse

Discovers the news and articles feeds of a Nethouse site. Custom domains are detected by the `x-generator: nethouse` response header.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.nethouse.ru`, `*.nethouse.me` | News · articles (RSS) |
| Any other Nethouse page | News · articles (RSS) |

> [!NOTE]
> A site with the news or articles section turned off answers that feed with 404.

### Hautetfort

Discovers RSS and Atom feeds for blogs on `*.hautetfort.com`, `*.blogspirit.com` and `*.blogspirit-business.com`. Blog feeds are built on `http`, since blog subdomains serve no certificate for their own name.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{blog}.{domain}` | Posts (RSS + Atom) |
| `{blog}.{domain}/{category}` | Category (RSS) · posts |
| `{blog}.{domain}/archives/category/{category}` | Category<sup>†</sup> (RSS) · posts<sup>?</sup> |

<sup>†</sup> *Found only by the Platform method.*

<sup>?</sup> *Not measured, the feed failed to load during the run.*

### uCoz

Discovers the module and forum feeds of a uCoz site. Covers sites on the uCoz domains, such as `*.ucoz.ru`, `*.at.ua` and `*.narod.ru`, and custom domains through the `{n}{site}uCoz` cookie every uCoz page sets.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{site}/{module}/…` | Module (RSS) for `news`, `publ`, `load`, `photo`, `blog`, `dir`, `board`, `stuff` and `forum` |
| `{site}/forum/{section}…` | Forum section · forum (RSS) |
| Any other page | News (RSS) |

> [!NOTE]
> A module the site has not turned on answers 404.

### dasauge

Discovers the RSS feed of a dasauge member profile on any of the dasauge country domains.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `dasauge.de/-{member}` | Profile |
| `dasauge.de/-{member}/{page}` | Profile |

### Estranky

Discovers the site feeds of an Estranky site. A site serves the article feeds, the Web Slice feeds or both, depending on its template, and validation drops a set it lacks. A custom domain is detected by stylesheets or scripts loaded from the `s3*.estranky.cz` and `s3*.estranky.sk` asset hosts, or from the `s3*.eoldal.hu` hosts of the Hungarian eOldal brand. On a custom domain, the slice feeds take the Estranky subdomain of the page's `rel="feedurl"` link. An eOldal site keeps its slice feeds on its own domain, since its `eoldal.hu` subdomain no longer resolves.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{site}.estranky.cz/…` | Posts · photos<sup>†</sup> · comments<sup>†</sup> · home page slice · photo album slice<sup>†</sup> |
| `{site}.estranky.sk/…` | Posts · photos<sup>†</sup> · comments<sup>†</sup> · home page slice<sup>?</sup> · photo album slice<sup>?</sup> |
| Any other page | Posts · photos<sup>†</sup> · comments<sup>†</sup> · home page slice · photo album slice<sup>†</sup> |

<sup>†</sup> *Found only by the Platform method.*

<sup>?</sup> *Not measured, the feed failed to load during the run.*

### Color Me Shop

Discovers the RSS 1.0 and Atom feeds of new products in a Color Me Shop store. Shops on `shop-pro.jp` are matched by host, and a shop on its own domain by the `colorme_PHPSESSID` cookie every shop page sets.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{shop}.shop-pro.jp` | Products (RSS 1.0 + Atom) |
| `{domain}`, a shop on its own domain | Products (RSS 1.0 + Atom) |

### PRLog

Discovers the press releases feed of a PRLog pressroom.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `pressroom.prlog.org/{id}` | Press releases |

### Rakuten Blog

Discovers the RSS feed of a Rakuten Blog (plaza.rakuten.co.jp) blog, which Rakuten serves from `api.plaza.rakuten.ne.jp`.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `plaza.rakuten.co.jp/{user}/…` | Posts |

### Overblog

Discovers the posts feed of an Overblog blog.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.over-blog.com`, `*.over-blog.de`, `*.over-blog.es`, `*.over-blog.fr`, `*.over-blog.it`, `*.over-blog.net`, `*.over-blog.org`, `*.over.blog`, `*.overblog.com`, `*.overblog.fr` | Posts |

### ExportersIndia

Discovers the products or services feed of an ExportersIndia business site, built by Weblink.In on the business's own domain. Detected by the template stylesheet on `catalog.wlimg.com` together with the page's link to `/products.rss` or `/services.rss`, so any domain is covered.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| Any page of a products site | Products (RSS) |
| Any page of a services site | Services (RSS) |

### Wild Apricot

Discovers the blog and events feeds of a Wild Apricot site. Detected by the `x-lb-server` response header, so `*.wildapricot.org` sites and custom domains are both covered.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{site}/{blog-page}` | Blog (RSS) |
| `{site}/{blog-page}/{post-id}` | Blog<sup>?</sup> (RSS), from the post's back link |
| `{site}/{events-page}` | Events (RSS), in the list and calendar views |

<sup>?</sup> *Not measured, the feed failed to load during the run.*

> [!NOTE]
> A post page links `/page-{id}/RSS` as its feed, which answers 404. An event page links no events page, so it gets no feed.

### Jellypod

Discovers RSS feeds for Jellypod-hosted podcasts.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.jellypod.com` | Podcast (RSS) |

### Goope

Discovers the news feed of a Goope site, and the member news feed of a chamber of commerce site. Sites on a custom domain are detected by the QR code image served from `r.goope.jp` or a favicon on `cdn.goope.jp`.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `r.goope.jp/{site}/…` | News (RDF) |
| `r.goope.jp/{site}/shokokai/member/…` | Member news · news (RDF) |
| `{domain}/shokokai/member/…` | Member news · news (RDF) |
| `{domain}/…` | News (RDF) |

> [!NOTE]
> A page under a `t_{id}` template segment gets its feeds under that segment, as the page links them.

### Duck Webcomics

Discovers the feed of a webcomic on The Duck Webcomics.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `theduckwebcomics.com/{comic}/…` | Comic |

### is-Programmer

Discovers RSS feeds for is-Programmer blogs, including the comment feed of a post.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{blog}.is-programmer.com` | Posts · comments · messages |
| `{blog}.is-programmer.com/posts/{id}` | Post comments<sup>†</sup> · posts · comments · messages |

<sup>†</sup> *Found only by the Platform method.*

> [!NOTE]
> is-Programmer serves its blogs over http only, so the feeds are http URLs whatever the page URL's scheme.

### twoday

Discovers RSS 1.0 feeds for blogs on `*.twoday.net`. A blog's skin links its posts feed as `/index.rdf` or `/rss`, and both serve the same feed.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{blog}.twoday.net` | Posts |
| `{blog}.twoday.net/topics/{topic}` | Topic · posts |

### cppblog

Discovers RSS feeds for cppblog blogs on `www.cppblog.com` and `cppblog.com`.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `cppblog.com/{user}` | Posts · comments<sup>†</sup> |
| `cppblog.com/{user}/category/{id}.html` | Category · posts · comments<sup>†</sup> |
| `cppblog.com/{user}/favorite/{id}.html` | Favorites · posts · comments<sup>†</sup> |

<sup>†</sup> *Found only by the Platform method.*

> [!NOTE]
> The site's https certificate has expired, so the feeds are `http://www.cppblog.com` URLs whatever the page URL's scheme and host.

### Reformal

Discovers the feedback feed of a Reformal project, on reformal.ru and its English farm idea.informer.com.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{project}.reformal.ru` | Feedback (RSS) |
| `{project}.idea.informer.com` | Feedback (RSS) |

### Bloggo

Discovers RSS feeds for Bloggo blogs.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.bloggo.nu` | Posts |
| `*.bloggo.nu/{slug}` | Post comments · posts |

### podCloud

Discovers the RSS feed of a show hosted on podCloud.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{show}.lepodcast.fr` | Podcast (RSS) |

### PromoDJ

Discovers the feeds of a PromoDJ artist profile.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `promodj.com/{user}` | Podcast · content · blog · favorites · events |
| `promodj.com/{user}/…` | Podcast · content · blog · favorites · events |

> [!NOTE]
> A feed the artist has never posted to answers with a redirect to the profile, which validation drops.

### Shopserve

Discovers the news feed of a Shopserve shop. Detected by the root-relative `/hpgen/HPB/` links and theme images every generated desktop page carries, so a shop on its own domain is covered.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| Any desktop page | News (RSS) |

### KKTIX

Discovers the Atom feed of a KKTIX organizer's public events.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{organizer}.kktix.cc` | Events |
| `{organizer}.kktix.cc/events/{event}` | Events<sup>†</sup> |

<sup>†</sup> *Found only by the Platform method.*

### Sportsregions

Discovers the news and events feeds of a Sportsregions club site. A club on its own domain is detected by the link to the platform's content report form in the footer of every club page.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{club}.sportsregions.fr/*` | News · events |
| `{custom-domain}/*` | News · events |

### Ochanoko Net

Discovers the RSS 1.0 feed of new products in an Ochanoko Net shop. A shop on a custom domain is detected by the cart script, `/res/{template}/js/ocnk.js` or `/res/{template}/js/pack/ocnk-min.js`.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{shop}.ocnk.net` | Products (RSS 1.0) |
| Any page on a custom domain | Products (RSS 1.0) |

### Blogia

Discovers the RSS feed for blogs hosted on Blogia.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.blogia.com` | Posts (RSS) |

### Parsiblog

Discovers RSS and Atom feeds for Parsiblog blogs. Parsiblog serves no HTTPS, so the feeds are always `http://`.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.parsiblog.com` | Posts (RSS + Atom) |
| `*.parsiblog.ir` | Posts (RSS + Atom), on the .com host |

### Blogalia

Discovers RDF and RSS 2.0 feeds for Blogalia blogs.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.blogalia.com` | Posts (RDF + RSS 2.0<sup>†</sup>) |

<sup>†</sup> *Found only by the Platform method.*

### Travellerspoint

Discovers Atom feeds for Travellerspoint travel blogs.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.travellerspoint.com` | Posts |

### Blogger.de

Discovers RSS 1.0 feeds for blogs on `*.blogger.de`. Every blog serves its posts at `/rss`.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{blog}.blogger.de` | Posts |

### Big Cartel

Discovers the product feeds of a Big Cartel store. A store on its own domain is detected by the `X-Frame-Options` header naming `my.bigcartel.com`, or by its `/theme_stylesheets/` stylesheet.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.bigcartel.com` | Products |
| Any page on a store's own domain | Products<sup>†</sup> |

<sup>†</sup> *Found only by the Platform method.*

> [!NOTE]
> Most store themes link only `/products.xml`, a Google Merchant feed whose items carry no title or link, so it parses with no items. The handler emits `/products.rss`, which carries both.

### TourTravelWorld

Discovers the tour packages feed of a TourTravelWorld travel site, built by Weblink.In on the agency's own domain. Detected by the template stylesheet on `catalog.wlimg.com` together with the page's link to `/tour-packages.rss`, so any domain is covered.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| Any page | Tour packages (RSS) |

### RealEstateIndia

Discovers the property listings feed of a RealEstateIndia agency site, built by Weblink.In on the agency's own domain. Detected by the template stylesheet on `catalog.wlimg.com` together with the page's link to `/property.rss`, so any domain is covered.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| Any page | Properties (RSS) |

### PlacementIndia

Discovers the vacancies feed of a PlacementIndia jobs site, built by Weblink.In on the consultancy's own domain, and on a job page the feed of that one opening. Detected by the template stylesheet on `catalog.wlimg.com` together with the page's link to `/vacancy.rss`, so any domain is covered.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| Any page | Vacancies (RSS) |
| Job page | Job opening (RSS) |

### GCS-web

Discovers the news release, SEC filing and event feeds of a company investor relations site on GCS-web. A site on the company's own domain is detected by the `/sites/g/files/knoqqb{id}/` path of its assets.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.gcs-web.com` | News releases<sup>†</sup> · SEC filings<sup>†</sup> · events<sup>†</sup> |
| Any page on a company's own domain | News releases<sup>†</sup> · SEC filings<sup>†</sup> · events<sup>†</sup> |

<sup>†</sup> *Found only by the Platform method.*

### Typecho

Discovers the feeds of a Typecho blog. Detected by a theme or plugin asset under `/usr/themes/` or `/usr/plugins/`, which also names the site root, so a blog under a sub-path gets its own feeds.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{site}/` | Posts · comments<sup>†</sup> (RSS + RSS 1.0 + Atom) |
| `{site}/{path}` | Page at `/feed/{path}` · posts (RSS + RSS 1.0<sup>†</sup> + Atom<sup>†</sup>) · comments<sup>†</sup> (RSS + RSS 1.0 + Atom) |

<sup>†</sup> *Found only by the Platform method.*

> [!NOTE]
> A site without URL rewriting serves its feeds under `/index.php/feed/`, so each feed is tried in that form after `/feed/`. The page feed holds the posts of a category, tag, author, date or search page, or the comments of a post or page.

### YM Careers

Discovers the job feeds of a YM Careers board that an association runs on its own domain. Detected by the `x-nas-sid` response header every board sends, its bot check page included.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{board}/jobs?{search}` | Search at `/jobs?display=rss&{search}` |
| `{board}/jobs/{filter}/{value}/…` | Filtered jobs at `/jobs/{filter}/{value}/…?display=rss` |
| Any other page | All jobs at `/jobs?display=rss` |

### Edlio

Discovers the news and class assignment feeds of an Edlio school website. Detected by the `/apps/js/common/list-pack.js` script every page loads, so any domain is covered.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{site}/apps/news/`, `{site}/apps/news/category/{id}` | News of the category the page links (RSS) |
| `{site}/apps/classes/{id}/assignments/` | Assignments of the class the page links (RSS) |
| `{site}/`, any other page | News (RSS) |

### Talentsoft

Discovers the job offer feeds of a Talentsoft career site, hosted on `talent-soft.com` or `profils.org` or on the employer's own domain. Detected by the `/client/dist/talentsoft-cookies.iife.js` script every page loads, so any domain is covered.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{site}/offre-de-emploi/liste-offres.aspx?{search}`, `{site}/job/list-of-jobs.aspx?{search}` | Search feed the page links at `/handlers/offerRss.ashx?{criteria}` · all offers<sup>†</sup> (RSS) |
| `{site}/`, any other page | All offers<sup>†</sup> at `/handlers/offerRss.ashx?LCID={lcid}`, in the language the page url or its all offers link names (RSS) |

<sup>†</sup> *Found only by the Platform method.*

### Plone

Discovers the search and syndication feeds of a classic Plone site. Detected by the `portaltype-` class every classic template prints on the body, so any domain is covered. A site under a sub-path gets its feeds there. Volto front ends print no such class and are left to generic discovery.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{site}/@@search?{query}`, `{site}/search?{query}` | Search results for the same query at `{site}/search_rss?{query}` (RSS 1.0) |
| `{site}/` | Site (RSS 1.0 + RSS 2.0 + Atom) |
| `{site}/{folder}`, any folder or collection page | Folder at `{folder}/RSS` (RSS 1.0 + RSS 2.0 + Atom) |

> [!NOTE]
> A site owner turns syndication on per folder, so a folder without it answers these URLs with 404. Document, news item, event, file, image and link pages serve no feed.

### NetCrew CMS

Discovers the site updates feed of a Japanese prefecture, city or town website built on NetCrew CMS. Detected by the root `/ssi/js/` and `/ssi/css/` asset paths every template loads, so any domain is covered. Section pages link their own feeds, whose names are internal ids, so only the home page needs the handler.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{site}/`, `{site}/index.html` | Site updates<sup>†</sup> (RDF or RSS) |

<sup>†</sup> *Found only by the Platform method.*

### Redmine

Discovers the Atom feeds of a Redmine install, Planio's hosted ones on `plan.io` included. Detected by the "Powered by Redmine" footer link, the `Redmine` description meta or the `_redmine_session` cookie, so any domain is covered. An install under a sub-path gets its feeds there. A private project redirects to the sign-in page, and an error page prints Redmine's error block, so neither gets a feed.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{site}/projects/{project}`, any other project page | Project activity, plus issues<sup>†</sup> and news<sup>?</sup> when the project menu lists them |
| `{site}/projects/{project}/issues` | Project issues |
| `{site}/projects/{project}/news` | Project news |
| `{site}/projects/{project}/activity` | Project activity |
| `{site}/projects/{project}/boards/{id}` | Forum messages |
| `{site}/projects/{project}/repository/…` | Repository revisions |
| `{site}/issues/{id}` | Issue updates |
| `{site}/issues` | Issues |
| `{site}/news` | News |
| `{site}/activity` | Activity |
| `{site}/projects` | Projects |
| `{site}/`, any other page | News · activity |

<sup>†</sup> *Found only by the Platform method.*

<sup>?</sup> *Not measured, the feed failed to load during the run.*

### b2evolution

Discovers the feeds of a b2evolution blog, kowsarblog.ir among them. Detected by the generator meta, the core scripts and styles every page loads from the install's `rsc/` directory, or the `session_b2evo` cookie, so any domain is covered. The blog comes from the feed links on the page, since b2evolution answers an unknown blog path with the default blog's feeds, and a 404 page gets none.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{blog}/{post}` | Post comments feed the page links at `?tempskin=_rss2&disp=comments&p={id}`, plus the blog feeds below |
| Any page that links its blog's feeds | Posts at `{blog}?tempskin=_rss2` and `_atom` · comments<sup>†</sup> at `{blog}?tempskin=_rss2&disp=comments` and `_atom` |

<sup>†</sup> *Found only by the Platform method.*

### Purot.net

Discovers the change feeds of a wiki on Purot.net. The page's own feeds come from the feed link the page carries, since a page that does not exist answers with the whole wiki's changes.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{wiki}.purot.net/{page}`, `{wiki}.purot.net/` | Page changes · page discussions · page changes, discussions and likes (RSS) · recent changes |
| `{wiki}.purot.net/profile/{user}`, any other page | Recent changes (RSS) |

### SkyCMS

Discovers the feed of a page in a Polish public information bulletin built on SkyCMS. Detected by the bulletin template's `/cms/public/image/default/bip_v{n}/` icon path, `/clients/cms_{client}/image/default/bip/` on a branded bulletin, or the `skycms_PageCounter` cookie, beside the link to the bulletin's RSS channel list, so any domain is covered. SkyCMS sites outside the bulletin template serve no page feeds and are left alone.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{site}/{id}/{slug}.html` | Page<sup>†</sup> at `/rss/{id}/{slug}.html` (RSS) |

<sup>†</sup> *Found only by the Platform method.*

### OPUS

Discovers the collection and search feeds of an OPUS 4 publication repository. Detected by the `frontdoorutil.js` script every layout loads, so any domain is covered. A repository under a sub-path gets its feeds there.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{repository}/solrsearch/index/search/searchtype/collection/id/{id}` | Collection the page links, else `{repository}/rss/index/index/searchtype/collection/id/{id}` (RSS) |
| `{repository}/solrsearch/index/search/searchtype/simple/query/{query}/…` | Search results the page links, else the same query and facets under `{repository}/rss/index/index/` (RSS) |

### Tender

Discovers the discussion feeds of a Tender Support site, hosted on `tenderapp.com` or on the company's own domain. A custom domain is detected by the `_tender19_session` cookie or the `Tender` settings script every page prints. A site under `/help/` gets its feeds there, and a missing page gets none.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{site}/discussions/{category}/{discussion}` | Discussion comments (Atom) |
| `{site}/`, any other page | All discussions (Atom) |

### AlloForum

Discovers the latest topics feeds of a forum on `*.alloforum.com`. Forum, category and subcategory pages link their feeds only as plain anchors, so the handler covers them.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{forum}.alloforum.com` | Latest topics<sup>†</sup> |
| `{forum}.alloforum.com/{slug}-c{id}-{page}.html` | Category<sup>†</sup> · latest topics<sup>†</sup> |
| `{forum}.alloforum.com/{slug}-c{id}-{subslug}-s{subid}-{page}.html` | Subcategory<sup>†</sup> · latest topics<sup>†</sup> |

<sup>†</sup> *Found only by the Platform method.*

### SportAdmin

Discovers the news feeds of a Swedish sports club website on SportAdmin. On the classic template a team page redirects to a url that no longer names the team, so the team is read from the page's link to its other layout. The new template keeps the team in the url.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{club}.web.sportadmin.se/?SID={id}`, a classic team page linking its other layout | Team news<sup>†</sup> at `/rss/?SID={id}` · club news |
| `{club}.web.sportadmin.se/?SID={id}` on the new template | Team news<sup>†</sup> at `/rss/?SID={id}` · club news |
| `{club}.web.sportadmin.se/`, any other page | Club news at `/rss/` |

<sup>†</sup> *Found only by the Platform method.*

### laget.se

Discovers the news feed of a sports club or team site on laget.se. The team page links the feed only through an icon with no text, and a team page without a news box links nothing, yet its feed still answers. A club on its own domain is detected by stylesheets or scripts loaded from the `g-content.laget.se` asset host, and serves its feed at the domain root.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `www.laget.se/{team}`, `www.laget.se/{team}/…` | News<sup>†</sup> at `www.laget.se/{team}/Home/NewsRss` (RSS) |
| Any other page | News<sup>†</sup> at `/Home/NewsRss` (RSS) |

<sup>†</sup> *Found only by the Platform method.*

### Geoblog.pl

Discovers the trip feed of a travel blog on Geoblog.pl. The trip is read from the page's breadcrumb, since an entry URL does not name it, and a trip feed answers with an empty channel for any made-up id. A user's home page and trip list link every trip feed themselves and get nothing from the handler.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{user}.geoblog.pl/podroz/{id}/{slug}` | Trip at `/podroz/rss/{id}.xml` (RSS) |
| `{user}.geoblog.pl/wpis/{id}/{slug}` | Trip<sup>†</sup> of the entry's trip (RSS) |

<sup>†</sup> *Found only by the Platform method.*

### OpenEdition Journals

Discovers the feeds of an academic journal on OpenEdition Journals at `journals.openedition.org/{journal}`. The feeds are built from the url, since the journal pages answer a browser with a bot challenge while the feeds do not.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `journals.openedition.org/{journal}/…` | Documents<sup>†</sup> at `{journal}/backend?format=rssdocuments` · issues<sup>†</sup> at `?format=rssnumeros` · reviews<sup>†</sup> at `?format=rssdocuments&type=review` (RSS 1.0) |

<sup>†</sup> *Found only by the Platform method.*

### Jinbo blog

Discovers the feeds of a blog on Jinbonet's blog host, `blog.jinbo.net/{user}`. The blog name keeps the case its own pages link the feeds in, and a tag or category page that found no posts gets only the blog's feeds.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `blog.jinbo.net/{user}` | Posts · comments and trackbacks (RSS and Atom) |
| `blog.jinbo.net/{user}/category/{id}` | Category (Atom), plus the blog feeds |
| `blog.jinbo.net/{user}/tag/{tag}` | Tag (Atom), plus the blog feeds |

### TischtennisLive

Discovers the feeds of a table tennis association on `{association}.tischtennislive.de`. A league or group page gets the results feeds whose id its own feed link names, since a results feed answers any id.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{association}.tischtennislive.de/?L2P={league}`, a league overview linking its results feeds | League results of the last 10 days · fixtures of the next 10 days at `/Export/Tischtennis/RSS.aspx?Typ=Wett&ID={league}&Next={0\|1}` (RSS) |
| `{association}.tischtennislive.de/?L3=SpielUebersicht&Gruppe={group}`, a match overview linking its results feeds | Group results of the last 10 days · fixtures of the next 10 days at `/Export/Tischtennis/RSS.aspx?Typ=Gruppe&ID={group}&Next={0\|1}` (RSS) |
| `{association}.tischtennislive.de`, any other page | News · dates<sup>†</sup> · documents<sup>†</sup> · tournaments<sup>†</sup> (RSS) |

<sup>†</sup> *Found only by the Platform method.*

### Newswire

Discovers the feeds of a company newsroom on `{newsroom}.newswire.com`. The newsroom links its own feed, and its beat and content type pages link none.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{newsroom}.newswire.com/browse/beat/{beat}` | Beat<sup>†</sup> at `/browse/rss/beat/{beat}` (RSS) |
| `{newsroom}.newswire.com/browse/pr`, `/browse/news`, `/browse/social` | Press releases, news<sup>†</sup> or social<sup>†</sup> wire at `/browse/rss/{type}` (RSS) |
| `{newsroom}.newswire.com`, any other page | Newsroom at `/browse/rss` (RSS) |

<sup>†</sup> *Found only by the Platform method.*

### Open Journal Systems

Discovers the feeds of a journal on Open Journal Systems, on any domain. Detected by the `Open Journal Systems` generator meta or the `OJSSID` session cookie. The journal's root is read from the theme stylesheet the page loads through `/$$$call$$$/`, so each journal of a multi-journal install gets its own feeds.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{journal}/`, `{journal}/article/view/{id}`, `{journal}/issue/view/{id}`, any other journal page | Articles · announcements (Atom + RSS 1.0<sup>†</sup> + RSS 2.0) |

<sup>†</sup> *Found only by the Platform method.*

> [!NOTE]
> The site-wide pages of a multi-journal install, under `/index`, belong to no journal and get no feeds. OJS 3.5 serves a non-default locale's feeds only to a client that keeps cookies, so the feeds are the journal root's, which redirect to the default locale.

### Aladin blog

Discovers the feeds of a user blog on Aladin, `blog.aladin.co.kr/{user}`. A category page links only the blog feed, and its own feed is listed only on the blog's subscribe page.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `blog.aladin.co.kr/{user}`, any other blog page | Blog |
| `blog.aladin.co.kr/{user}/category/{id}` | Category<sup>†</sup> · blog |

<sup>†</sup> *Found only by the Platform method.*

## Basic Usage

```typescript
import { discoverFeeds } from 'feedscout'

const feeds = await discoverFeeds('https://github.com/macieklamberski/feedsmith', {
  methods: ['platform'],
})

// [
//   { url: 'https://github.com/macieklamberski/feedsmith/releases.atom', ... },
//   { url: 'https://github.com/macieklamberski/feedsmith/commits.atom', ... },
//   { url: 'https://github.com/macieklamberski/feedsmith/tags.atom', ... },
// ]
```

## Configuration

### Handler Order

Handlers are checked in order. The first matching handler that generates feeds wins:

```typescript
import { githubHandler, redditHandler, youtubeHandler } from 'feedscout/platform'

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
  acastHandler,
  acomicsHandler,
  aladinHandler,
  alloforumHandler,
  amebloHandler,
  applePodcastsHandler,
  arenaHandler,
  art19Handler,
  artstationHandler,
  atwikiHandler,
  atyponHandler,
  audioboomHandler,
  aushaHandler,
  b2evolutionHandler,
  bearblogHandler,
  behanceHandler,
  bigCartelHandler,
  bigcommerceHandler,
  bitchuteHandler,
  blogaliaHandler,
  bloggangHandler,
  bloggerDeHandler,
  bloggoHandler,
  blogHuHandler,
  blogiaHandler,
  blogspotHandler,
  blueskyHandler,
  bookwyrmHandler,
  bubblelifeHandler,
  buttondownHandler,
  buzzsproutHandler,
  canalblogHandler,
  canpanHandler,
  captivateHandler,
  castopodHandler,
  castosHandler,
  chambermasterHandler,
  civicplusHandler,
  cnblogsHandler,
  cocologHandler,
  colorMeShopHandler,
  comicfuryHandler,
  confluenceHandler,
  cppblogHandler,
  cratesIoHandler,
  csdnHandler,
  dailymotionHandler,
  dasaugeHandler,
  deviantartHandler,
  devtoHandler,
  diasporaHandler,
  discourseHandler,
  dokuwikiHandler,
  doubanHandler,
  dreamwidthHandler,
  drupalHandler,
  dspaceHandler,
  edlioHandler,
  eklablogHandler,
  estrankyHandler,
  exblogHandler,
  exportersIndiaHandler,
  fc2Handler,
  firesideHandler,
  firstoryHandler,
  flickrHandler,
  flipboardHandler,
  forumotionHandler,
  friendicaHandler,
  gancioHandler,
  gcsWebHandler,
  geoblogHandler,
  ghostHandler,
  giteaHandler,
  githubHandler,
  githubGistHandler,
  gitlabHandler,
  gnuboardHandler,
  goodreadsHandler,
  goopeHandler,
  habrHandler,
  hackernewsHandler,
  haleyJobsHandler,
  hashnodeHandler,
  hatenaAntennaHandler,
  hatenaBookmarkHandler,
  hatenaFotolifeHandler,
  hatenablogHandler,
  hautetfortHandler,
  hearthisHandler,
  heyWorldHandler,
  insanejournalHandler,
  instatusHandler,
  internetArchiveHandler,
  isProgrammerHandler,
  itchioHandler,
  ivooxHandler,
  jellypodHandler,
  jimdoHandler,
  jinboHandler,
  jiraHandler,
  jugemHandler,
  kickstarterHandler,
  kktixHandler,
  kohaHandler,
  lagetHandler,
  launchpadHandler,
  learnkuHandler,
  legistarHandler,
  lemmyHandler,
  letterboxdHandler,
  librivoxHandler,
  libsynHandler,
  lichessHandler,
  listedHandler,
  livedoorBlogHandler,
  livejournalHandler,
  lobstersHandler,
  mailchimpHandler,
  mastodonHandler,
  mataroaHandler,
  mediawikiHandler,
  mediumHandler,
  megaphoneHandler,
  microblogHandler,
  misskeyHandler,
  myanimelistHandler,
  naverBlogHandler,
  nebulaHandler,
  neocitiesHandler,
  netcrewHandler,
  nethouseHandler,
  newswireHandler,
  niconicoHandler,
  ningHandler,
  nodebbHandler,
  noteHandler,
  noticeableHandler,
  observableHandler,
  ocnkHandler,
  odooHandler,
  odyseeHandler,
  ojsHandler,
  omekaHandler,
  omnystudioHandler,
  opencartJournalHandler,
  openeditionHandler,
  openstatusHandler,
  opusHandler,
  overblogHandler,
  packagistHandler,
  pagecordHandler,
  paragraphHandler,
  parsiblogHandler,
  pchomeHandler,
  peertubeHandler,
  pikaHandler,
  pinboardHandler,
  pinterestHandler,
  pixelfedHandler,
  placementIndiaHandler,
  pleromaHandler,
  ploneHandler,
  plurkHandler,
  pmwikiHandler,
  podbeanHandler,
  podcloudHandler,
  podhomeHandler,
  podigeeHandler,
  podloveHandler,
  podomaticHandler,
  postachioHandler,
  posthavenHandler,
  postypeHandler,
  prlogHandler,
  proboardsHandler,
  producthuntHandler,
  promodjHandler,
  proseHandler,
  publicInboxHandler,
  purotHandler,
  pypiHandler,
  qiitaHandler,
  rakutenBlogHandler,
  realEstateIndiaHandler,
  redcircleHandler,
  redditHandler,
  redmineHandler,
  reformalHandler,
  royalroadHandler,
  rssComHandler,
  rubygemsHandler,
  sakuraBlogHandler,
  sapoBlogsHandler,
  seesaaHandler,
  sermonNetHandler,
  shinobiHandler,
  shopifyHandler,
  shopserveHandler,
  skycmsHandler,
  smeBlogHandler,
  soundcloudHandler,
  soundonHandler,
  sourceforgeHandler,
  sourcehutHandler,
  sportsregionsHandler,
  spotifyForCreatorsHandler,
  spreakerHandler,
  squarespaceHandler,
  stackExchangeHandler,
  statuspageHandler,
  steamHandler,
  substackHandler,
  sverigesRadioHandler,
  syosetuHandler,
  talentsoftHandler,
  teletypeHandler,
  tenderHandler,
  tildesHandler,
  tischtennisliveHandler,
  tistoryHandler,
  togetterHandler,
  tourTravelWorldHandler,
  transistorHandler,
  travellerspointHandler,
  tumblrHandler,
  twodayHandler,
  ucozHandler,
  v2exHandler,
  vbulletinHandler,
  velogHandler,
  viablogaHandler,
  vimeoHandler,
  weblogLolHandler,
  webnodeHandler,
  webtoonsHandler,
  weeblyHandler,
  wikidotHandler,
  wildApricotHandler,
  wordpressHandler,
  wpengineHandler,
  writeasHandler,
  xenforoHandler,
  ximalayaHandler,
  yeswikiHandler,
  youtubeHandler,
  zennHandler,
} from 'feedscout/platform'
```

## Using Directly

Use the Platform discovery function directly to get URIs without validation:

```typescript
import { discoverUrisFromPlatform, youtubeHandler } from 'feedscout/platform'

const uris = await discoverUrisFromPlatform(htmlContent, undefined, {
  baseUrl: 'https://www.youtube.com/@mkbhd',
  handlers: [youtubeHandler],
})

// [
//   {
//     uri: [
//       'https://www.youtube.com/feeds/videos.xml?channel_id=UCBJycsmduvYEL83R_U4JriQ',
//       'https://www.youtube.com/feeds/videos.xml?playlist_id=UUBJycsmduvYEL83R_U4JriQ',
//     ],
//     hint: { key: 'youtube:all', label: 'All uploads' },
//   },
//   {
//     uri: 'https://www.youtube.com/feeds/videos.xml?playlist_id=UULFBJycsmduvYEL83R_U4JriQ',
//     hint: { key: 'youtube:videos', label: 'Videos' },
//   },
//   {
//     uri: 'https://www.youtube.com/feeds/videos.xml?playlist_id=UUSHBJycsmduvYEL83R_U4JriQ',
//     hint: { key: 'youtube:shorts', label: 'Shorts' },
//   },
//   {
//     uri: 'https://www.youtube.com/feeds/videos.xml?playlist_id=UULVBJycsmduvYEL83R_U4JriQ',
//     hint: { key: 'youtube:live', label: 'Live streams' },
//   },
//   {
//     uri: 'https://www.youtube.com/feeds/videos.xml?playlist_id=UULPBJycsmduvYEL83R_U4JriQ',
//     hint: { key: 'youtube:popular-videos', label: 'Popular videos' },
//   },
//   {
//     uri: 'https://www.youtube.com/feeds/videos.xml?playlist_id=UUPSBJycsmduvYEL83R_U4JriQ',
//     hint: { key: 'youtube:popular-shorts', label: 'Popular shorts' },
//   },
//   {
//     uri: 'https://www.youtube.com/feeds/videos.xml?playlist_id=UUPVBJycsmduvYEL83R_U4JriQ',
//     hint: { key: 'youtube:popular-live', label: 'Popular live streams' },
//   },
//   {
//     uri: 'https://www.youtube.com/feeds/videos.xml?playlist_id=UUMOBJycsmduvYEL83R_U4JriQ',
//     hint: { key: 'youtube:member-videos', label: 'Member videos' },
//   },
//   {
//     uri: 'https://www.youtube.com/feeds/videos.xml?playlist_id=UUMSBJycsmduvYEL83R_U4JriQ',
//     hint: { key: 'youtube:member-shorts', label: 'Member shorts' },
//   },
//   {
//     uri: 'https://www.youtube.com/feeds/videos.xml?playlist_id=UUMVBJycsmduvYEL83R_U4JriQ',
//     hint: { key: 'youtube:member-live', label: 'Member live streams' },
//   },
// ]
```

The arguments are the page content, the response headers, the options, an optional `fetchFn` that is passed on to handlers, and an optional `onError` that receives a throw from a handler or from `enrichFn`. Pass `undefined` for content or headers you do not have.

> [!NOTE]
> The YouTube handler requires HTML content for `@handle`, `/user/`, `/c/`, and video URLs to extract the channel ID. For `/channel/UC...` URLs, no content is needed.

## Creating Custom Handlers

You can create handlers for platforms not included by default.

### Handler Interface

A `PlatformHandler` has two methods and an optional regex:

```typescript
type PlatformHandler = {
  match: (url: string, content?: string, headers?: Headers) => boolean
  resolve: (
    url: string,
    content?: string,
    headers?: Headers,
    fetchFn?: FetchFn,
  ) => MaybePromise<Array<DiscoverUriEntry | DiscoverRef>>
  guessExclusionRegex?: RegExp
}
```

| Member | Description |
|--------|-------------|
| `match(url, content?, headers?)` | Returns `true` if this handler should process the URL |
| `resolve(url, content?, headers?, fetchFn?)` | Returns an array of [`DiscoverUriEntry`](/reference/types#discoverurientry) objects for the given page URL. A favicon handler can also return a [`DiscoverRef`](/reference/types#discoverref) for an icon that takes an extra request. See [Enriching Platform Icons](/other/favicons#enriching-platform-icons) |
| `guessExclusionRegex` | Matches the full URL of any user's feed on the platform's host. When the handler matches the page, the [Guess method](/feeds/guess) drops URLs matching it, unless the handler generated them. Set it on a platform where a path like `/feed.xml` can be the feed of a user named `feed` |

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

    return [{ uri: `${origin}/feed.xml` }]
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
      return [{ uri: `${origin}/users/${match[1]}/feed.rss` }]
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

    return match?.[1] ? [{ uri: match[1] }] : []
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
