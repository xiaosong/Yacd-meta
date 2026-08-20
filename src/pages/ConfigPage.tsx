import Config from '~/components/config/Config';
import { getClashAPIConfig, getSelectedChartStyleIndex } from '~/store/app';
import { getConfigs } from '~/store/configs';
import { connect } from '~/store/StateProvider';
import { State } from '~/store/types';

const mapState = (state: State) => ({
  configs: getConfigs(state),
  selectedChartStyleIndex: getSelectedChartStyleIndex(state),
  apiConfig: getClashAPIConfig(state),
});

export default connect(mapState)(Config);
