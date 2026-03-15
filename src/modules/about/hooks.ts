import { useQuery } from 'react-query';

import { fetchVersion } from '~/api/version';
import { ClashAPIConfig } from '~/types';

export function useAboutVersionQuery(apiConfig: ClashAPIConfig) {
  return useQuery(['/version', apiConfig], () => fetchVersion('/version', apiConfig));
}
