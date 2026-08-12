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
  type BackendFields,
  type Protocol,
} from './utils';

const { useCallback, useEffect, useMemo, useRef, useState } = React;

export function useBackendConfigForm({
  onAddConfig,
  onUpdateConfig,
}: {
  onAddConfig: (config: ClashAPIConfig) => void;
  onUpdateConfig: (prev: ClashAPIConfig, next: ClashAPIConfig) => void;
}) {
  const [fields, setFields] = useState<BackendFields>(DEFAULT_BACKEND_FIELDS);
  const [secret, setSecret] = useState('');
  const [errMsg, setErrMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // 非 null 时表单是在改这一条已保存的配置，而不是新增
  const [editing, setEditing] = useState<ClashAPIConfig | null>(null);
  // 用户已经动过表单后，自动探测的结果不能再覆盖回去
  const isFormDirty = useRef(false);

  const handleProtocolOnChange = useCallback((protocol: Protocol) => {
    setErrMsg('');
    isFormDirty.current = true;
    setFields((prev) => ({ ...prev, protocol }));
  }, []);

  const handleInputOnChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setErrMsg('');
    isFormDirty.current = true;
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

  const resetForm = useCallback(() => {
    isFormDirty.current = true;
    setEditing(null);
    setFields(DEFAULT_BACKEND_FIELDS);
    setSecret('');
    setErrMsg('');
  }, []);

  const startEdit = useCallback((config: ClashAPIConfig) => {
    const parsed = splitAPIBaseURL(config.baseURL);
    if (!parsed) return;
    isFormDirty.current = true;
    setEditing(config);
    setFields(parsed);
    setSecret(config.secret ?? '');
    setErrMsg('');
  }, []);

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

      if (editing) {
        onUpdateConfig(editing, nextConfig);
        resetForm();
      } else {
        onAddConfig(nextConfig);
      }
    });
  }, [editing, fields, onAddConfig, onUpdateConfig, resetForm, secret]);

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
    [onConfirm],
  );

  useEffect(() => {
    let isCancelled = false;

    detectEmbeddedAPIBaseURL().then((detectedBaseURL) => {
      if (isCancelled || isFormDirty.current || !detectedBaseURL) return;
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
    editing,
    startEdit,
    cancelEdit: resetForm,
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
