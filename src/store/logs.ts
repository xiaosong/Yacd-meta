import { atom } from 'jotai';
import { createSelector } from 'reselect';

import { DispatchFn, GetStateFn, Log, State } from '~/store/types';

const LogSize = 300;

const getLogs = (s: State) => s.logs.logs;
const getTail = (s: State) => s.logs.tail;

/** 日志搜索词。过滤在组件里做，见 modules/logs/hooks 的 useFilteredLogs */
export const logFilterText = atom('');

/** 把环形缓冲区按时间顺序摊平 */
export const getLogsForDisplay = createSelector(getLogs, getTail, (logs, tail) => {
  const x = [];
  if (logs.length === LogSize) {
    for (let i = tail + 1; i < LogSize; i++) {
      x.push(logs[i]);
    }
  }
  for (let i = 0; i <= tail; i++) {
    x.push(logs[i]);
  }
  return x;
});

export function clearLogs() {
  return (dispatch: DispatchFn) => {
    dispatch('logsClearLogs', (s) => {
      s.logs.logs = [];
      s.logs.tail = -1;
    });
  };
}

export function appendLog(log: Log) {
  return (dispatch: DispatchFn, getState: GetStateFn) => {
    const s = getState();
    const logs = getLogs(s);
    const tailCurr = getTail(s);
    const tail = tailCurr >= LogSize - 1 ? 0 : tailCurr + 1;
    // mutate intentionally for performance
    logs[tail] = log;

    dispatch('logsAppendLog', (s: State) => {
      s.logs.tail = tail;
    });
  };
}

export const initialState = {
  logs: [],
  // tail's initial value must be -1
  tail: -1,
};
