import { a as Badge, t as Card } from "./card-BX20N-Ev.js";
import { n as buttonVariants } from "./button-Bgvi3bSh.js";
import { n as getDataStateMeta } from "./data-state-UX6jPIR_.js";
import { Link } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/app/_components/DataStateNotice.tsx
function joinClasses(...values) {
	return values.filter(Boolean).join(" ");
}
function DataStateNotice({ state, subject, title, description, href, actionLabel, className, compact = false }) {
	const meta = getDataStateMeta(state, { subject });
	return /* @__PURE__ */ jsx(Card, {
		className: joinClasses("rounded-2xl px-4 py-4 shadow-[var(--shadow-soft)]", meta.toneClasses, className),
		children: /* @__PURE__ */ jsxs("div", {
			className: joinClasses("flex flex-wrap items-start justify-between gap-3", compact ? "gap-y-2" : "gap-y-3"),
			children: [/* @__PURE__ */ jsxs("div", {
				className: "min-w-0",
				children: [
					/* @__PURE__ */ jsx(Badge, {
						className: joinClasses("rounded-full px-2.5 py-1 text-[10px] font-black tracking-[0.16em]", meta.badgeClasses),
						children: meta.label
					}),
					/* @__PURE__ */ jsx("p", {
						className: joinClasses("font-semibold text-current", compact ? "mt-2 text-sm" : "mt-3 text-base"),
						children: title ?? meta.title
					}),
					/* @__PURE__ */ jsx("p", {
						className: joinClasses("leading-relaxed text-current/90", compact ? "mt-1 text-xs" : "mt-2 text-sm"),
						children: description ?? meta.description
					})
				]
			}), href ? /* @__PURE__ */ jsx(Link, {
				to: href,
				className: buttonVariants({
					variant: "outline",
					size: "sm",
					className: "rounded-xl border-current/20 bg-black/10 px-3 py-2 text-xs font-bold text-current hover:bg-black/20"
				}),
				children: actionLabel ?? "Ver detalle"
			}) : null]
		})
	});
}
//#endregion
export { DataStateNotice as t };

//# sourceMappingURL=DataStateNotice-Dzz1drH7.js.map