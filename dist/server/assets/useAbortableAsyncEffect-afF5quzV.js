import { useEffect, useEffectEvent } from "react";
//#region src/app/dashboard/_components/useAbortableAsyncEffect.ts
function isAbortError(error) {
	if (error instanceof DOMException) return error.name === "AbortError";
	if (!error || typeof error !== "object") return false;
	return "name" in error && error.name === "AbortError";
}
async function fetchJson(input, options = {}) {
	const { errorMessage, ...requestInit } = options;
	const response = await fetch(input, requestInit);
	if (!response.ok) throw new Error(errorMessage ?? `HTTP ${response.status}`);
	return await response.json();
}
function useAbortableAsyncEffect(task, deps, options = {}) {
	const taskEvent = useEffectEvent(task);
	const onStartEvent = useEffectEvent(options.onStart ?? (() => {}));
	const onErrorEvent = useEffectEvent(options.onError ?? (() => {}));
	const onSettledEvent = useEffectEvent(options.onSettled ?? (() => {}));
	const enabled = options.enabled ?? true;
	const effectDependencies = deps.slice();
	effectDependencies.unshift(enabled);
	useEffect(() => {
		if (!enabled) return;
		const controller = new AbortController();
		let isActive = true;
		const getIsActive = () => isActive && !controller.signal.aborted;
		onStartEvent();
		Promise.resolve(taskEvent(controller.signal, getIsActive)).catch((error) => {
			if (!isAbortError(error) && isActive) onErrorEvent(error);
		}).finally(() => {
			if (isActive) onSettledEvent();
		});
		return () => {
			isActive = false;
			controller.abort();
		};
	}, effectDependencies);
}
//#endregion
export { useAbortableAsyncEffect as n, fetchJson as t };

//# sourceMappingURL=useAbortableAsyncEffect-afF5quzV.js.map