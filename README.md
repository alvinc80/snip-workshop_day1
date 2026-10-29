# Snip: One Backend, Two Clients

Snip is a tiny URL shortener built to show one backend serving two different clients: an Angular web app and a Node command-line tool. Both clients use the same HTTP API. The backend stores links in an in-memory `Map`, so restarting it clears the data.

## API contract

| Method | Path | Request | Response |
| --- | --- | --- | --- |
| `POST` | `/api/links` | `{ "url": "https://example.com" }` | `201` `{ code, url, shortUrl, hits, createdAt }`; `400` for invalid JSON or a non-HTTP(S) URL |
| `GET` | `/api/links` | — | `200` array of link objects |
| `GET` | `/:code` | — | `302` redirect to the original URL and increment `hits`; `404` if unknown |

## Branches and layout

Each project lives at the root of its own orphan branch. The `main` branch mounts each branch as a Git submodule. Its Git tree pins every submodule to an exact commit; `.gitmodules` records the repository URL and branch to follow when updating.

| Path | Tracked branch | Stack | Purpose |
| --- | --- | --- | --- |
| `backend/` | `backend` | Bun, zero dependencies | API and short-code redirects |
| `frontend/` | `frontend` | Angular 19 | URL form and links table |
| `cli/` | `cli` | Node 20+, zero dependencies | `snip add`, `snip ls`, and `snip open` |

## Clone

Use `--recurse-submodules` to populate all three project folders:

```sh
git clone --recurse-submodules https://github.com/alvinc80/snip-workshop_day1.git
```

A plain `git clone` checks out `main` but leaves submodule directories empty. To populate them afterward, run:

```sh
git submodule update --init --recursive
```

## Run locally

Start the backend in one terminal:

```sh
cd backend
bun start
```

Start the web app in another terminal:

```sh
cd frontend
npm install
npx ng serve
```

Open `http://localhost:4200`. The frontend calls the backend at `http://localhost:3000`.

Use the CLI from a third terminal to work with the same backend data:

```sh
cd cli
node cli.js add https://example.com/article
node cli.js ls
node cli.js open <code>
```

Set `SNIP_API` to point the CLI at a different backend URL. The `snip`, `snip.cmd`, and `snip.ps1` launchers are available for POSIX shells, Command Prompt, and PowerShell respectively.

## Update a project

First commit and push changes from inside the project submodule. Then, from the `main` checkout, advance and commit its pinned pointer:

```sh
cd backend
# Edit files, then:
git add -A
git commit -m "Describe backend change"
git push
cd ..
git submodule update --remote backend
git add backend
git commit -m "Bump backend submodule"
git push
```

Repeat with `frontend` or `cli` as needed. The project commit and the superproject pointer update are separate commits: pushing a project branch alone does not move the version pinned by `main`.
