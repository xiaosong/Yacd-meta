import { useSuspenseQuery } from '@tanstack/react-query';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

import type { UpgradeChannel } from '~/api/configs';
import * as logsApi from '~/api/logs';
import { fetchVersion } from '~/api/version';
import {
  fetchConfigs,
  flushFakeIPPool,
  reloadConfigFile,
  restartCore,
  updateConfigs,
  upgradeCore,
  upgradeGeo,
  upgradeUI,
} from '~/store/configs';
import { openModal } from '~/store/modals';
import { toast } from '~/store/toast';
import { ClashGeneralConfig, DispatchFn } from '~/store/types';
import { ClashAPIConfig } from '~/types';

const { useCallback, useEffect, useRef, useState } = React;

type UpdateAppConfigFn = (name: string, value: unknown) => void;

function useConfigVersionQuery(apiConfig: ClashAPIConfig) {
  return useSuspenseQuery({
    queryKey: ['/version', apiConfig],
    queryFn: () => fetchVersion('/version', apiConfig),
  });
}

export function useConfigState(configs: ClashGeneralConfig) {
  const [configState, setConfigStateInternal] = useState(configs);
  const refConfigs = useRef(configs);

  useEffect(() => {
    if (refConfigs.current !== configs) {
      setConfigStateInternal(configs);
    }
    refConfigs.current = configs;
  }, [configs]);

  const setConfigState = useCallback((name: string, value: any) => {
    setConfigStateInternal((prev) => ({ ...prev, [name]: value }));
  }, []);

  const setTunConfigState = useCallback((name: string, value: any) => {
    setConfigStateInternal((prev) => ({
      ...prev,
      tun: { ...prev.tun, [name]: value },
    }));
  }, []);

  return {
    configState,
    setConfigState,
    setTunConfigState,
  };
}

export function useConfigPage({
  apiConfig,
  configs,
  dispatch,
  updateAppConfig,
}: {
  apiConfig: ClashAPIConfig;
  configs: ClashGeneralConfig;
  dispatch: DispatchFn;
  updateAppConfig: UpdateAppConfigFn;
}) {
  const { t } = useTranslation();

  useEffect(() => {
    dispatch(fetchConfigs(apiConfig));
  }, [apiConfig, dispatch]);

  const { configState, setConfigState, setTunConfigState } = useConfigState(configs);
  const versionQuery = useConfigVersionQuery(apiConfig);

  const openAPIConfigModal = useCallback(() => {
    dispatch(openModal('apiConfig'));
  }, [dispatch]);

  const handleInputOnChange = useCallback(
    ({ name, value }: { name: string; value: any }) => {
      switch (name) {
        case 'mode':
        case 'log-level':
        case 'allow-lan':
        case 'sniffing':
          setConfigState(name, value);
          dispatch(updateConfigs(apiConfig, { [name]: value }));
          if (name === 'log-level') {
            logsApi.reconnect({ ...apiConfig, logLevel: value });
          }
          break;
        case 'mitm-port':
        case 'redir-port':
        case 'socks-port':
        case 'mixed-port':
        case 'port':
          if (value !== '') {
            const num = parseInt(value, 10);
            if (num < 0 || num > 65535) return;
          }
          setConfigState(name, value);
          break;
        case 'enable':
        case 'stack':
          setTunConfigState(name, value);
          dispatch(updateConfigs(apiConfig, { tun: { [name]: value } }));
          break;
        default:
          return;
      }
    },
    [apiConfig, dispatch, setConfigState, setTunConfigState]
  );

  const handleInputOnBlur = useCallback(
    (
      e:
        | React.FocusEvent<HTMLSelectElement | HTMLInputElement>
        | React.ChangeEvent<HTMLSelectElement | HTMLInputElement>
    ) => {
      const { name, value } = e.target;

      switch (name) {
        case 'port':
        case 'socks-port':
        case 'mixed-port':
        case 'redir-port':
        case 'mitm-port': {
          const num = parseInt(value, 10);
          if (num < 0 || num > 65535) return;
          dispatch(updateConfigs(apiConfig, { [name]: num }));
          break;
        }
        case 'latencyTestUrl':
          updateAppConfig(name, value);
          break;
        case 'device name':
        case 'interface name':
          break;
        default:
          throw new Error(`unknown input name ${name}`);
      }
    },
    [apiConfig, dispatch, updateAppConfig]
  );

  const handleReloadConfigFile = useCallback(() => {
    dispatch(reloadConfigFile(apiConfig));
  }, [apiConfig, dispatch]);

  const handleRestartCore = useCallback(() => {
    dispatch(restartCore(apiConfig));
  }, [apiConfig, dispatch]);

  // 正在更新的通道，null 表示空闲；同时用来给两个按钮做 loading / 互斥
  const [upgradingChannel, setUpgradingChannel] = useState<UpgradeChannel | null>(null);

  const handleUpgradeCore = useCallback(
    async (channel: UpgradeChannel) => {
      if (upgradingChannel !== null) return;
      setUpgradingChannel(channel);
      const result = await dispatch(upgradeCore(apiConfig, channel));
      setUpgradingChannel(null);
      if (result.ok) {
        toast('success', t('upgrade_core_success'));
      } else {
        toast('error', t('upgrade_core_failed', { message: result.message }));
      }
    },
    [apiConfig, dispatch, t, upgradingChannel]
  );

  const handleUpgradeGeo = useCallback(() => {
    dispatch(upgradeGeo(apiConfig));
  }, [apiConfig, dispatch]);

  const handleUpgradeUI = useCallback(() => {
    dispatch(upgradeUI(apiConfig));
  }, [apiConfig, dispatch]);

  const handleFlushFakeIPPool = useCallback(() => {
    dispatch(flushFakeIPPool(apiConfig));
  }, [apiConfig, dispatch]);

  return {
    configState,
    openAPIConfigModal,
    handleInputOnChange,
    handleInputOnBlur,
    handleReloadConfigFile,
    handleRestartCore,
    handleUpgradeCore,
    upgradingChannel,
    handleUpgradeGeo,
    handleUpgradeUI,
    handleFlushFakeIPPool,
    versionQuery,
  };
}
