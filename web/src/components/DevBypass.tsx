"use client";

// Exposes a console command to set/remove a cookie used to bypass the rate limiter.
// Usage in browser console:
//   toolfinityBypass.enable('YOUR_SECRET_TOKEN');
//   toolfinityBypass.disable();

declare global {
  // eslint-disable-next-line no-var
  var toolfinityBypass: {
    enable: (token: string) => void;
    disable: () => void;
  } | undefined;
}

function setCookie(name: string, value: string, days: number) {
  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = `expires=${d.toUTCString()}`;
  document.cookie = `${name}=${encodeURIComponent(value)}; ${expires}; path=/; SameSite=Lax`;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}

export default function DevBypass() {
  if (typeof window !== 'undefined') {
    // Initialize helper if not present
    if (!window.toolfinityBypass) {
      window.toolfinityBypass = {
        enable: (token: string) => setCookie('rl_dev', token, 7),
        disable: () => deleteCookie('rl_dev'),
      };
      // Optional: brief console hint
      // eslint-disable-next-line no-console
      console.info('[Toolfinity] Dev bypass ready. Run toolfinityBypass.enable(SECRET) to bypass rate limits.');
    }
  }
  return null;
}


