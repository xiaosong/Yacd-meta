import { getURLAndInit } from '~/misc/request-helper';
import { ClashGeneralConfig, TunPartial } from '~/store/types';
import { ClashAPIConfig } from '~/types';

const endpoint = '/configs';
const flushFakeIPPoolEndpoint = '/cache/fakeip/flush';
const restartCoreEndpoint = '/restart';
const upgradeCoreEndpoint = '/upgrade';
const upgradeGeoEndpoint = '/upgrade/geo';
const upgradeUIEndpoint = '/upgrade/ui';

export async function fetchConfigs(apiConfig: ClashAPIConfig, signal?: AbortSignal) {
  const { url, init } = getURLAndInit(apiConfig);
  return await fetch(url + endpoint, { ...init, signal });
}

// TODO support PUT /configs
// req body
// { Path: string }

type ClashConfigPartial = TunPartial<ClashGeneralConfig>;

export async function updateConfigs(apiConfig: ClashAPIConfig, o: ClashConfigPartial) {
  const { url, init } = getURLAndInit(apiConfig);
  const body = JSON.stringify(o);
  return await fetch(url + endpoint, { ...init, body, method: 'PATCH' });
}

export async function reloadConfigFile(apiConfig: ClashAPIConfig) {
  const { url, init } = getURLAndInit(apiConfig);
  const body = '{"path": "", "payload": ""}';
  return await fetch(url + endpoint + '?force=true', { ...init, body, method: 'PUT' });
}

export async function restartCore(apiConfig: ClashAPIConfig) {
  const { url, init } = getURLAndInit(apiConfig);
  const body = '{"path": "", "payload": ""}';
  return await fetch(url + restartCoreEndpoint, { ...init, body, method: 'POST' });
}

// 内核更新通道，对应 mihomo `POST /upgrade?channel=` 的取值；
// 不传则由内核按当前版本自动选择
export type UpgradeChannel = 'release' | 'alpha';

export async function upgradeCore(apiConfig: ClashAPIConfig, channel?: UpgradeChannel) {
  const { url, init } = getURLAndInit(apiConfig);
  const body = '{"path": "", "payload": ""}';
  const query = channel ? `?channel=${channel}` : '';
  return await fetch(url + upgradeCoreEndpoint + query, { ...init, body, method: 'POST' });
}

export async function upgradeGeo(apiConfig: ClashAPIConfig) {
  const { url, init } = getURLAndInit(apiConfig);
  const body = '{"path": "", "payload": ""}';
  return await fetch(url + upgradeGeoEndpoint, { ...init, body, method: 'POST' });
}

export async function upgradeUI(apiConfig: ClashAPIConfig) {
  const { url, init } = getURLAndInit(apiConfig);
  const body = '{"path": "", "payload": ""}';
  return await fetch(url + upgradeUIEndpoint, { ...init, body, method: 'POST' });
}

export async function flushFakeIPPool(apiConfig: ClashAPIConfig) {
  const { url, init } = getURLAndInit(apiConfig);
  return await fetch(url + flushFakeIPPoolEndpoint, { ...init, method: 'POST' });
}
