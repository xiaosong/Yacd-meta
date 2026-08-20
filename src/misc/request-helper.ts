import { trimTrailingSlash } from '~/misc/utils';
import { ClashAPIConfig, LogsAPIConfig } from '~/types';

const headersCommon = { 'Content-Type': 'application/json' };

function genCommonHeaders({ secret }: { secret?: string }) {
  const h: Record<string, string> = { ...headersCommon };
  if (secret) {
    h['Authorization'] = `Bearer ${secret}`;
  }
  return h;
}
function buildWebSocketURLBase(baseURL: string, params: URLSearchParams, endpoint: string) {
  const qs = '?' + params.toString();
  const url = new URL(baseURL);
  url.protocol === 'https:' ? (url.protocol = 'wss:') : (url.protocol = 'ws:');
  return `${trimTrailingSlash(url.href)}${endpoint}${qs}`;
}

export function getURLAndInit({ baseURL, secret }: ClashAPIConfig) {
  const headers = genCommonHeaders({ secret });
  return {
    url: baseURL,
    init: { headers },
  };
}

// mihomo 出错时返回 { "message": "..." }
export async function readErrorMessage(res: Response) {
  try {
    const payload = await res.json();
    if (payload && typeof payload.message === 'string') return payload.message;
  } catch {
    // 不是 JSON，退回状态行
  }
  return res.statusText || String(res.status);
}

export function buildWebSocketURL(apiConfig: ClashAPIConfig, endpoint: string) {
  const { baseURL, secret } = apiConfig;
  // 没有 secret 时不能带 token，URLSearchParams 会把 undefined 变成字面量 "undefined"
  const params = new URLSearchParams(secret ? { token: secret } : {});

  return buildWebSocketURLBase(baseURL, params, endpoint);
}

export function buildLogsWebSocketURL(apiConfig: LogsAPIConfig, endpoint: string) {
  const { baseURL, secret, logLevel } = apiConfig;
  const params = new URLSearchParams(
    secret ? { token: secret, level: logLevel } : { level: logLevel },
  );

  return buildWebSocketURLBase(baseURL, params, endpoint);
}
