
import { nanoid } from 'nanoid';

type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

const TOAST_EVENT = 'show-toast';

export const showToast = (message: string, type: ToastType = 'info') => {
  const event = new CustomEvent<ToastMessage>(TOAST_EVENT, {
    detail: { id: nanoid(), message, type },
  });
  window.dispatchEvent(event);
};

export const useToast = () => {
    return { showToast };
}

export { TOAST_EVENT };
export type { ToastMessage, ToastType };
