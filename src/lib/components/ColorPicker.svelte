<script lang="ts">
	import "@simonwep/pickr/dist/themes/nano.min.css"
	import Pickr from "@simonwep/pickr"
	import { v4 } from "uuid"
	import { onMount } from "svelte"

	const elemID = "colourpicker-" + v4().replaceAll("-", "")

	export let type: "rgb" | "rgba"
	export let value: string

	onMount(() => {
		let picker = Pickr.create({
			el: "#" + elemID,
			theme: "nano",
			swatches: [],
			components: {
				preview: true,
				opacity: type == "rgba",
				hue: true,
				interaction: {
					hex: true,
					input: true,
					save: true
				}
			}
		})

		picker.on("init", function (picker: Pickr) {
			picker.setColor(value)
		})

		picker.on("save", function (colour) {
			if (type == "rgb") {
				value = ("#" + colour.toHEXA()[0] + colour.toHEXA()[1] + colour.toHEXA()[2]).toLowerCase()
			} else {
				value = ("#" + colour.toHEXA()[0] + colour.toHEXA()[1] + colour.toHEXA()[2] + (colour.toHEXA()[3] || "ff")).toLowerCase()
			}
		})
	})
</script>

<div id={elemID} />
