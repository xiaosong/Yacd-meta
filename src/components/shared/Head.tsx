import * as React from 'react';

import { getClashAPIConfig, getClashAPIConfigs } from '~/store/app';
import { connect } from '~/store/StateProvider';
import type { State } from '~/store/types';

const mapState = (s: State) => ({
  apiConfig: getClashAPIConfig(s),
  apiConfigs: getClashAPIConfigs(s),
});

function HeadImpl({
  apiConfig,
  apiConfigs,
}: {
  apiConfig: { baseURL: string };
  apiConfigs: any[];
}) {
  React.useEffect(() => {
    let title = 'yacd';
    if (apiConfigs.length > 1) {
      try {
        const host = new URL(apiConfig.baseURL).host;
        title = `${host} - yacd`;
      } catch (e) {
        // ignore
      }
    }
    document.title = title;
  });

  return <></>;
}

export const Head = connect(mapState)(HeadImpl);
