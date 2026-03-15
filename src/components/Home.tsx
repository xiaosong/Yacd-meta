import React from 'react';

import { ClashAPIConfig } from '~/types';

import ContentHeader from './ContentHeader';
import s0 from './Home.module.scss';
import TrafficNow from './TrafficNow';

type Props = {
  apiConfig: ClashAPIConfig;
  selectedChartStyleIndex: number;
};

export default function Home({ apiConfig, selectedChartStyleIndex }: Props) {
  return (
    <div>
      <ContentHeader />
      <div className={s0.root}>
        <TrafficNow apiConfig={apiConfig} selectedChartStyleIndex={selectedChartStyleIndex} />
      </div>
    </div>
  );
}
