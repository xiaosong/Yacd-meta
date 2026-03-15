import * as React from 'react';

import { ThemeSwitcher } from '~/components/shared/ThemeSwitcher';
import { DOES_NOT_SUPPORT_FETCH, errors } from '~/misc/errors';

import s0 from './APIDiscovery.module.scss';
import Modal from './Modal';

type Props = {
  isOpen: boolean;
  onRequestClose: () => void;
  children: React.ReactNode;
};

export default function APIDiscovery({ isOpen, onRequestClose, children }: Props) {
  if (!window.fetch) {
    const { detail } = errors[DOES_NOT_SUPPORT_FETCH];
    const err = new Error(detail) as Error & { code?: number };
    err.code = DOES_NOT_SUPPORT_FETCH;
    throw err;
  }

  return (
    <Modal
      isOpen={isOpen}
      className={s0.content}
      overlayClassName={s0.overlay}
      shouldCloseOnOverlayClick={false}
      shouldCloseOnEsc={false}
      onRequestClose={onRequestClose}
    >
      <div className={s0.container}>{children}</div>

      <div className={s0.fixed}>
        <ThemeSwitcher />
      </div>
    </Modal>
  );
}
