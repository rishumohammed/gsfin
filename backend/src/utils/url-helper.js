/**
 * Safely resolves the live Frontend and Backend base URLs.
 * Automatically prefers incoming HTTP request headers (origin, referer, x-forwarded-host, host)
 * when running behind a domain or reverse proxy (e.g., https://gsfin.uk),
 * filters out unintended 'localhost' fallbacks in production/hosted deployments,
 * and defaults to 'https://gsfin.uk'.
 */

export function getFrontendUrl(req = null) {
  // 1. Try to detect from incoming request headers
  if (req) {
    const origin = typeof req.get === 'function' ? req.get('origin') : req.headers?.origin;
    if (origin && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
      return origin.replace(/\/+$/, '');
    }

    const referer = typeof req.get === 'function' ? req.get('referer') : req.headers?.referer;
    if (referer) {
      try {
        const u = new URL(referer);
        if (u.hostname && !u.hostname.includes('localhost') && !u.hostname.includes('127.0.0.1')) {
          return `${u.protocol}//${u.host}`.replace(/\/+$/, '');
        }
      } catch (e) {}
    }

    const forwardedHost = typeof req.get === 'function' 
      ? (req.get('x-forwarded-host') || req.get('host'))
      : (req.headers?.['x-forwarded-host'] || req.headers?.host);
    if (forwardedHost && !forwardedHost.includes('localhost') && !forwardedHost.includes('127.0.0.1')) {
      const proto = (typeof req.get === 'function' ? req.get('x-forwarded-proto') : req.headers?.['x-forwarded-proto']) || req.protocol || 'https';
      return `${proto}://${forwardedHost}`.replace(/\/+$/, '');
    }
  }

  // 2. Check FRONTEND_URL from environment (only if valid non-localhost)
  const envUrl = process.env.FRONTEND_URL;
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl.replace(/\/+$/, '');
  }

  // 3. Fallback: Always default to the official live domain https://gsfin.uk
  return 'https://gsfin.uk';
}

export function getBackendUrl(req = null) {
  if (req) {
    const forwardedHost = typeof req.get === 'function' 
      ? (req.get('x-forwarded-host') || req.get('host'))
      : (req.headers?.['x-forwarded-host'] || req.headers?.host);
    if (forwardedHost && !forwardedHost.includes('localhost') && !forwardedHost.includes('127.0.0.1')) {
      const proto = (typeof req.get === 'function' ? req.get('x-forwarded-proto') : req.headers?.['x-forwarded-proto']) || req.protocol || 'https';
      return `${proto}://${forwardedHost}`.replace(/\/+$/, '');
    }
  }

  const envUrl = process.env.BACKEND_URL || process.env.APP_URL;
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl.replace(/\/+$/, '');
  }

  return 'https://gsfin.uk';
}

export default {
  getFrontendUrl,
  getBackendUrl
};
