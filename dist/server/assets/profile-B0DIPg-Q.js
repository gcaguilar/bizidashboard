import { t as authClient } from "./auth-client-B1WK9Cao.js";
import { useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/app/profile.tsx?tsr-split=component
function ProfilePage() {
	const { data: session, isPending } = authClient.useSession();
	const [name, setName] = useState("");
	const [saving, setSaving] = useState(false);
	const [message, setMessage] = useState("");
	if (isPending) return /* @__PURE__ */ jsx("div", {
		className: "min-h-screen flex items-center justify-center",
		children: "Cargando..."
	});
	if (!session?.user) return /* @__PURE__ */ jsx("div", {
		className: "min-h-screen flex items-center justify-center",
		children: /* @__PURE__ */ jsxs("div", {
			className: "text-center",
			children: [/* @__PURE__ */ jsx("h2", {
				className: "text-xl font-bold mb-4",
				children: "Debes iniciar sesión"
			}), /* @__PURE__ */ jsx("a", {
				href: "/login",
				className: "text-red-600 hover:underline",
				children: "Ir a login"
			})]
		})
	});
	const handleUpdate = async () => {
		setSaving(true);
		setMessage("");
		const { error } = await authClient.updateUser({ name: name || session.user.name });
		if (error) setMessage("Error al actualizar");
		else setMessage("Perfil actualizado");
		setSaving(false);
	};
	return /* @__PURE__ */ jsx("div", {
		className: "min-h-screen bg-neutral-50 dark:bg-neutral-950 py-12",
		children: /* @__PURE__ */ jsxs("div", {
			className: "max-w-md mx-auto p-8 bg-white dark:bg-neutral-900 rounded-2xl shadow-lg",
			children: [
				/* @__PURE__ */ jsx("h2", {
					className: "text-2xl font-bold text-neutral-900 dark:text-white mb-6",
					children: "Mi perfil"
				}),
				message && /* @__PURE__ */ jsx("div", {
					className: "p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm mb-4",
					children: message
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "space-y-4",
					children: [
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("label", {
							className: "block text-sm font-medium text-neutral-700 dark:text-neutral-300",
							children: "Email"
						}), /* @__PURE__ */ jsx("input", {
							type: "text",
							value: session.user.email,
							disabled: true,
							className: "mt-1 w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400"
						})] }),
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("label", {
							className: "block text-sm font-medium text-neutral-700 dark:text-neutral-300",
							children: "Nombre"
						}), /* @__PURE__ */ jsx("input", {
							type: "text",
							value: name || session.user.name || "",
							onChange: (e) => setName(e.target.value),
							className: "mt-1 w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
						})] }),
						/* @__PURE__ */ jsx("button", {
							onClick: handleUpdate,
							disabled: saving,
							className: "w-full py-2 px-4 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors",
							children: saving ? "Guardando..." : "Guardar cambios"
						})
					]
				})
			]
		})
	});
}
//#endregion
export { ProfilePage as component };
