import { DispatchFn, StateModals } from './types';

export function openModal(modalName: keyof StateModals) {
  return (dispatch: DispatchFn) => {
    dispatch(`openModal:${modalName}`, (s) => {
      s.modals[modalName] = true;
    });
  };
}

export function closeModal(modalName: keyof StateModals) {
  return (dispatch: DispatchFn) => {
    dispatch(`closeModal:${modalName}`, (s) => {
      s.modals[modalName] = false;
    });
  };
}

export const initialState = { apiConfig: false };
