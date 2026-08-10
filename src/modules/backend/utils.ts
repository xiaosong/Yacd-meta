import { fetchConfigs } from '~/api/configs';
import type { ClashAPIConfig } from '~/types';

export type Protocol = 'http' | 'https';

/** 后端地址在表单里被拆成三段独立编辑 */
export type BackendFields = {
  protocol: Protocol;
  host: string;
  port: string;
};

export const DEFAULT_BACKEND_FIELDS: BackendFields = {
  protocol: 'http',
  host: '127.0.0.1',
  port: '9090',
};

const Ok = 0;

/** IPv6 在 URL 里带方括号，表单里只展示裸地址 */
function stripBrackets(host: string) {
  return host.replace(/^\[/, '').replace(/\]$/, '');
}

function isIPv6(host: string) {
  return host.includes(':');
}

/** 把完整 baseURL 拆成协议 / 主机 / 端口，解析失败返回 null */
export function splitAPIBaseURL(baseURL: string): BackendFields | null {
  let url: URL;
  try {
    url = new URL(baseURL);
  } catch (e) {
    return null;
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
  const protocol: Protocol = url.protocol === 'https:' ? 'https' : 'http';

  return {
    protocol,
    host: stripBrackets(url.hostname),
    port: url.port || (protocol === 'https' ? '443' : '80'),
  };
}

/**
 * 允许把一整条地址粘贴进 Host 输入框，自动拆到对应字段。
 * 返回 null 表示这就是个普通主机名，按原样填入 Host 即可。
 */
export function splitPastedHost(value: string): Partial<BackendFields> | null {
  const text = value.trim();
  const hasProtocol = text.includes('://');
  if (!hasProtocol && !/^[^\s/:]+:\d+$/.test(text)) return null;

  const fields = splitAPIBaseURL(hasProtocol ? text : `http://${text}`);
  if (!fields) return null;

  // 没写协议时不要凭空替用户选一个
  return hasProtocol ? fields : { host: fields.host, port: fields.port };
}

/** 三段拼回 baseURL，同时做基本校验 */
export function buildAPIBaseURL({
  protocol,
  host,
  port,
}: BackendFields): { baseURL: string } | { error: string } {
  const trimmedHost = stripBrackets(host.trim());
  const trimmedPort = port.trim();

  if (!trimmedHost) return { error: 'Host is required' };
  if (/[\s/?#]/.test(trimmedHost)) return { error: 'Invalid host' };
  if (!trimmedPort) return { error: 'Port is required' };
  if (!/^\d{1,5}$/.test(trimmedPort) || Number(trimmedPort) < 1 || Number(trimmedPort) > 65535) {
    return { error: 'Port must be a number between 1 and 65535' };
  }

  const hostname = isIPv6(trimmedHost) ? `[${trimmedHost}]` : trimmedHost;
  return { baseURL: `${protocol}://${hostname}:${trimmedPort}` };
}

export async function verifyAPIConfig(apiConfig: ClashAPIConfig): Promise<[number, string?]> {
  try {
    const res = await fetchConfigs(apiConfig);
    if (res.status > 399) {
      return [1, res.statusText];
    }
    return [Ok];
  } catch (e) {
    return [1, 'Failed to connect'];
  }
}

export async function detectEmbeddedAPIBaseURL() {
  try {
    const res = await fetch('/');
    // 内核设置了 secret 时根路径返回 401，这同样说明当前 origin 就是 API 地址
    // （面板被内核自己托管在 /ui/ 下的常见情况）
    if (res.status === 401) return window.location.origin;
    if (res.headers.get('content-type')?.includes('application/json')) {
      const data = await res.json();
      if (data.hello === 'clash') {
        return window.location.origin;
      }
    }
  } catch (e) {
    // ignore auto detection failures
  }

  return null;
}
