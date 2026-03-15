import cx from 'clsx';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { areEqual, VariableSizeList } from 'react-window';

import ContentHeader from '~/components/ContentHeader';
import { RuleProviderItem } from '~/components/rules/RuleProviderItem';
import { RulesPageFab } from '~/components/rules/RulesPageFab';
import { TextFilter } from '~/components/shared/TextFitler';
import { useRulesPage } from '~/modules/rules/hooks';
import { formatQty, getItemSizeFactory, itemKey, RulesListItemData } from '~/modules/rules/utils';
import { ruleFilterText } from '~/store/rules';
import { ClashAPIConfig } from '~/types';

import useRemainingViewPortHeight from '../hooks/useRemainingViewPortHeight';

import Rule from './Rule';
import s from './Rules.module.scss';

const { memo } = React;

// @ts-expect-error ts-migrate(2339) FIXME: Property 'index' does not exist on type '{ childre... Remove this comment to see the full error message
const Row = memo(({ index, style, data }) => {
  const { rules, provider, apiConfig } = data;

  if (!rules) {
    const name = provider.names[index];
    const item = provider.byName[name];
    return (
      <div style={style} className={s.RuleProviderItemWrapper}>
        <RuleProviderItem apiConfig={apiConfig} {...item} />
      </div>
    );
  }

  const r = rules[index];
  return (
    <div style={style}>
      <Rule {...r} />
    </div>
  );
}, areEqual);

type RulesProps = {
  apiConfig: ClashAPIConfig;
};

export default function Rules({ apiConfig }: RulesProps) {
  const [refRulesContainer, containerHeight] = useRemainingViewPortHeight();
  const { rules, provider, activeTab, setActiveTab, isRulesTab, handleTabKeyDown } =
    useRulesPage(apiConfig);
  const getItemSize = getItemSizeFactory({ isRulesTab });

  const { t } = useTranslation();

  return (
    <div className={s.container}>
      <ContentHeader>
        <div className={s.tabsContainer}>
          <div
            className={cx(s.tab, { [s.active]: activeTab === 'rules' })}
            onClick={() => setActiveTab('rules')}
            onKeyDown={handleTabKeyDown('rules')}
            role="button"
            tabIndex={0}
          >
            {t('Rules')}
            <span className={s.tabCount}>{formatQty(rules.length)}</span>
          </div>
          {provider.names.length > 0 && (
            <div
              className={cx(s.tab, { [s.active]: activeTab === 'providers' })}
              onClick={() => setActiveTab('providers')}
              onKeyDown={handleTabKeyDown('providers')}
              role="button"
              tabIndex={0}
            >
              {t('rule_provider')}
              <span className={s.tabCount}>{formatQty(provider.names.length)}</span>
            </div>
          )}
        </div>
        <div style={{ flex: 1 }} />
        <div className={s.filterWrapper}>
          <TextFilter textAtom={ruleFilterText} placeholder={t('Search')} />
        </div>
      </ContentHeader>
      <div ref={refRulesContainer} className={s.listWrapper}>
        <VariableSizeList
          height={containerHeight}
          width="100%"
          itemCount={isRulesTab ? rules.length : provider.names.length}
          itemSize={getItemSize}
          itemData={{ rules: isRulesTab ? rules : null, provider, apiConfig } as RulesListItemData}
          itemKey={itemKey}
        >
          {Row}
        </VariableSizeList>
      </div>
      {provider && provider.names && provider.names.length > 0 ? (
        <RulesPageFab apiConfig={apiConfig} />
      ) : null}
    </div>
  );
}
