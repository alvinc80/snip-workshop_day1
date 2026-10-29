#!/usr/bin/env node
'use strict';

const { spawn } = require('node:child_process');

const usage = `Usage:
  snip add <url>    Create a short link
  snip ls           List links and visit counts
  snip open <code>  Open the original URL in your browser
  snip help         Show this message

Set SNIP_API to use a backend other than http://localhost:3000.`;

function getApiBase() {
  const value = process.env.SNIP_API || 'http://localhost:3000';
  let parsedUrl;

  try {
    parsedUrl = new URL(value);
  } catch {
    throw new Error('SNIP_API must be a valid http(s) URL.');
  }

  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    throw new Error('SNIP_API must use http or https.');
  }

  return parsedUrl.toString().replace(/\/+$/, '');
}

async function fetchApi(path, options = {}) {
  const baseUrl = getApiBase();
  let response;

  try {
    response = await fetch(`${baseUrl}${path}`, options);
  } catch {
    throw new Error(`Could not reach the Snip API at ${baseUrl}.`);
  }

  return response;
}

async function getResponseError(response, missingMessage = 'The Snip API could not complete the request.') {
  if (response.status === 404) return new Error(missingMessage);

  let payload;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  const message = payload && typeof payload.error === 'string'
    ? payload.error
    : `The Snip API returned HTTP ${response.status}.`;
  return new Error(message);
}

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    throw new Error('The Snip API returned invalid JSON.');
  }
}

function normalizeHttpUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error('Enter a complete http(s) URL.');
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Only http:// and https:// URLs can be shortened.');
  }

  return url.href;
}

async function addLink(value) {
  const url = normalizeHttpUrl(value);
  const response = await fetchApi('/api/links', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) throw await getResponseError(response);

  const link = await readJson(response);
  if (typeof link.shortUrl !== 'string') {
    throw new Error('The Snip API response did not include a short URL.');
  }
  console.log(link.shortUrl);
}

async function listLinks() {
  const response = await fetchApi('/api/links');
  if (!response.ok) throw await getResponseError(response);

  const links = await readJson(response);
  if (!Array.isArray(links)) {
    throw new Error('The Snip API returned an invalid links list.');
  }
  if (links.length === 0) {
    console.log('No links yet.');
    return;
  }

  const rows = links.map((link) => ({
    code: String(link.code ?? ''),
    hits: String(link.hits ?? 0),
    url: String(link.url ?? ''),
  }));
  const codeWidth = Math.max(4, ...rows.map((row) => row.code.length));
  const hitsWidth = Math.max(4, ...rows.map((row) => row.hits.length));

  console.log(`${'CODE'.padEnd(codeWidth)}  ${'HITS'.padStart(hitsWidth)}  URL`);
  for (const row of rows) {
    console.log(`${row.code.padEnd(codeWidth)}  ${row.hits.padStart(hitsWidth)}  ${row.url}`);
  }
}

function openInBrowser(targetUrl) {
  let command;
  let args;
  const options = { detached: true, stdio: 'ignore' };

  if (process.platform === 'win32') {
    command = process.env.ComSpec || 'cmd.exe';
    args = ['/d', '/s', '/c', `start "" "${targetUrl}"`];
    options.windowsVerbatimArguments = true;
  } else if (process.platform === 'darwin') {
    command = 'open';
    args = [targetUrl];
  } else {
    command = 'xdg-open';
    args = [targetUrl];
  }

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, options);
    child.once('error', reject);
    child.once('spawn', () => {
      child.unref();
      resolve();
    });
  });
}

async function openLink(code) {
  if (!/^[A-Za-z0-9]{6}$/.test(code)) {
    throw new Error('Enter a six-character short code.');
  }

  const response = await fetchApi(`/${encodeURIComponent(code)}`, { redirect: 'manual' });
  if (response.status === 404) {
    throw await getResponseError(response, `No link found for code ${code}.`);
  }
  if (response.status !== 302) throw await getResponseError(response);

  const location = response.headers.get('Location');
  if (!location) throw new Error('The Snip API redirect did not include a Location header.');

  let targetUrl;
  try {
    targetUrl = new URL(location, `${getApiBase()}/`);
  } catch {
    throw new Error('The Snip API returned an invalid redirect URL.');
  }
  if (targetUrl.protocol !== 'http:' && targetUrl.protocol !== 'https:') {
    throw new Error('The Snip API redirect must use http or https.');
  }

  await openInBrowser(targetUrl.href);
  console.log(`Opening ${targetUrl.href}`);
}

async function main(args) {
  const [command, ...parameters] = args;

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    if (parameters.length > 0) throw new Error(usage);
    console.log(usage);
    return;
  }

  if (command === 'add') {
    if (parameters.length !== 1) throw new Error('Usage: snip add <url>');
    await addLink(parameters[0]);
    return;
  }

  if (command === 'ls') {
    if (parameters.length !== 0) throw new Error('Usage: snip ls');
    await listLinks();
    return;
  }

  if (command === 'open') {
    if (parameters.length !== 1) throw new Error('Usage: snip open <code>');
    await openLink(parameters[0]);
    return;
  }

  throw new Error(`Unknown command: ${command}\n\n${usage}`);
}

main(process.argv.slice(2)).catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exitCode = 1;
});
