# LinkedIn launch copy — Sentinel Rights

Use this document when posting about the Sentinel AT3 project going live.  
**Live demo:** http://3.104.237.26

Australian English. Adjust tone to your voice before posting.

---

## Suggested post (long — recommended)

**Today, Sentinel Rights is live on the internet.**

For months, this was a local project on my laptop — a React + .NET complaint portal built for ITEC 634, designed to show what a more accessible human-rights reporting experience could look like in Australia.

Getting it *online* was a different story.

We hardened production (no demo passwords on the login screen, bootstrap admin via env vars only). We containerised the API and SPA on a **free-tier AWS EC2 t3.micro**, wired up GitHub Actions CI, and learned — the hard way — that 1 GB of RAM does not love `docker-compose up --build` on every push. An OOM crash took the instance down once. We switched to **manual deploys**, attached an **Elastic IP**, and rebuilt more carefully.

Then came the bugs that only appear in production: the Resources page went blank because nginx was serving HTML instead of proxying `/api` to the backend. On Amazon Linux, `docker compose` is not `docker-compose`. Google Search Console wanted an HTML file, not a meta tag. Every fix felt small; every fix took an hour I did not think I had.

And then — `curl http://3.104.237.26/api/resources` returned JSON. The support resources page loaded. Open Graph previews showed **Sentinel Rights** instead of a generic title. Search Console verified. I refreshed the Post Inspector and saw the card I had imagined.

None of this would have been possible without the ecosystems that give students and builders room to learn:

- **AWS Free Tier** — EC2, EBS, Elastic IP, and the patience to read one more security-group rule
- **GitHub** — private repo, Actions CI, and SSH deploy when we were ready (not when RAM was not)
- **Google Search Console** — free indexing and ownership verification, even on a bare IP
- **Open source** — .NET, React, Vite, Docker, nginx, and every tutorial that filled the gaps

Sentinel remains a **demonstration project**. It is not affiliated with the Australian Human Rights Commission and does not provide legal advice. But it is *real* software, on a real server, handling a full complaint workflow — wizard, anonymous lodgement, tracking, and a caseworker dashboard.

If you are building something on a student budget: the free tiers are not a shortcut. They are a lifeline. Use them, break things, document what you learned, and ship anyway.

Try it: http://3.104.237.26

#WebDevelopment #FullStack #AWS #React #DotNet #StudentDeveloper #Accessibility #HumanRights #OpenSource #BuildInPublic

---

## Suggested post (medium)

**Sentinel Rights is live.**

ITEC 634 capstone: a full-stack human-rights complaint portal (React + ASP.NET Core, SQLite, Docker on AWS free tier).

The build was the easy part. Production was the teacher: OOM on a t3.micro, Elastic IP after a stop/start, nginx `/api` routing, manual deploys, Search Console on a raw IP, and a Resources page that went blank until we rebuilt with the right proxy config.

Huge thanks to **AWS Free Tier**, **GitHub Actions**, **Google Search Console**, and the open-source stack that makes student projects possible without a corporate budget.

Demo only — not legal advice, not affiliated with the AHRC.

http://3.104.237.26

#AWS #React #DotNet #StudentDeveloper #HumanRights

---

## Suggested post (short)

Shipped: **Sentinel Rights** — an accessible demo complaint portal for ITEC 634.

React + .NET on AWS free tier. Many late nights, one OOM crash, one Elastic IP, and a lot of gratitude for student-friendly tools (AWS, GitHub, Google Search Console, open source).

Live demo: http://3.104.237.26

#BuildInPublic #FullStack #AWS

---

## Optional first comment (technical credibility)

Stack: React 18 + TypeScript + Vite · ASP.NET Core 10 + Identity/JWT · SQLite on EBS · Docker Compose on EC2 · GitHub Actions CI · Open Graph + sitemap for SEO · nginx reverse proxy for same-origin `/api`.

Repo is private for assessment; happy to discuss architecture in comments.

---

## Journey checklist (for your own story / presentation)

Use these beats if you extend the post or present to class:

| Phase | What happened |
|-------|----------------|
| Product | Five-step complaint wizard, anonymous lodgement, reference tracking, caseworker triage dashboard |
| Security | Removed public demo credentials; production bootstrap caseworker via env vars only |
| AWS | EC2 t3.micro, EBS for SQLite + evidence, Docker Compose (API + nginx SPA) |
| CI/CD | GitHub Actions tests on push; manual EC2 deploy (after auto-deploy OOM lesson) |
| Networking | Elastic IP `3.104.237.26`; security groups for 22 / 80 / 8080 |
| Production bugs | Resources page blank → nginx `/api` proxy; `docker-compose` vs `docker compose` |
| SEO & sharing | `VITE_SITE_URL`, Open Graph, Twitter cards, `og-image.png`, sitemap, robots.txt |
| Google | Search Console HTML file verification; `site:3.104.237.26` to check indexing |
| LinkedIn | Post Inspector — title, description, and preview image confirmed |

---

## People & platforms to thank (pick what fits your post)

- **AWS** — Free Tier EC2, EBS, Elastic IP
- **GitHub** — repository hosting, Actions, (Student Developer Pack if you use it)
- **Google** — Search Console, Translate widget integration on the site
- **Microsoft / .NET** — SDK and runtime
- **Vite / React communities** — frontend tooling
- **ACU / ITEC 634** — unit framing and assessment context
- **Cursor / AI-assisted development** — optional, only if you are comfortable saying so

---

## Before you post

1. Paste `http://3.104.237.26` — LinkedIn will pull Open Graph metadata automatically.
2. Optional: attach a screenshot of the landing page or LinkedIn Post Inspector preview.
3. Refresh cached preview if needed: https://www.linkedin.com/post-inspector/
4. Keep the demo disclaimer visible in comments if markers or employers read the thread.

---

## Disclaimer line (always include somewhere)

*Sentinel Rights is an independent demonstration project for university assessment. It is not affiliated with the Australian Human Rights Commission and does not provide legal advice.*
