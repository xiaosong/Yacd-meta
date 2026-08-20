import { createSelector } from 'reselect';

import Proxies from '~/components/proxies/Proxies';
import {
  getAutoCloseOldConns,
  getClashAPIConfig,
  getCollapsibleIsOpen,
  getHideUnavailableProxies,
  getLatencyTestExpectedStatus,
  getLatencyTestTimeout,
  getLatencyTestUrl,
  getPreferBackendLatencyTestUrl,
  getProviderHealthcheckTimeout,
  getProxiesLayout,
  getProxyGroupByProvider,
  getProxySortBy,
} from '~/store/app';
import {
  getDelay,
  getProxies,
  getProxyGroupNames,
  getProxyProviders,
  getShowModalClosePrevConns,
} from '~/store/proxies';
import { connect } from '~/store/StateProvider';
import { State } from '~/store/types';

const getAppConfig = createSelector(
  getProxySortBy,
  getHideUnavailableProxies,
  getAutoCloseOldConns,
  getProxiesLayout,
  getProxyGroupByProvider,
  getLatencyTestUrl,
  getLatencyTestTimeout,
  getLatencyTestExpectedStatus,
  getPreferBackendLatencyTestUrl,
  getProviderHealthcheckTimeout,
  (
    proxySortBy,
    hideUnavailableProxies,
    autoCloseOldConns,
    proxiesLayout,
    proxyGroupByProvider,
    latencyTestUrl,
    latencyTestTimeout,
    latencyTestExpectedStatus,
    preferBackendLatencyTestUrl,
    providerHealthcheckTimeout,
  ) => ({
    proxySortBy,
    hideUnavailableProxies,
    autoCloseOldConns,
    proxiesLayout,
    proxyGroupByProvider,
    latencyTestUrl,
    latencyTestTimeout,
    latencyTestExpectedStatus,
    preferBackendLatencyTestUrl,
    providerHealthcheckTimeout,
  }),
);

const mapState = (state: State) => ({
  apiConfig: getClashAPIConfig(state),
  groupNames: getProxyGroupNames(state),
  proxies: getProxies(state),
  proxyProviders: getProxyProviders(state),
  delay: getDelay(state),
  collapsibleIsOpen: getCollapsibleIsOpen(state),
  showModalClosePrevConns: getShowModalClosePrevConns(state),
  appConfig: getAppConfig(state),
});

export default connect(mapState)(Proxies);
