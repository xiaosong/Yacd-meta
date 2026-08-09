import { useAtom } from 'jotai';
import * as React from 'react';

import { fetchLogs, reconnect as reconnectLogs, stop as stopLogs } from '~/api/logs';
import { appendLog, logFilterText } from '~/store/logs';
import { DispatchFn, Log } from '~/store/types';
import { ClashAPIConfig } from '~/types';

import { LOGS_SCROLL_BOTTOM_THRESHOLD } from './utils';

const { useCallback, useEffect, useMemo, useRef, useState } = React;

type UpdateAppConfigFn = (name: string, value: unknown) => void;

/** 搜索词是防抖过的，过滤结果缓存住，免得每条新日志进来都重扫一遍 */
export function useFilteredLogs(logs: Log[]) {
  const [filterText] = useAtom(logFilterText);
  return useMemo(() => {
    if (filterText === '') return logs;
    const f = filterText.toLowerCase();
    return logs.filter((log) => log.payload.toLowerCase().indexOf(f) >= 0);
  }, [logs, filterText]);
}

export function useLogsPage({
  dispatch,
  logLevel,
  apiConfig,
  logs,
  logStreamingPaused,
  updateAppConfig,
}: {
  dispatch: DispatchFn;
  logLevel: string;
  apiConfig: ClashAPIConfig;
  logs: Log[];
  logStreamingPaused: boolean;
  updateAppConfig: UpdateAppConfigFn;
}) {
  const toggleIsRefreshPaused = useCallback(() => {
    logStreamingPaused ? reconnectLogs({ ...apiConfig, logLevel }) : stopLogs();
    updateAppConfig('logStreamingPaused', !logStreamingPaused);
  }, [apiConfig, logLevel, logStreamingPaused, updateAppConfig]);

  const appendLogInternal = useCallback((log) => dispatch(appendLog(log)), [dispatch]);

  useEffect(() => {
    const unsubscribe = fetchLogs({ ...apiConfig, logLevel }, appendLogInternal);
    return () => {
      unsubscribe?.();
    };
  }, [apiConfig, logLevel, appendLogInternal]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  // 贴着底看的时候才自动跟随，用户往回翻了就别抢滚动位置
  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom();
    }
  }, [logs, isAtBottom, scrollToBottom]);

  const onScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const atBottom = scrollHeight - scrollTop - clientHeight < LOGS_SCROLL_BOTTOM_THRESHOLD;
    setIsAtBottom(atBottom);
  }, []);

  return {
    toggleIsRefreshPaused,
    scrollRef,
    isAtBottom,
    scrollToBottom,
    onScroll,
  };
}
