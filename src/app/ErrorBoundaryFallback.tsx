import React from 'react';
import { useTranslation } from 'react-i18next';

import SvgGithub from '~/components/shared/SvgGithub';
import SvgYacd from '~/components/shared/SvgYacd';

import s0 from './ErrorBoundaryFallback.module.scss';

const yacdRepoIssueUrl = 'https://github.com/metacubex/yacd';

type Props = {
  message?: string;
  detail?: string;
};

// The boundary sits above the router and keeps its error state, so changing the hash alone
// would leave this page up; reload onto /backend, which doesn't mount the data pages.
function openBackendSettings(e: React.MouseEvent) {
  e.preventDefault();
  window.location.hash = '#/backend';
  window.location.reload();
}

function ErrorBoundaryFallback({ message, detail }: Props) {
  const { t } = useTranslation();
  return (
    <div className={s0.root}>
      <div className={s0.yacd}>
        <SvgYacd width={150} height={150} />
      </div>
      {message ? <h1>{message}</h1> : null}
      {detail ? <p>{detail}</p> : null}
      <p>
        <a className={s0.link} href="#/backend" onClick={openBackendSettings}>
          {t('switch_backend')}
        </a>
      </p>
      <p>
        <a className={s0.link} href={yacdRepoIssueUrl}>
          <SvgGithub width={16} height={16} />
          metacubex/yacd
        </a>
      </p>
    </div>
  );
}

export default ErrorBoundaryFallback;
