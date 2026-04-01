'use client';

import { useEffect, useEffectEvent, type DependencyList } from 'react';

type AbortableAsyncEffectOptions = {
  enabled?: boolean;
  onStart?: () => void;
  onError?: (error: unknown) => void;
  onSettled?: () => void;
};

type AbortableAsyncEffectTask = (
  signal: AbortSignal,
  isActive: () => boolean
) => Promise<void> | void;

type FetchJsonOptions = RequestInit & {
  errorMessage?: string;
};

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException
    ? error.name === 'AbortError'
    : Boolean(error) &&
        typeof error === 'object' &&
        'name' in error &&
        (error as { name?: unknown }).name === 'AbortError';
}

export async function fetchJson<T>(
  input: RequestInfo | URL,
  options: FetchJsonOptions = {}
): Promise<T> {
  const { errorMessage, ...requestInit } = options;
  const response = await fetch(input, requestInit);

  if (!response.ok) {
    throw new Error(errorMessage ?? `HTTP ${response.status}`);
  }

  return (await response.json()) as T;
}

export function useAbortableAsyncEffect(
  task: AbortableAsyncEffectTask,
  deps: DependencyList,
  options: AbortableAsyncEffectOptions = {}
): void {
  const taskEvent = useEffectEvent(task);
  const onStartEvent = useEffectEvent(options.onStart ?? (() => {}));
  const onErrorEvent = useEffectEvent(options.onError ?? (() => {}));
  const onSettledEvent = useEffectEvent(options.onSettled ?? (() => {}));
  const enabled = options.enabled ?? true;
  const effectDependencies = deps.slice();
  effectDependencies.unshift(enabled);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const controller = new AbortController();
    let isActive = true;
    const getIsActive = () => isActive && !controller.signal.aborted;

    onStartEvent();

    Promise.resolve(taskEvent(controller.signal, getIsActive))
      .catch((error) => {
        if (!isAbortError(error) && isActive) {
          onErrorEvent(error);
        }
      })
      .finally(() => {
        if (isActive) {
          onSettledEvent();
        }
      });

    return () => {
      isActive = false;
      controller.abort();
    };
    // The hook accepts a caller-provided dependency list, so we intentionally build it dynamically.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, effectDependencies);
}
