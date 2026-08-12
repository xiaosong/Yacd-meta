import cx from 'clsx';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { Edit3, Eye, EyeOff, Trash2 } from '~/components/shared/FeatherIcons';
import { useToggle } from '~/hooks/basic';
import type { ClashAPIConfigWithAddedAt } from '~/store/types';
import type { ClashAPIConfig } from '~/types';

import s from './BackendList.module.scss';

type Props = {
  apiConfigs: ClashAPIConfigWithAddedAt[];
  selectedClashAPIConfigIndex: number;
  editing: ClashAPIConfig | null;
  onRemove: (x: ClashAPIConfig) => void;
  onSelect: (x: ClashAPIConfig) => void;
  onEdit: (x: ClashAPIConfig) => void;
};

export function BackendList({
  apiConfigs,
  selectedClashAPIConfigIndex,
  editing,
  onRemove,
  onSelect,
  onEdit,
}: Props) {
  return (
    <ul className={s.ul}>
      {apiConfigs.map((item, idx) => (
        <Item
          key={item.baseURL + item.secret}
          baseURL={item.baseURL}
          secret={item.secret}
          isSelected={idx === selectedClashAPIConfigIndex}
          isEditing={
            editing != null && editing.baseURL === item.baseURL && editing.secret === item.secret
          }
          onRemove={onRemove}
          onSelect={onSelect}
          onEdit={onEdit}
        />
      ))}
    </ul>
  );
}

function Item({
  baseURL,
  secret,
  isSelected,
  isEditing,
  onRemove,
  onSelect,
  onEdit,
}: {
  baseURL: string;
  secret?: string;
  isSelected: boolean;
  isEditing: boolean;
  onRemove: (x: ClashAPIConfig) => void;
  onSelect: (x: ClashAPIConfig) => void;
  onEdit: (x: ClashAPIConfig) => void;
}) {
  const { t } = useTranslation();
  const [show, toggle] = useToggle();
  const SecretIcon = show ? EyeOff : Eye;

  return (
    <li className={cx(s.li, { [s.selected]: isSelected, [s.editing]: isEditing })}>
      <button
        type="button"
        className={s.main}
        title={isSelected ? undefined : t('use_this_backend')}
        onClick={() => onSelect({ baseURL, secret })}
      >
        <span className={s.dot} />
        <span className={s.body}>
          <span className={s.url}>{baseURL}</span>
          <span className={s.secret}>
            {secret ? (show ? secret : '••••••••') : t('backend_no_secret')}
          </span>
        </span>
      </button>

      <div className={s.tools}>
        {isSelected ? <span className={s.badge}>{t('backend_in_use')}</span> : null}
        {secret ? (
          <button
            type="button"
            className={s.iconBtn}
            onClick={toggle}
            title={show ? t('hide_secret') : t('show_secret')}
            aria-label={show ? t('hide_secret') : t('show_secret')}
          >
            <SecretIcon size={16} />
          </button>
        ) : null}
        <button
          type="button"
          className={cx(s.iconBtn, { [s.active]: isEditing })}
          onClick={() => onEdit({ baseURL, secret })}
          title={t('edit_backend')}
          aria-label={t('edit_backend')}
        >
          <Edit3 size={16} />
        </button>
        <button
          type="button"
          className={cx(s.iconBtn, s.remove)}
          disabled={isSelected}
          onClick={() => onRemove({ baseURL, secret })}
          title={t('remove_backend')}
          aria-label={t('remove_backend')}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </li>
  );
}
