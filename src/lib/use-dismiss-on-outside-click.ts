import { useEffect, useRef } from 'react';

/**
 * Cierra un desplegable cuando se hace clic fuera de su contenedor o se pulsa
 * Escape. El contenedor se identifica con un selector (p. ej. un atributo
 * `data-*`) en lugar de una ref para poder compartirlo entre los desplegables
 * de la cabecera sin reestructurarlos.
 */
export function useDismissOnOutsideClick(
  open: boolean,
  containerSelector: string,
  onDismiss: () => void
): void {
  // Guardada en una ref para que los consumidores puedan pasar una lambda sin
  // resuscribir los listeners en cada render.
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;

  useEffect(() => {
    if (!open) return;

    function handleClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (!target?.closest(containerSelector)) {
        dismissRef.current();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        dismissRef.current();
      }
    }

    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, containerSelector]);
}
