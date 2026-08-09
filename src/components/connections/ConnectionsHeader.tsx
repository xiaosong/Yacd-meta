import cx from 'clsx';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { Pause, Play, Search, Sliders, X } from '~/components/shared/FeatherIcons';
import Select from '~/components/shared/Select';

import s from './ConnectionsHeader.module.scss';

export type ConnTabKey = 'active' | 'closed';

function formatQty(n: number) {
  return n < 1000 ? String(n) : '999+';
}

function Tab({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      className={cx(s.tab, { [s.tabActive]: active })}
      onClick={onClick}
    >
      {label}
      <span className={s.tabCount}>{formatQty(count)}</span>
    </button>
  );
}

type Props = {
  activeTab: ConnTabKey;
  setActiveTab: (tab: ConnTabKey) => void;
  activeCount: number;
  closedCount: number;
  connIpSet: string[][];
  filterSourceIpStr: string;
  setFilterSourceIpStr: (value: string) => void;
  filterKeyword: string;
  setFilterKeyword: (value: string) => void;
  isRefreshPaused: boolean;
  toggleIsRefreshPaused: () => void;
  isFiltering: boolean;
  onCloseFiltered: () => void;
  onCloseAll: () => void;
  onOpenSettings: () => void;
};

export function ConnectionsHeader({
  activeTab,
  setActiveTab,
  activeCount,
  closedCount,
  connIpSet,
  filterSourceIpStr,
  setFilterSourceIpStr,
  filterKeyword,
  setFilterKeyword,
  isRefreshPaused,
  toggleIsRefreshPaused,
  isFiltering,
  onCloseFiltered,
  onCloseAll,
  onOpenSettings,
}: Props) {
  const { t } = useTranslation();

  return (
    <header className={s.header}>
      <h1 className={s.title}>{t('Connections')}</h1>

      <div className={s.tabs} role="tablist" aria-label={t('Connections')}>
        <Tab
          active={activeTab === 'active'}
          label={t('Active')}
          count={activeCount}
          onClick={() => setActiveTab('active')}
        />
        <Tab
          active={activeTab === 'closed'}
          label={t('Closed')}
          count={closedCount}
          onClick={() => setActiveTab('closed')}
        />
      </div>

      <div className={s.actions}>
        <button
          type="button"
          className={cx(s.btn, isRefreshPaused ? s.btnPaused : s.btnGhost)}
          onClick={toggleIsRefreshPaused}
          title={isRefreshPaused ? t('Resume Refresh') : t('Pause Refresh')}
        >
          {isRefreshPaused ? <Play size={14} /> : <Pause size={14} />}
          <span className={s.btnText}>
            {isRefreshPaused ? t('Resume Refresh') : t('Pause Refresh')}
          </span>
        </button>

        {isFiltering ? (
          <button
            type="button"
            className={cx(s.btn, s.btnGhost)}
            onClick={onCloseFiltered}
            title={t('close_filter_connections')}
          >
            <span className={s.btnIconBadged}>
              <X size={14} />
              <span className={s.btnBadge}>F</span>
            </span>
            <span className={s.btnTextSm}>{t('close_filtered')}</span>
          </button>
        ) : null}

        <button
          type="button"
          className={cx(s.btn, s.btnDanger)}
          onClick={onCloseAll}
          title={t('close_all')}
        >
          <X size={14} />
          <span className={s.btnTextSm}>{t('close_all')}</span>
        </button>

        <button
          type="button"
          className={s.iconBtn}
          onClick={onOpenSettings}
          aria-label={t('conn_settings')}
          title={t('conn_settings')}
        >
          <Sliders size={17} />
        </button>
      </div>

      {/* 窄屏下强制换行，让搜索和来源筛选独占第二行 */}
      <span className={s.rowBreak} aria-hidden />

      <div className={s.search}>
        <Search size={15} className={s.searchIcon} aria-hidden />
        <input
          type="text"
          name="filter"
          autoComplete="off"
          value={filterKeyword}
          placeholder={t('search_conns_placeholder')}
          onChange={(e) => setFilterKeyword(e.target.value)}
        />
      </div>

      <Select
        options={connIpSet}
        selected={filterSourceIpStr}
        className={s.sourceSelect}
        aria-label={t('c_source')}
        onChange={(e) => setFilterSourceIpStr(e.target.value)}
      />
    </header>
  );
}
