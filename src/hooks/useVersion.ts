import { useSuspenseQuery } from '@tanstack/react-query';

import { fetchVersion } from '~/api/version';
import { ClashAPIConfig } from '~/types';

/** 内核版本信息。侧边栏和代理组都要用它区分 meta / premium，共用同一份缓存 */
export function useVersion(apiConfig: ClashAPIConfig) {
  const { data } = useSuspenseQuery({
    queryKey: ['/version', apiConfig],
    queryFn: () => fetchVersion('/version', apiConfig),
  });
  return data;
}
