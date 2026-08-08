import cx from 'clsx';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { Search, Sliders } from '~/components/shared/FeatherIcons';
import { Popover } from '~/components/shared/Popover';
import { RotateIcon } from '~/components/shared/RotateIcon';
import { TextFilter } from '~/components/shared/TextFitler';
import { formatQty } from '~/modules/proxies/utils';
import { proxyFilterText } from '~/store/proxies';

import s from './ProxiesHeader.module.scss';
import Settings from './Settings';

type AppConfig = React.ComponentProps<typeof Settings>['appConfig'];

type TabKey = 'proxies' | 'providers';

type Props = {
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
  handleTabKeyDown: (tab: TabKey) => (e: React.KeyboardEvent) => void;
  /** 搜索后可见的代理组数 */
  groupCount: number;
  /** 提供商总数，决定标签是否出现（搜索时标签不该消失） */
  providerCount: number;
  /** 搜索后可见的提供商数，只影响标签上的计数 */
  visibleProviderCount: number;
  appConfig: AppConfig;
  isSettingsOpen: boolean;
  toggleSettings: () => void;
  closeSettings: () => void;
  onToggleCollapseAll: () => void;
  allCollapsed: boolean;
  onTestAll: () => void;
  isTestingLatency: boolean;
  onUpdateAllProviders: () => void;
  isUpdatingProviders: boolean;
};

function Tab({
  active,
  label,
  count,
  onClick,
  onKeyDown,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      className={cx(s.tab, { [s.tabActive]: active })}
      onClick={onClick}
      onKeyDown={onKeyDown}
    >
      {label}
      <span className={s.tabCount}>{formatQty(count)}</span>
    </button>
  );
}

export function ProxiesHeader({
  activeTab,
  setActiveTab,
  handleTabKeyDown,
  groupCount,
  providerCount,
  visibleProviderCount,
  appConfig,
  isSettingsOpen,
  toggleSettings,
  closeSettings,
  onToggleCollapseAll,
  allCollapsed,
  onTestAll,
  isTestingLatency,
  onUpdateAllProviders,
  isUpdatingProviders,
}: Props) {
  const { t } = useTranslation();

  return (
    <header className={s.header}>
      <h1 className={s.title}>{t('Proxies')}</h1>

      <div className={s.tabs} role="tablist" aria-label={t('Proxies')}>
        <Tab
          active={activeTab === 'proxies'}
          label={t('proxy_groups')}
          count={groupCount}
          onClick={() => setActiveTab('proxies')}
          onKeyDown={handleTabKeyDown('proxies')}
        />
        {providerCount > 0 ? (
          <Tab
            active={activeTab === 'providers'}
            label={t('providers')}
            count={visibleProviderCount}
            onClick={() => setActiveTab('providers')}
            onKeyDown={handleTabKeyDown('providers')}
          />
        ) : null}
      </div>

      <div className={s.search}>
        <Search size={15} className={s.searchIcon} aria-hidden />
        <TextFilter textAtom={proxyFilterText} placeholder={t('search_proxies_placeholder')} />
      </div>

      <div className={s.actions}>
        {activeTab === 'providers' && providerCount > 0 ? (
          <button
            type="button"
            className={cx(s.btn, s.btnGhost)}
            onClick={onUpdateAllProviders}
            title={t('update_all_proxy_provider')}
          >
            <RotateIcon isRotating={isUpdatingProviders} />
            <span className={s.btnText}>{t('update_all')}</span>
          </button>
        ) : null}

        <button type="button" className={cx(s.btn, s.btnGhost)} onClick={onToggleCollapseAll}>
          {allCollapsed ? t('expand_all') : t('collapse_all')}
        </button>

        <button
          type="button"
          className={cx(s.btn, s.btnPrimary, { [s.btnBusy]: isTestingLatency })}
          onClick={onTestAll}
          disabled={isTestingLatency}
        >
          {isTestingLatency ? t('testing') : t('test_all')}
        </button>

        <Popover
          isOpen={isSettingsOpen}
          onClose={closeSettings}
          label={t('settings')}
          trigger={
            <button
              type="button"
              className={cx(s.iconBtn, { [s.iconBtnActive]: isSettingsOpen })}
              onClick={toggleSettings}
              aria-label={t('settings')}
              aria-expanded={isSettingsOpen}
            >
              <Sliders size={17} />
            </button>
          }
        >
          <Settings appConfig={appConfig} />
        </Popover>
      </div>
    </header>
  );
}
