import * as React from 'react';

import APIConfig from '~/components/backend/APIConfig';
import {
  addClashAPIConfig,
  getClashAPIConfigs,
  getSelectedClashAPIConfigIndex,
  removeClashAPIConfig,
  selectClashAPIConfig,
  updateClashAPIConfig,
} from '~/store/app';
import { connect } from '~/store/StateProvider';
import type { ClashAPIConfigWithAddedAt, DispatchFn, State } from '~/store/types';
import type { ClashAPIConfig } from '~/types';

const { useCallback } = React;

type Props = {
  dispatch: DispatchFn;
  apiConfigs: ClashAPIConfigWithAddedAt[];
  selectedClashAPIConfigIndex: number;
};

function BackendPage({ dispatch, apiConfigs, selectedClashAPIConfigIndex }: Props) {
  const handleAddConfig = useCallback(
    (config: ClashAPIConfig) => {
      dispatch(addClashAPIConfig(config));
    },
    [dispatch],
  );

  const handleRemoveConfig = useCallback(
    (config: ClashAPIConfig) => {
      dispatch(removeClashAPIConfig(config));
    },
    [dispatch],
  );

  const handleSelectConfig = useCallback(
    (config: ClashAPIConfig) => {
      dispatch(selectClashAPIConfig(config));
    },
    [dispatch],
  );

  const handleUpdateConfig = useCallback(
    (prev: ClashAPIConfig, next: ClashAPIConfig) => {
      dispatch(updateClashAPIConfig(prev, next));
    },
    [dispatch],
  );

  return (
    <APIConfig
      apiConfigs={apiConfigs}
      selectedClashAPIConfigIndex={selectedClashAPIConfigIndex}
      onAddConfig={handleAddConfig}
      onRemoveConfig={handleRemoveConfig}
      onSelectConfig={handleSelectConfig}
      onUpdateConfig={handleUpdateConfig}
    />
  );
}

const mapState = (state: State) => ({
  apiConfigs: getClashAPIConfigs(state),
  selectedClashAPIConfigIndex: getSelectedClashAPIConfigIndex(state),
});

export default connect(mapState)(BackendPage);
