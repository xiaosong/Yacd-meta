import { formatDistance } from 'date-fns';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

import Collapsible from '~/components/shared/Collapsible';
import { RotateIcon } from '~/components/shared/RotateIcon';
import {
  useFilterAwareCollapse,
  useFilteredAndSorted,
  useFilterSegments,
  useUpdateProviderItem,
} from '~/modules/proxies/hooks';
import { matchesFilter } from '~/modules/proxies/utils';
import { healthcheckProviderByName } from '~/store/proxies';
import { useStoreActions } from '~/store/StateProvider';
import { DelayMapping, DispatchFn, ProxiesMapping, SubscriptionInfo } from '~/store/types';
import { ClashAPIConfig } from '~/types';

import { ProxyCard, ProxyCardAction, ProxyCardHeader, ProxyCardStatusRow } from './ProxyCard';
import { ProxyList, ProxyListSummaryView } from './ProxyList';
import s from './ProxyProvider.module.scss';

const { memo, useState, useCallback } = React;

type Props = {
  name: string;
  proxies: Array<string>;
  delay: DelayMapping;
  hideUnavailableProxies: boolean;
  proxySortBy: string;
  type: 'Proxy' | 'Rule';
  vehicleType: 'HTTP' | 'File' | 'Compatible';
  updatedAt?: string;
  subscriptionInfo?: SubscriptionInfo;
  proxyMapping: ProxiesMapping;
  httpsLatencyTest: boolean;
  dispatch: DispatchFn;
  isOpen: boolean;
  apiConfig: ClashAPIConfig;
};

export const ProxyProvider = memo(function ProxyProvider({
  name,
  proxies: all,
  delay,
  hideUnavailableProxies,
  proxySortBy,
  vehicleType,
  updatedAt,
  subscriptionInfo,
  proxyMapping,
  httpsLatencyTest,
  isOpen,
  dispatch,
  apiConfig,
}: Props) {
  const { t } = useTranslation();
  // 提供商名本身命中搜索时，旗下节点原样展示，不再逐个过滤
  const filterSegments = useFilterSegments();
  const nameMatched = matchesFilter(name, filterSegments);
  const proxies = useFilteredAndSorted(
    all,
    delay,
    hideUnavailableProxies,
    proxySortBy,
    undefined,
    nameMatched,
  );
  const [isHealthcheckLoading, setIsHealthcheckLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const updateProviderItem = useUpdateProviderItem({ dispatch, apiConfig, name });
  const updateProvider = useCallback(async () => {
    setIsUpdating(true);
    try {
      await updateProviderItem();
    } catch (err) {}
    setIsUpdating(false);
  }, [updateProviderItem]);

  const healthcheckProvider = useCallback(async () => {
    setIsHealthcheckLoading(true);
    await dispatch(healthcheckProviderByName(apiConfig, name));
    setIsHealthcheckLoading(false);
  }, [apiConfig, dispatch, name]);

  const {
    app: { updateCollapsibleIsOpen },
  } = useStoreActions();

  const onToggle = useCallback(
    (next: boolean) => updateCollapsibleIsOpen('proxyProvider', name, next),
    [updateCollapsibleIsOpen, name],
  );
  const [effectiveIsOpen, toggle] = useFilterAwareCollapse({ isOpen, nameMatched, onToggle });

  const listProps = {
    all: proxies,
    proxies: proxyMapping,
    delay,
    httpsLatencyTest,
    apiConfig,
    dispatch,
  };

  const timeAgo = updatedAt ? formatDistance(new Date(updatedAt), new Date()) : null;
  const used = subscriptionInfo
    ? formatBytes(subscriptionInfo.Download + subscriptionInfo.Upload)
    : null;
  const total = subscriptionInfo ? formatBytes(subscriptionInfo.Total) : null;
  const percentage = subscriptionInfo
    ? (
        ((subscriptionInfo.Download + subscriptionInfo.Upload) / subscriptionInfo.Total) *
        100
      ).toFixed(1)
    : null;

  const expireStr = () => {
    if (!subscriptionInfo || subscriptionInfo.Expire === 0) return null;
    const expire = new Date(subscriptionInfo.Expire * 1000);
    const month = String(expire.getMonth() + 1).padStart(2, '0');
    const date = String(expire.getDate()).padStart(2, '0');
    return `${expire.getFullYear()}-${month}-${date}`;
  };
  const expire = expireStr();

  return (
    <ProxyCard>
      <ProxyCardHeader
        name={name}
        type={vehicleType}
        isOpen={effectiveIsOpen}
        toggle={toggle}
        onTest={healthcheckProvider}
        isTesting={isHealthcheckLoading}
        badges={<span className={s.qtyBadge}>{t('node_qty', { n: proxies.length })}</span>}
        extraActions={
          <ProxyCardAction
            onClick={updateProvider}
            title={t('update_proxy_provider')}
            isBusy={isUpdating}
          >
            <RotateIcon isRotating={isUpdating} />
          </ProxyCardAction>
        }
      />

      <div className={s.meta}>
        {subscriptionInfo ? (
          <span>
            {used} / {total} ({percentage}%)
          </span>
        ) : null}
        {expire ? <span>{t('expire_at', { date: expire })}</span> : null}
        {timeAgo ? <span>{t('updated_ago', { time: timeAgo })}</span> : null}
      </div>

      <ProxyCardStatusRow
        itemCount={proxies.length}
        allItems={all}
        delay={delay}
        renderDots={() => <ProxyListSummaryView {...listProps} />}
      />

      <Collapsible isOpen={effectiveIsOpen}>
        <ProxyList {...listProps} />
      </Collapsible>
    </ProxyCard>
  );
});

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
