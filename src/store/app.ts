import { DispatchFn, GetStateFn, State, StateApp } from '~/store/types';
import type { ClashAPIConfig } from '~/types';

import { DEFAULT_LATENCY_TEST_URL, PROVIDER_HEALTHCHECK_TIMEOUT } from '../misc/constants';
import { loadState, saveState } from '../misc/storage';
import { debounce, trimTrailingSlash } from '../misc/utils';

import { fetchConfigs } from './configs';
import { closeModal } from './modals';

export const getClashAPIConfig = (s: State) => {
  const idx = s.app.selectedClashAPIConfigIndex;
  return s.app.clashAPIConfigs[idx];
};
export const getSelectedClashAPIConfigIndex = (s: State) => s.app.selectedClashAPIConfigIndex;
export const getClashAPIConfigs = (s: State) => s.app.clashAPIConfigs;
export const getTheme = (s: State) => s.app.theme;
export const getSelectedChartStyleIndex = (s: State) => s.app.selectedChartStyleIndex;
export const getLatencyTestUrl = (s: State) => s.app.latencyTestUrl;
export const getLatencyTestTimeout = (s: State) => s.app.latencyTestTimeout;
export const getLatencyTestExpectedStatus = (s: State) => s.app.latencyTestExpectedStatus;
export const getPreferBackendLatencyTestUrl = (s: State) => s.app.preferBackendLatencyTestUrl;
export const getProviderHealthcheckTimeout = (s: State) => s.app.providerHealthcheckTimeout;
export const getCollapsibleIsOpen = (s: State) => s.app.collapsibleIsOpen;
export const getProxySortBy = (s: State) => s.app.proxySortBy;
export const getHideUnavailableProxies = (s: State) => s.app.hideUnavailableProxies;
export const getAutoCloseOldConns = (s: State) => s.app.autoCloseOldConns;
export const getLogStreamingPaused = (s: State) => s.app.logStreamingPaused;
export const getProxiesLayout = (s: State) => s.app.proxiesLayout;
export const getProxyGroupByProvider = (s: State) => s.app.proxyGroupByProvider;

const saveStateDebounced = debounce(saveState, 600);

function findClashAPIConfigIndex(getState: GetStateFn, { baseURL, secret }: ClashAPIConfig) {
  const arr = getClashAPIConfigs(getState());
  for (let i = 0; i < arr.length; i++) {
    const x = arr[i];
    if (x.baseURL === baseURL && x.secret === secret) return i;
  }
}

export function addClashAPIConfig({ baseURL, secret }: ClashAPIConfig) {
  return async (dispatch: DispatchFn, getState: GetStateFn) => {
    const idx = findClashAPIConfigIndex(getState, { baseURL, secret });
    // already exists
    if (idx !== undefined) return;

    const clashAPIConfig = { baseURL, secret, addedAt: Date.now() };
    dispatch('addClashAPIConfig', (s) => {
      s.app.clashAPIConfigs.push(clashAPIConfig);
    });
    // side effect
    saveState(getState().app);
  };
}

export function removeClashAPIConfig({ baseURL, secret }: ClashAPIConfig) {
  return async (dispatch: DispatchFn, getState: GetStateFn) => {
    const idx = findClashAPIConfigIndex(getState, { baseURL, secret });
    if (idx === undefined) return;
    dispatch('removeClashAPIConfig', (s) => {
      s.app.clashAPIConfigs.splice(idx, 1);
    });
    // side effect
    saveState(getState().app);
  };
}

export function selectClashAPIConfig({ baseURL, secret }: ClashAPIConfig) {
  return async (dispatch: DispatchFn, getState: GetStateFn) => {
    const idx = findClashAPIConfigIndex(getState, { baseURL, secret });
    if (idx === undefined) return;
    const curr = getSelectedClashAPIConfigIndex(getState());
    if (curr !== idx) {
      dispatch('selectClashAPIConfig', (s) => {
        s.app.selectedClashAPIConfigIndex = idx;
      });
    }
    // side effect
    saveState(getState().app);

    // manual clean up is too complex
    // we just reload the app
    try {
      window.location.reload();
    } catch (err) {
      // ignore
    }
  };
}

// unused
export function updateClashAPIConfig({ baseURL, secret }: ClashAPIConfig) {
  return async (dispatch: DispatchFn, getState: GetStateFn) => {
    const clashAPIConfig = { baseURL, secret };
    dispatch('appUpdateClashAPIConfig', (s) => {
      s.app.clashAPIConfigs[0] = clashAPIConfig;
    });
    // side effect
    saveState(getState().app);
    dispatch(closeModal('apiConfig'));
    dispatch(fetchConfigs(clashAPIConfig));
  };
}

const rootEl = document.querySelector('html');
type ThemeType = 'dark' | 'light' | 'auto';

function setTheme(theme: ThemeType = 'light') {
  if (theme === 'auto') {
    rootEl.setAttribute('data-theme', 'auto');
  } else if (theme === 'dark') {
    rootEl.setAttribute('data-theme', 'dark');
  } else {
    rootEl.setAttribute('data-theme', 'light');
  }
}

export function switchTheme(nextTheme = 'auto') {
  return (dispatch: DispatchFn, getState: GetStateFn) => {
    const currentTheme = getTheme(getState());
    if (currentTheme === nextTheme) return;
    // side effect
    setTheme(nextTheme as ThemeType);
    dispatch('storeSwitchTheme', (s) => {
      s.app.theme = nextTheme;
    });
    // side effect
    saveState(getState().app);
  };
}

export function selectChartStyleIndex(selectedChartStyleIndex: number | string) {
  return (dispatch: DispatchFn, getState: GetStateFn) => {
    dispatch('appSelectChartStyleIndex', (s) => {
      s.app.selectedChartStyleIndex = Number(selectedChartStyleIndex);
    });
    // side effect
    saveState(getState().app);
  };
}

export function updateAppConfig(name: string, value: unknown) {
  return (dispatch: DispatchFn, getState: GetStateFn) => {
    dispatch('appUpdateAppConfig', (s) => {
      s.app[name] = value;
    });
    // side effect
    saveState(getState().app);
  };
}

export function updateCollapsibleIsOpen(prefix: string, name: string, v: boolean) {
  return (dispatch: DispatchFn, getState: GetStateFn) => {
    dispatch('updateCollapsibleIsOpen', (s: State) => {
      s.app.collapsibleIsOpen[`${prefix}:${name}`] = v;
    });
    // side effect
    saveStateDebounced(getState().app);
  };
}

/** 一次性展开/收起同一前缀下的多个分组（代理页的「全部收起 / 全部展开」） */
export function updateCollapsibleIsOpenBulk(prefix: string, names: string[], v: boolean) {
  return (dispatch: DispatchFn, getState: GetStateFn) => {
    dispatch('updateCollapsibleIsOpenBulk', (s: State) => {
      for (const name of names) {
        s.app.collapsibleIsOpen[`${prefix}:${name}`] = v;
      }
    });
    // side effect
    saveStateDebounced(getState().app);
  };
}

const defaultClashAPIConfig = {
  baseURL: document.getElementById('app')?.getAttribute('data-base-url') ?? 'http://127.0.0.1:9090',
  secret: '',
  addedAt: 0,
};
// type Theme = 'light' | 'dark';
const defaultState: StateApp = {
  selectedClashAPIConfigIndex: 0,
  clashAPIConfigs: [defaultClashAPIConfig],

  latencyTestUrl: DEFAULT_LATENCY_TEST_URL,
  latencyTestTimeout: 5000,
  latencyTestExpectedStatus: '',
  preferBackendLatencyTestUrl: true,
  providerHealthcheckTimeout: PROVIDER_HEALTHCHECK_TIMEOUT,
  selectedChartStyleIndex: 0,
  theme: 'auto',

  // type { [string]: boolean }
  collapsibleIsOpen: {},
  // how proxies are sorted in a group or provider
  proxySortBy: 'Natural',
  hideUnavailableProxies: false,
  autoCloseOldConns: true,
  logStreamingPaused: false,
  proxiesLayout: 'double',
  proxyGroupByProvider: false,
};

function parseConfigQueryString() {
  const { search } = window.location;
  const collector: Record<string, string> = {};
  if (typeof search !== 'string' || search === '') return collector;
  const qs = search.replace(/^\?/, '').split('&');
  for (let i = 0; i < qs.length; i++) {
    const [k, v] = qs[i].split('=');
    collector[k] = decodeURIComponent(v);
  }
  return collector;
}

const backendQueryKeys = ['hostname', 'port', 'secret'];

/**
 * 后端相关的 URL 参数只在本次加载生效一次，用完就从地址栏抹掉。
 * 切换后端是靠整页 reload 实现的（见 selectClashAPIConfig），参数留在地址栏
 * 会让每次 reload 都把刚选中的后端改写回参数指定的地址。
 */
function consumeBackendQueryString() {
  try {
    const url = new URL(window.location.href);
    for (const key of backendQueryKeys) url.searchParams.delete(key);
    window.history.replaceState(null, '', url.href);
  } catch (err) {
    // ignore
  }
}

/**
 * 把 URL 参数指定的后端选中：已存在就选它，不存在就新增一条。
 * 不能就地改写当前选中的那条 —— 那会把用户存下来的后端地址覆盖掉。
 */
function applyBackendQueryString(s: StateApp, query: Record<string, string>, isFirstRun: boolean) {
  const curr = s.clashAPIConfigs[s.selectedClashAPIConfigIndex] ?? defaultClashAPIConfig;

  let url: URL;
  try {
    url = new URL(curr.baseURL);
  } catch (err) {
    url = new URL(defaultClashAPIConfig.baseURL);
  }

  if (query.hostname) {
    if (query.hostname.indexOf('http') === 0) {
      url.href = query.hostname;
    } else {
      url.hostname = query.hostname;
    }
  }
  if (query.port) {
    url.port = query.port;
  }

  // url.href is a stringifier and it appends a trailing slash
  // that is not we want
  const baseURL = trimTrailingSlash(url.href);
  // 没给 secret 时只有地址没变才沿用当前的，别把 A 后端的密钥带到 B 后端上
  const secret = query.secret ?? (baseURL === curr.baseURL ? curr.secret : '');

  // 首次访问时列表里只有一条占位的默认后端，直接顶掉，不要留个连不上的空壳
  if (isFirstRun) {
    s.clashAPIConfigs = [{ baseURL, secret, addedAt: Date.now() }];
    s.selectedClashAPIConfigIndex = 0;
  } else {
    const idx = s.clashAPIConfigs.findIndex((x) => x.baseURL === baseURL && x.secret === secret);
    if (idx >= 0) {
      s.selectedClashAPIConfigIndex = idx;
    } else {
      s.clashAPIConfigs.push({ baseURL, secret, addedAt: Date.now() });
      s.selectedClashAPIConfigIndex = s.clashAPIConfigs.length - 1;
    }
  }

  saveState(s);
  consumeBackendQueryString();
}

export function initialState() {
  const persisted = loadState();
  const s: StateApp = { ...defaultState, ...persisted };
  const query = parseConfigQueryString();

  if (backendQueryKeys.some((key) => query[key])) {
    applyBackendQueryString(s, query, !persisted);
  }

  if (query.theme === 'dark' || query.theme === 'light') {
    s.theme = query.theme;
  }
  if (query.title) {
    document.title = decodeURIComponent(query.title);
  }
  // set initial theme
  setTheme(s.theme as ThemeType);
  return s;
}
