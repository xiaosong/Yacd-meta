import { DelayMapping, ProxiesMapping } from '~/store/types';

export const PROXY_SORT_OPTIONS = [
  ['Natural', 'order_natural'],
  ['LatencyAsc', 'order_latency_asc'],
  ['LatencyDesc', 'order_latency_desc'],
  ['NameAsc', 'order_name_asc'],
  ['NameDesc', 'order_name_desc'],
] as const;

/** 搜索框分词：空格分隔，任一词命中即算命中 */
export function parseFilterSegments(filterText: string): string[] {
  if (typeof filterText !== 'string') return [];
  return filterText
    .toLowerCase()
    .split(' ')
    .map((x) => x.trim())
    .filter((x) => !!x);
}

/** 无搜索词时一律视为命中 */
export function matchesFilter(name: string, segments: string[]): boolean {
  if (segments.length === 0) return true;
  const lower = name.toLowerCase();
  return segments.some((seg) => lower.indexOf(seg) > -1);
}

/**
 * 排序设置在 UI 上拆成「维度 + 方向」两层：分段控件选维度，
 * 再次点击同一维度切换升/降序。store 里仍然只存原来那 5 个值。
 */
export type ProxySortKey = 'Natural' | 'Latency' | 'Name';

export function getProxySortKey(proxySortBy: string): ProxySortKey {
  if (proxySortBy.startsWith('Latency')) return 'Latency';
  if (proxySortBy.startsWith('Name')) return 'Name';
  return 'Natural';
}

/** 「原始顺序」没有方向，返回 null */
export function getProxySortDirection(proxySortBy: string): 'Asc' | 'Desc' | null {
  if (proxySortBy.endsWith('Desc')) return 'Desc';
  if (proxySortBy.endsWith('Asc')) return 'Asc';
  return null;
}

/** 点击某个维度后的下一个 proxySortBy：切维度时用升序，点当前维度则反向 */
export function nextProxySortBy(proxySortBy: string, key: ProxySortKey): string {
  if (key === 'Natural') return 'Natural';
  if (getProxySortKey(proxySortBy) !== key) return `${key}Asc`;
  return getProxySortDirection(proxySortBy) === 'Asc' ? `${key}Desc` : `${key}Asc`;
}

/** 测速超时的常用档位（毫秒） */
export const LATENCY_TIMEOUT_PRESETS = [2000, 5000, 10000];

/** 订阅健康检查超时的常用档位（毫秒） */
export const HEALTHCHECK_TIMEOUT_PRESETS = [5000, 10000, 20000];

/** 把当前值并进档位里，避免旧配置里的自定义值在分段控件上「没有选中项」 */
export function withCurrentTimeout(presets: number[], current: number): number[] {
  if (!current || presets.includes(current)) return presets;
  return [...presets, current].sort((a, b) => a - b);
}

export function splitItemsByLayout<T>(items: T[], layout: string) {
  if (layout !== 'double') {
    return [items];
  }

  const left: T[] = [];
  const right: T[] = [];
  items.forEach((item, index) => {
    if (index % 2 === 0) {
      left.push(item);
    } else {
      right.push(item);
    }
  });

  return [left, right];
}

export function getProxyLatency(
  proxies: ProxiesMapping,
  delay: DelayMapping,
  name: string,
  visited = new Set<string>(),
) {
  if (visited.has(name)) return undefined;
  visited.add(name);

  const latency = delay[name];
  if (latency && (latency.testing || typeof latency.number === 'number' || latency.error)) {
    return latency;
  }

  const proxy = proxies[name];
  if (proxy && proxy.now && proxies[proxy.now]) {
    return getProxyLatency(proxies, delay, proxy.now, visited);
  }

  const delayFromHistory = proxy?.history?.[proxy.history.length - 1]?.delay;
  if (typeof delayFromHistory === 'number' && delayFromHistory > 0) {
    return { number: delayFromHistory };
  }

  return latency;
}
