import * as React from 'react';
import { useTranslation } from 'react-i18next';

import ContentHeader from '~/components/ContentHeader';
import { ProxyProvider } from '~/components/proxies/ProxyProvider';
import { FormattedProxyProvider } from '~/store/types';

export function ProxyProviderList({ items }: { items: FormattedProxyProvider[] }) {
  const { t } = useTranslation();
  if (items.length === 0) return null;
  return (
    <>
      <ContentHeader title={t('proxy_provider')} />
      <div>
        {items.map((item) => (
          <ProxyProvider
            key={item.name}
            name={item.name}
            proxies={item.proxies}
            type={item.type}
            vehicleType={item.vehicleType}
            updatedAt={item.updatedAt}
            subscriptionInfo={item.subscriptionInfo}
          />
        ))}
      </div>
    </>
  );
}
