import { jsx, jsxs } from "react/jsx-runtime";
//#region src/app/about.tsx?tsr-split=component
function About() {
	return /* @__PURE__ */ jsx("main", {
		className: "page-wrap px-4 py-12",
		children: /* @__PURE__ */ jsxs("section", {
			className: "island-shell rounded-2xl p-6 sm:p-8",
			children: [
				/* @__PURE__ */ jsx("p", {
					className: "island-kicker mb-2",
					children: "About"
				}),
				/* @__PURE__ */ jsx("h1", {
					className: "display-title mb-3 text-4xl font-bold text-[var(--sea-ink)] sm:text-5xl",
					children: "DatosBizi - Migrated to TanStack Start"
				}),
				/* @__PURE__ */ jsx("p", {
					className: "m-0 max-w-3xl text-base leading-8 text-[var(--sea-ink-soft)]",
					children: "This application was migrated from Next.js App Router to TanStack Start. It now uses TanStack Router, TanStack Query, TanStack Table, and TanStack DB with Prisma and Sentry integrations."
				})
			]
		})
	});
}
//#endregion
export { About as component };

//# sourceMappingURL=about-BMaJpakb.js.map