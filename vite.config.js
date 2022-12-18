import { sveltekit } from "@sveltejs/kit/vite"

/** @type {import('vite').UserConfig} */
const config = {
	plugins: [sveltekit()],
	server: {
		port: 3000
	},
	build: {
		target: "es2022",
		sourcemap: true
	},
	ssr: {
		noExternal: ["three", "troika-three-text"]
	}
}

export default config
