# Snip CLI

A zero-dependency Node.js command-line client for the Snip URL shortener. Requires Node 20 or newer.

```sh
node cli.js add https://example.com/article
node cli.js ls
node cli.js open ABC123
```

The API defaults to `http://localhost:3000`. Set `SNIP_API` to use another backend URL. Use `node cli.js help` to see all commands. The `snip`, `snip.cmd`, and `snip.ps1` launchers forward their arguments to `cli.js` on their respective shells.
