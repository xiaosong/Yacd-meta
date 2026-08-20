import * as React from 'react';
import { useTranslation } from 'react-i18next';

import Collapsible from '~/components/shared/Collapsible';
import { useVersion } from '~/hooks/useVersion';
import {
  useFilterAwareCollapse,
  useFilteredAndSorted,
  useFilterSegments,
} from '~/modules/proxies/hooks';
import { getProxyLatency, matchesFilter } from '~/modules/proxies/utils';
import { switchProxy } from '~/store/proxies';
import { useStoreActions } from '~/store/StateProvider';
import { DelayMapping, DispatchFn, ProxiesMapping, ProxyItem } from '~/store/types';
import { ClashAPIConfig } from '~/types';

import { getLatencyColor, ProxyCard, ProxyCardHeader, ProxyCardStatusRow } from './ProxyCard';
import s0 from './ProxyCard.module.scss';
import { ProxyList, ProxyListGroupedByProvider, ProxyListSummaryView } from './ProxyList';

const { memo, useCallback, useMemo, useState } = React;

function buildNowChain(proxies: ProxiesMapping, groupName: string): string | null {
  const group = proxies[groupName] as ProxyItem & { now?: string };
  if (!group?.now) return null;

  const parts: string[] = [group.now];
  let current = proxies[group.now] as ProxyItem & { now?: string };
  let depth = 0;

  while (current?.now && depth < 3) {
    const next = proxies[current.now];
    if (!next) break;
    parts.push(current.now);
    current = next as ProxyItem & { now?: string };
    depth++;
  }

  return parts.join(' › ');
}

type Props = {
  name: string;
  delay: DelayMapping;
  hideUnavailableProxies: boolean;
  proxySortBy: string;
  proxies: ProxiesMapping;
  isOpen: boolean;
  httpsLatencyTest: boolean;
  apiConfig: ClashAPIConfig;
  dispatch: DispatchFn;
  proxyGroupByProvider?: boolean;
};

export const ProxyGroup = memo(function ProxyGroup({
  name,
  delay,
  hideUnavailableProxies,
  proxySortBy,
  proxies,
  isOpen,
  httpsLatencyTest,
  apiConfig,
  dispatch,
  proxyGroupByProvider = false,
}: Props) {
  const { t } = useTranslation();
  const group = proxies[name] as ProxyItem & { all?: string[]; now?: string; fixed?: string };
  const { all: allItems = [], type, now, fixed } = group || {};
  // 组名本身命中搜索时，整组节点原样展示，不再逐个过滤
  const filterSegments = useFilterSegments();
  const nameMatched = matchesFilter(name, filterSegments);
  const all = useFilteredAndSorted(
    allItems,
    delay,
    hideUnavailableProxies,
    proxySortBy,
    proxies,
    nameMatched,
  );

  const nowChain = useMemo(() => buildNowChain(proxies, name), [proxies, name]);
  const nowLatency = useMemo(
    () => (now ? getProxyLatency(proxies, delay, now) : undefined),
    [proxies, delay, now],
  );
  const nowLatencyColor = getLatencyColor(nowLatency?.number, httpsLatencyTest);

  const version = useVersion(apiConfig);

  const isSelectable = useMemo(
    () => ['Selector', version.meta && 'Fallback', version.meta && 'URLTest'].includes(type),
    [type, version.meta],
  );

  const {
    app: { updateCollapsibleIsOpen },
    proxies: { requestDelayForGroup },
  } = useStoreActions();

  const onToggle = useCallback(
    (next: boolean) => updateCollapsibleIsOpen('proxyGroup', name, next),
    [updateCollapsibleIsOpen, name],
  );
  const [effectiveIsOpen, toggle] = useFilterAwareCollapse({ isOpen, nameMatched, onToggle });

  const itemOnTapCallback = useCallback(
    (proxyName: string) => {
      if (!isSelectable) return;
      dispatch(switchProxy(apiConfig, name, proxyName));
    },
    [apiConfig, dispatch, name, isSelectable],
  );

  const [isTestingLatency, setIsTestingLatency] = useState(false);
  const testLatency = useCallback(async () => {
    setIsTestingLatency(true);
    try {
      await requestDelayForGroup(apiConfig, name, version.meta === true, all);
    } catch (err) {}
    setIsTestingLatency(false);
  }, [all, apiConfig, name, version.meta, requestDelayForGroup]);

  const listProps = {
    apiConfig,
    all,
    delay,
    dispatch,
    httpsLatencyTest,
    now,
    isSelectable,
    itemOnTapCallback,
    proxies,
  };

  return (
    <ProxyCard>
      <ProxyCardHeader
        name={name}
        type={type}
        isOpen={effectiveIsOpen}
        toggle={toggle}
        latency={nowLatency?.number}
        latencyColor={nowLatencyColor}
        onTest={testLatency}
        isTesting={isTestingLatency}
        badges={
          fixed ? (
            <span className={s0.fixedBadge} title={t('group_fixed_tip')}>
              {t('group_fixed')}
            </span>
          ) : null
        }
      />

      <ProxyCardStatusRow
        nowName={nowChain}
        nowColor={nowLatencyColor}
        itemCount={all.length}
        allItems={allItems}
        delay={delay}
        renderDots={() => <ProxyListSummaryView {...listProps} />}
      />

      <Collapsible isOpen={effectiveIsOpen}>
        {proxyGroupByProvider ? (
          <ProxyListGroupedByProvider {...listProps} />
        ) : (
          <ProxyList {...listProps} />
        )}
      </Collapsible>
    </ProxyCard>
  );
});
