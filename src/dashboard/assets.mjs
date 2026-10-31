import { readFileSync } from 'node:fs';

function load(name) {
  return readFileSync(new URL(`../../public/${name}`, import.meta.url), 'utf8');
}

export const DASHBOARD_ASSETS = Object.freeze({
  '/assets/dashboard.css': {
    body: load('dashboard.css'),
    contentType: 'text/css; charset=utf-8',
  },
  '/assets/dashboard.js': {
    body: load('dashboard.js'),
    contentType: 'text/javascript; charset=utf-8',
  },
  '/assets/login.js': {
    body: load('login.js'),
    contentType: 'text/javascript; charset=utf-8',
  },
  '/assets/onboarding.js': {
    body: load('onboarding.js'),
    contentType: 'text/javascript; charset=utf-8',
  },
});
