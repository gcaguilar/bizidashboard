import { memo, useEffect, useEffectEvent, useRef, useState, useSyncExternalStore } from "react";
import { Fragment as Fragment$1, jsx } from "react/jsx-runtime";
import { ResponsiveContainer } from "recharts";
//#region src/app/dashboard/_components/ChartWrapper.tsx
function getSnapshot() {
	return true;
}
function getServerSnapshot() {
	return false;
}
function subscribe() {
	return () => {};
}
var ChartWrapper = memo(function ChartWrapper({ children, height = "h-[280px]" }) {
	if (!useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)) return /* @__PURE__ */ jsx("div", { className: height });
	return /* @__PURE__ */ jsx(Fragment$1, { children });
});
//#endregion
//#region src/app/dashboard/_components/MeasuredResponsiveContainer.tsx
function MeasuredResponsiveContainer({ children, className = "h-full min-h-[220px] w-full min-w-0" }) {
	const hostRef = useRef(null);
	const [size, setSize] = useState({
		width: 0,
		height: 0
	});
	useEffect(() => {
		const node = hostRef.current;
		if (!node) return;
		const updateSize = () => {
			const rect = node.getBoundingClientRect();
			setSize({
				width: Math.max(0, Math.floor(rect.width)),
				height: Math.max(0, Math.floor(rect.height))
			});
		};
		updateSize();
		const observer = new ResizeObserver(updateSize);
		observer.observe(node);
		return () => {
			observer.disconnect();
		};
	}, []);
	return /* @__PURE__ */ jsx("div", {
		ref: hostRef,
		className,
		children: size.width > 0 && size.height > 0 ? /* @__PURE__ */ jsx(ResponsiveContainer, {
			width: size.width,
			height: size.height,
			children
		}) : null
	});
}
//#endregion
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
export { ChartWrapper as i, useAbortableAsyncEffect as n, MeasuredResponsiveContainer as r, fetchJson as t };
