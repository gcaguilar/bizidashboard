import { t as authClient } from "./auth-client-B1WK9Cao.js";
import { useState } from "react";
import { useSearch } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/app/login.tsx?tsr-split=component
function LoginPage() {
	const searchParams = useSearch({ _strice: false });
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");
		setLoading(true);
		const { error } = await authClient.signIn.email({
			email,
			password,
			callbackURL: searchParams.callbackUrl || "/"
		});
		if (error) setError(error.message || "Error al iniciar sesión");
		setLoading(false);
	};
	return /* @__PURE__ */ jsx("div", {
		className: "min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950",
		children: /* @__PURE__ */ jsxs("div", {
			className: "w-full max-w-md space-y-8 p-8 bg-white dark:bg-neutral-900 rounded-2xl shadow-lg",
			children: [
				/* @__PURE__ */ jsxs("div", {
					className: "text-center",
					children: [/* @__PURE__ */ jsx("h2", {
						className: "text-2xl font-bold text-neutral-900 dark:text-white",
						children: "Iniciar sesión"
					}), /* @__PURE__ */ jsx("p", {
						className: "mt-2 text-sm text-neutral-600 dark:text-neutral-400",
						children: "Acceso a tu cuenta de DatosBizi"
					})]
				}),
				error && /* @__PURE__ */ jsx("div", {
					className: "p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm",
					children: error
				}),
				/* @__PURE__ */ jsxs("form", {
					onSubmit: handleSubmit,
					className: "space-y-4",
					children: [
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("label", {
							className: "block text-sm font-medium text-neutral-700 dark:text-neutral-300",
							children: "Email"
						}), /* @__PURE__ */ jsx("input", {
							type: "email",
							required: true,
							value: email,
							onChange: (e) => setEmail(e.target.value),
							className: "mt-1 w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
						})] }),
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("label", {
							className: "block text-sm font-medium text-neutral-700 dark:text-neutral-300",
							children: "Contraseña"
						}), /* @__PURE__ */ jsx("input", {
							type: "password",
							required: true,
							value: password,
							onChange: (e) => setPassword(e.target.value),
							className: "mt-1 w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
						})] }),
						/* @__PURE__ */ jsx("button", {
							type: "submit",
							disabled: loading,
							className: "w-full py-2 px-4 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors",
							children: loading ? "Iniciando..." : "Iniciar sesión"
						})
					]
				}),
				/* @__PURE__ */ jsxs("p", {
					className: "text-center text-sm text-neutral-600 dark:text-neutral-400",
					children: [
						"¿No tienes cuenta?",
						" ",
						/* @__PURE__ */ jsx("a", {
							href: "/register",
							className: "text-red-600 hover:underline",
							children: "Regístrate"
						})
					]
				})
			]
		})
	});
}
//#endregion
export { LoginPage as component };
