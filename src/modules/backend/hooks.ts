import * as React from 'react';

import { fetchConfigs } from '~/store/configs';
import { closeModal } from '~/store/modals';
import type { DispatchFn } from '~/store/types';
import type { ClashAPIConfig } from '~/types';

import {
  buildAPIBaseURL,
  DEFAULT_BACKEND_FIELDS,
  detectEmbeddedAPIBaseURL,
  splitAPIBaseURL,
  splitPastedHost,
  verifyAPIConfig,
} from './utils';

import type { BackendFields, Protocol } from './utils';

const { useCallback, useEffect, useMemo, useState } = React;

export function useBackendConfigForm({
  onAddConfig,
}: {
  onAddConfig: (config: ClashAPIConfig) => void;
}) {
  const [fields, setFields] = useState<BackendFields>(DEFAULT_BACKEND_FIELDS);
  const [secret, setSecret] = useState('');
  const [errMsg, setErrMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleProtocolOnChange = useCallback((protocol: Protocol) => {
    setErrMsg('');
    setFields((prev) => ({ ...prev, protocol }));
  }, []);

  const handleInputOnChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setErrMsg('');
    const { name, value } = e.target;

    switch (name) {
      case 'host': {
        // 整条地址粘进来时自动拆分，省得用户手动删协议和端口
        const pasted = splitPastedHost(value);
        setFields((prev) => (pasted ? { ...prev, ...pasted } : { ...prev, host: value }));
        break;
      }
      case 'port':
        setFields((prev) => ({ ...prev, port: value }));
        break;
      case 'secret':
        setSecret(value);
        break;
      default:
        throw new Error(`unknown input name ${name}`);
    }
  }, []);

  const baseURLPreview = useMemo(() => {
    const built = buildAPIBaseURL(fields);
    return 'baseURL' in built ? built.baseURL : '';
  }, [fields]);

  const onConfirm = useCallback(() => {
    const built = buildAPIBaseURL(fields);
    if ('error' in built) {
      setErrMsg(built.error);
      return;
    }

    const nextConfig = { baseURL: built.baseURL, secret };
    setIsSubmitting(true);
    verifyAPIConfig(nextConfig).then(([status, message]) => {
      setIsSubmitting(false);
      if (status !== 0) {
        setErrMsg(message ?? 'Failed to connect');
        return;
      }

      onAddConfig(nextConfig);
    });
  }, [fields, onAddConfig, secret]);

  const handleContentOnKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (
        e.target instanceof Element &&
        (!e.target.tagName || e.target.tagName.toUpperCase() !== 'INPUT')
      ) {
        return;
      }

      if (e.key !== 'Enter') return;

      onConfirm();
    },
    [onConfirm]
  );

  useEffect(() => {
    let isCancelled = false;

    detectEmbeddedAPIBaseURL().then((detectedBaseURL) => {
      if (isCancelled || !detectedBaseURL) return;
      const detected = splitAPIBaseURL(detectedBaseURL);
      if (detected) setFields(detected);
    });

    return () => {
      isCancelled = true;
    };
  }, []);

  return {
    ...fields,
    secret,
    errMsg,
    baseURLPreview,
    isSubmitting,
    handleProtocolOnChange,
    handleInputOnChange,
    handleContentOnKeyDown,
    onConfirm,
  };
}

export function useBackendDiscovery({
  apiConfig,
  dispatch,
}: {
  apiConfig: ClashAPIConfig;
  dispatch: DispatchFn;
}) {
  const closeAPIConfigModal = useCallback(() => {
    dispatch(closeModal('apiConfig'));
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchConfigs(apiConfig));
  }, [apiConfig, dispatch]);

  return {
    closeAPIConfigModal,
  };
}
