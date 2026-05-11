import { t as __esmMin } from "./chunk-D3Uyr3oi.js";
import { a as cn, o as init_utils } from "./card-BqIrN6Ld.js";
import * as React from "react";
import { jsx } from "react/jsx-runtime";
//#region src/components/ui/scroll-area.tsx
var ScrollArea;
var init_scroll_area = __esmMin((() => {
	init_utils();
	ScrollArea = React.forwardRef(function ScrollArea({ className, ...props }, ref) {
		return /* @__PURE__ */ jsx("div", {
			ref,
			className: cn("overflow-auto", className),
			...props
		});
	});
}));
//#endregion
export { init_scroll_area as n, ScrollArea as t };
