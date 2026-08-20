import { useAtom } from 'jotai';
import * as React from 'react';

import {
  fetchProxies,
  NonProxyTypes,
  proxyFilterText,
  requestDelayAll,
  updateProviderByName,
  updateProviders,
} from '~/store/proxies';
import { useStoreActions } from '~/store/StateProvider';
import {
  DelayMapping,
  DispatchFn,
  FormattedProxyProvider,
  ProxiesMapping,
  ProxyItem,
} from '~/store/types';
import { ClashAPIConfig } from '~/types';

import { matchesFilter, parseFilterSegments, splitItemsByLayout } from './utils';

const { useCallback, useEffect, useMemo, useRef, useState } = React;

function filterAvailableProxies(list: string[], delay: DelayMapping) {
  return list.filter((name) => {
    const d = delay[name];
    if (d === undefined) {
      return true;
    }
    if (d.number === 0) {
      return false;
    }
    return true;
  });
}

const getSortDelay = (
  d:
    | undefined
    | {
        number?: number;
      },
  proxyInfo?: ProxyItem,
) => {
  if (d && typeof d.number === 'number' && d.number > 0) {
    return d.number;
  }

  const type = proxyInfo && proxyInfo.type;
  if (type && NonProxyTypes.indexOf(type) > -1) return -1;

  return 999999;
};

const ProxySortingFns = {
  Natural: (proxies: string[]) => proxies,
  LatencyAsc: (proxies: string[], delay: DelayMapping, proxyMapping?: ProxiesMapping) => {
    return proxies.sort((a, b) => {
      const d1 = getSortDelay(delay[a], proxyMapping && proxyMapping[a]);
      const d2 = getSortDelay(delay[b], proxyMapping && proxyMapping[b]);
      return d1 - d2;
    });
  },
  LatencyDesc: (proxies: string[], delay: DelayMapping, proxyMapping?: ProxiesMapping) => {
    return proxies.sort((a, b) => {
      const d1 = getSortDelay(delay[a], proxyMapping && proxyMapping[a]);
      const d2 = getSortDelay(delay[b], proxyMapping && proxyMapping[b]);
      return d2 - d1;
    });
  },
  NameAsc: (proxies: string[]) => {
    return proxies.sort();
  },
  NameDesc: (proxies: string[]) => {
    return proxies.sort((a, b) => {
      if (a > b) return -1;
      if (a < b) return 1;
      return 0;
    });
  },
};

type ProxySortBy = keyof typeof ProxySortingFns;

function filterAvailableProxiesAndSort(
  all: string[],
  delay: DelayMapping,
  hideUnavailableProxies: boolean,
  segments: string[],
  proxySortBy: string,
  proxies?: ProxiesMapping,
) {
  let filtered = [...all];
  if (hideUnavailableProxies) {
    filtered = filterAvailableProxies(all, delay);
  }

  if (segments.length > 0) {
    filtered = filtered.filter((name) => matchesFilter(name, segments));
  }
  // proxySortBy 来自 localStorage，可能是旧版本留下的、已经不存在的排序名
  const sortFn = ProxySortingFns[proxySortBy as ProxySortBy] ?? ProxySortingFns.Natural;
  return sortFn(filtered, delay, proxies);
}

const EMPTY_SEGMENTS: string[] = [];

/** 搜索框当前的分词，空数组表示没有搜索 */
export function useFilterSegments(): string[] {
  const [filterText] = useAtom(proxyFilterText);
  return useMemo(() => parseFilterSegments(filterText), [filterText]);
}

export function useFilteredAndSorted(
  all: string[],
  delay: DelayMapping,
  hideUnavailableProxies: boolean,
  proxySortBy: string,
  proxies?: ProxiesMapping,
  /** 组名本身命中搜索时，组内节点就不再过滤，整组原样展示 */
  skipTextFilter = false,
) {
  const segments = useFilterSegments();
  const effectiveSegments = skipTextFilter ? EMPTY_SEGMENTS : segments;
  return useMemo(
    () =>
      filterAvailableProxiesAndSort(
        all,
        delay,
        hideUnavailableProxies,
        effectiveSegments,
        proxySortBy,
        proxies,
      ),
    [all, delay, hideUnavailableProxies, effectiveSegments, proxySortBy, proxies],
  );
}

/** 代理组：组名命中，或组内有节点命中，才留在列表里 */
export function useVisibleGroupNames(groupNames: string[], proxies: ProxiesMapping): string[] {
  const segments = useFilterSegments();
  return useMemo(() => {
    if (segments.length === 0) return groupNames;
    return groupNames.filter((name) => {
      if (matchesFilter(name, segments)) return true;
      const group = proxies[name] as (ProxyItem & { all?: string[] }) | undefined;
      return (group?.all ?? []).some((n) => matchesFilter(n, segments));
    });
  }, [groupNames, proxies, segments]);
}

/** 提供商：同上，名称命中或旗下有节点命中 */
export function useVisibleProviders(providers: FormattedProxyProvider[]): FormattedProxyProvider[] {
  const segments = useFilterSegments();
  return useMemo(() => {
    if (segments.length === 0) return providers;
    return providers.filter(
      (p) => matchesFilter(p.name, segments) || p.proxies.some((n) => matchesFilter(n, segments)),
    );
  }, [providers, segments]);
}

/**
 * 搜索时，仅因为「组内节点命中」才留下来的卡片会自动展开——否则只能看到一排
 * 圆点，还得手动点开才能看见搜到的节点。用户手动收起时用本地 override 记下来，
 * 不写进持久化的折叠状态；搜索词一变就重置。
 */
export function useFilterAwareCollapse({
  isOpen,
  nameMatched,
  onToggle,
}: {
  isOpen: boolean;
  nameMatched: boolean;
  onToggle: (next: boolean) => void;
}): [boolean, () => void] {
  const segments = useFilterSegments();
  const [collapseOverride, setCollapseOverride] = useState(false);

  useEffect(() => {
    setCollapseOverride(false);
  }, [segments]);

  const forceOpen = segments.length > 0 && !nameMatched && !collapseOverride;
  const effectiveIsOpen = isOpen || forceOpen;

  const toggle = useCallback(() => {
    if (forceOpen) {
      setCollapseOverride(true);
      return;
    }
    onToggle(!effectiveIsOpen);
  }, [forceOpen, effectiveIsOpen, onToggle]);

  return [effectiveIsOpen, toggle];
}

export function useUpdateProviderItem({
  dispatch,
  apiConfig,
  name,
}: {
  dispatch: DispatchFn;
  apiConfig: ClashAPIConfig;
  name: string;
}) {
  return useCallback(
    () => dispatch(updateProviderByName(apiConfig, name)),
    [apiConfig, dispatch, name],
  );
}

export function useUpdateProviderItems({
  dispatch,
  apiConfig,
  names,
}: {
  dispatch: DispatchFn;
  apiConfig: ClashAPIConfig;
  names: string[];
}): [() => unknown, boolean] {
  const [isLoading, setIsLoading] = useState(false);

  const action = useCallback(async () => {
    if (isLoading) {
      return;
    }

    setIsLoading(true);
    try {
      await dispatch(updateProviders(apiConfig, names));
    } catch (e) {
      // ignore
    }
    setIsLoading(false);
  }, [apiConfig, dispatch, names, isLoading]);

  return [action, isLoading];
}

export function useTestLatencyAction({
  dispatch,
  apiConfig,
}: {
  dispatch: DispatchFn;
  apiConfig: ClashAPIConfig;
}): [() => unknown, boolean] {
  const [isTestingLatency, setIsTestingLatency] = useState(false);
  const requestDelayAllFn = useCallback(() => {
    if (isTestingLatency) return;

    setIsTestingLatency(true);
    dispatch(requestDelayAll(apiConfig)).then(
      () => setIsTestingLatency(false),
      () => setIsTestingLatency(false),
    );
  }, [apiConfig, dispatch, isTestingLatency]);
  return [requestDelayAllFn, isTestingLatency];
}

export function useProxiesPage({
  dispatch,
  apiConfig,
  groupNames,
  proxyProviders,
  proxiesLayout,
}: {
  dispatch: DispatchFn;
  apiConfig: ClashAPIConfig;
  groupNames: string[];
  proxyProviders: FormattedProxyProvider[];
  proxiesLayout: string;
}) {
  const refFetchedTimestamp = useRef<{ startAt?: number; completeAt?: number }>({});

  const fetchProxiesHooked = useCallback(() => {
    refFetchedTimestamp.current.startAt = Date.now();
    dispatch(fetchProxies(apiConfig)).then(() => {
      refFetchedTimestamp.current.completeAt = Date.now();
    });
  }, [apiConfig, dispatch]);

  useEffect(() => {
    fetchProxiesHooked();

    const fn = () => {
      if (
        refFetchedTimestamp.current.startAt &&
        Date.now() - refFetchedTimestamp.current.startAt > 3e4
      ) {
        fetchProxiesHooked();
      }
    };
    window.addEventListener('focus', fn, false);
    return () => window.removeEventListener('focus', fn, false);
  }, [fetchProxiesHooked]);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const closeSettings = useCallback(() => {
    setIsSettingsOpen(false);
  }, []);
  const toggleSettings = useCallback(() => {
    setIsSettingsOpen((v) => !v);
  }, []);

  const [activeTab, setActiveTab] = useState<'proxies' | 'providers'>('proxies');

  const proxyGroups = useMemo(() => {
    const formatted = groupNames.map((name, i) => ({ name, i }));
    return splitItemsByLayout(formatted, proxiesLayout);
  }, [groupNames, proxiesLayout]);

  const providers = useMemo(() => {
    const formatted = proxyProviders.map((item, i) => ({ item, i }));
    return splitItemsByLayout(formatted, proxiesLayout);
  }, [proxyProviders, proxiesLayout]);

  return {
    isSettingsOpen,
    toggleSettings,
    closeSettings,
    activeTab,
    setActiveTab,
    proxyGroups,
    providers,
  };
}

/**
 * 「全部收起 / 全部展开」：只要当前标签页下还有展开的分组就收起全部，
 * 全部已收起时再点则展开全部。
 */
export function useCollapseAll({
  prefix,
  names,
  collapsibleIsOpen,
}: {
  prefix: string;
  names: string[];
  collapsibleIsOpen: Record<string, boolean>;
}): [() => void, boolean] {
  const {
    app: { updateCollapsibleIsOpenBulk },
  } = useStoreActions();

  const allCollapsed = useMemo(
    () => !names.some((name) => collapsibleIsOpen[`${prefix}:${name}`]),
    [names, collapsibleIsOpen, prefix],
  );

  const toggleAll = useCallback(() => {
    updateCollapsibleIsOpenBulk(prefix, names, allCollapsed);
  }, [updateCollapsibleIsOpenBulk, prefix, names, allCollapsed]);

  return [toggleAll, allCollapsed];
}
