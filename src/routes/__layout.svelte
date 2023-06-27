<script lang="ts">
	import "../app.css"
	import "carbon-components-svelte/css/g90.css"
	import "$lib/fontawesome/css/all.css"
	import "shepherd.js/dist/css/shepherd.css"

	import { onMount } from "svelte"

	let ready: boolean = false
	onMount(() => (ready = true))
	import {
		Header,
		HeaderNav,
		HeaderNavItem,
		HeaderNavMenu,
		SideNav,
		SideNavItems,
		SideNavMenu,
		SideNavMenuItem,
		SideNavLink,
		SideNavDivider,
		SkipToContent,
		Content,
		Grid,
		ToastNotification,
		Modal,
		TextInput,
		Select,
		TreeView,
		Button
	} from "carbon-components-svelte"

	import { addNotification, appSettings, entity, saveWorkAndCallback, intellisense, inVivoMetadata, sessionMetadata, workspaceData } from "$lib/stores"
	import json from "$lib/json"
	import { shortcut } from "$lib/shortcut"
	import { gameServer } from "$lib/in-vivo/gameServer"

	import { page } from "$app/stores"
	import { fade, fly } from "svelte/transition"
	import { flip } from "svelte/animate"
	import { open, save } from "@tauri-apps/api/dialog"
	import { BaseDirectory, copyFile, createDir, exists as tauriExists, readDir, readTextFile, removeDir, writeTextFile } from "@tauri-apps/api/fs"
	import { appDir, join, sep } from "@tauri-apps/api/path"
	import { Command } from "@tauri-apps/api/shell"
	import { getVersion } from "@tauri-apps/api/app"
	import { appWindow } from "@tauri-apps/api/window"
	import md5 from "md5"
	import Shepherd from "shepherd.js"
	import cloneDeep from "lodash/cloneDeep"
	import { Pane, Splitpanes as SplitPanes } from "svelte-splitpanes"

	import Data2 from "carbon-icons-svelte/lib/Data_2.svelte"
	import Edit from "carbon-icons-svelte/lib/Edit.svelte"
	import TreeViewIcon from "carbon-icons-svelte/lib/TreeView.svelte"
	import Settings from "carbon-icons-svelte/lib/Settings.svelte"
	import WarningAlt from "carbon-icons-svelte/lib/WarningAlt.svelte"
	import DataUnstructured from "carbon-icons-svelte/lib/DataUnstructured.svelte"
	import WatsonHealthRotate_360 from "carbon-icons-svelte/lib/WatsonHealthRotate_360.svelte"

	import * as Sentry from "@sentry/browser"
	import { BrowserTracing } from "@sentry/tracing"
	import SentryRRWeb from "@sentry/rrweb"
	import { changeEntityHashesFromFriendly, changeEntityHashesToFriendly, changeReferenceToLocalEntity, getReferencedEntities, getReferencedLocalEntity } from "$lib/utils"
	import { goto } from "$app/navigation"
	import Decimal from "decimal.js"
	import { data } from "jquery"
	import type { FullRef, RefMaybeConstantValue, SubEntity } from "$lib/quickentity-types"
	import FileTree from "$lib/components/FileTree.svelte"

	let displayNotifications: { kind: "error" | "info" | "info-square" | "success" | "warning" | "warning-alt"; title: string; subtitle: string }[] = []

	addNotification.subscribe((value) => {
		if (value) {
			if (!displayNotifications.some((a) => a.title == value!.title)) {
				displayNotifications = [...displayNotifications, value]
				timeoutRemoveNotification(value.title)
			}

			value = null
		}
	})

	let isSideNavOpen = false

	function timeoutRemoveNotification(title: string) {
		setTimeout(() => {
			displayNotifications = displayNotifications.filter((a) => a.title != title)
		}, 6000)
	}

	let askGameFileModalOpen = false
	let askGameFileModalResult: string

	onMount(async () => {
		await createDir("gltf", { dir: BaseDirectory.App, recursive: true })
	})

	let currentTime = 0
	setInterval(() => {
		currentTime = Date.now()
	}, 100)

	const exists = async (path: string) => {
		try {
			return (await tauriExists(path)) as unknown as boolean
		} catch {
			return false
		}
	}

	async function getEntityAsText() {
		const ent = cloneDeep($entity)

		if ($appSettings.inVivoExtensions && gameServer.connected) {
			ent.entities["abcdefcadc2e258e"] = {
				parent: null,
				name: "QNE In-Vivo Helper Entity",
				factory: "[modules:/zmultiparentspatialentity.class].pc_entitytype",
				blueprint: "[modules:/zmultiparentspatialentity.class].pc_entityblueprint",
				properties: {
					m_aParents: {
						type: "TArray<SEntityTemplateReference>",
						value: Object.keys(ent.entities).filter((a) => a != "abcdefcadc2e258e" && a != "abcdefcadc77e4f2")
					}
				}
			}

			ent.entities["abcdefcadc77e4f2"] = {
				parent: "abcdefcadc2e258e",
				name: "QNE In-Vivo Helper Entity GameEventListener",
				factory: "[modules:/zgameeventlistenerentity.class].pc_entitytype",
				blueprint: "[modules:/zgameeventlistenerentity.class].pc_entityblueprint",
				properties: {
					m_eEvent: {
						type: "EGameEventType",
						value: "GET_IntroCutEnd"
					}
				},
				events: {
					EventOccurred: {
						GetIndex: ["abcdefcadc2e258e"]
					}
				}
			}
		}

		if ($workspaceData.path) {
			if (await exists(await join($workspaceData.path, "project.json"))) {
				const proj = JSON.parse(await readTextFile(await join($workspaceData.path, "project.json")))

				if (proj.customPaths) {
					changeEntityHashesFromFriendly(ent, Object.fromEntries(proj.customPaths.map((a: string) => [("00" + md5(a).slice(2, 16)).toUpperCase(), a])))
				}
			}
		}

		return json.stringify(ent)
	}

	async function getEntityFromText(x: string) {
		const ent = json.parse(x)

		if (Number(ent.quickEntityVersion) < 3.1) {
			for (const x of Object.values(ent.entities) as any[]) {
				x.factory = x.template
				delete x.template

				if (x.templateFlag) {
					x.factoryFlag = x.templateFlag
					delete x.templateFlag
				}
			}

			ent.quickEntityVersion = new Decimal(3.1)
		}

		if (ent.entities["abcdefcadc2e258e"]) {
			delete ent.entities["abcdefcadc2e258e"]
			delete ent.entities["abcdefcadc77e4f2"]
		}

		if ($workspaceData.path) {
			if (await exists(await join($workspaceData.path, "project.json"))) {
				changeEntityHashesToFriendly(
					ent,
					Object.fromEntries(JSON.parse(await readTextFile(await join($workspaceData.path, "project.json"))).customPaths.map((a: string) => [("00" + md5(a).slice(2, 16)).toUpperCase(), a]))
				)
			}
		}

		// Compatibility for QN change where all entity IDs are 16 characters
		for (const [entityID, entityData] of Object.entries(ent.entities) as [string, SubEntity][]) {
			if (entityData.parent) {
				const localRef = getReferencedLocalEntity(entityData.parent)
				if (localRef) {
					entityData.parent = changeReferenceToLocalEntity(entityData.parent, localRef.padStart(16, "0"))
				}
			}

			if (entityData.properties) {
				for (const [property, data] of Object.entries(entityData.properties)) {
					if (data.type == "SEntityTemplateReference" || data.type == "TArray<SEntityTemplateReference>") {
						if (data.type == "SEntityTemplateReference") {
							const localRef = getReferencedLocalEntity(data.value)
							if (localRef) {
								data.value = changeReferenceToLocalEntity(data.value, localRef.padStart(16, "0"))
							}
						} else {
							data.value = data.value.map((a) => {
								const localRef = getReferencedLocalEntity(a)
								if (localRef) {
									return changeReferenceToLocalEntity(a, localRef.padStart(16, "0"))
								} else {
									return a
								}
							})
						}
					}
				}
			}

			if (entityData.platformSpecificProperties) {
				for (const [platform, properties] of Object.entries(entityData.platformSpecificProperties)) {
					for (const [property, data] of Object.entries(properties)) {
						if (data.type == "SEntityTemplateReference" || data.type == "TArray<SEntityTemplateReference>") {
							if (data.type == "SEntityTemplateReference") {
								const localRef = getReferencedLocalEntity(data.value)
								if (localRef) {
									data.value = changeReferenceToLocalEntity(data.value, localRef.padStart(16, "0"))
								}
							} else {
								data.value = data.value.map((a) => {
									const localRef = getReferencedLocalEntity(a)
									if (localRef) {
										return changeReferenceToLocalEntity(a, localRef.padStart(16, "0"))
									} else {
										return a
									}
								})
							}
						}
					}
				}
			}

			for (const [type, data] of [
				["event", entityData.events],
				["inputCopy", entityData.inputCopying],
				["outputCopy", entityData.outputCopying]
			] as [string, Record<string, Record<string, RefMaybeConstantValue[]>>][]) {
				if (data) {
					for (const [event, x] of Object.entries(data)) {
						for (const y of Object.keys(x)) {
							x[y] = x[y].map((ent) => {
								const localRef = getReferencedLocalEntity(ent && typeof ent != "string" && Object.prototype.hasOwnProperty.call(ent, "value") ? ent.ref : (ent as FullRef))
								if (localRef) {
									if (ent && typeof ent != "string" && Object.prototype.hasOwnProperty.call(ent, "value")) {
										return { ...ent, ref: changeReferenceToLocalEntity(ent.ref, localRef.padStart(16, "0")) }
									} else {
										return changeReferenceToLocalEntity(ent as FullRef, localRef.padStart(16, "0"))
									}
								} else {
									return ent
								}
							})
						}
					}
				}
			}

			if (entityData.propertyAliases) {
				for (const alias of Object.keys(entityData.propertyAliases)) {
					entityData.propertyAliases[alias] = entityData.propertyAliases[alias].map((alias) => {
						const localRef = getReferencedLocalEntity(alias.originalEntity)
						if (localRef) {
							if (alias.originalProperty === "m_nPriority")
								console.log(alias, { ...alias, originalEntity: changeReferenceToLocalEntity(alias.originalEntity, localRef.padStart(16, "0")) })
							return { ...alias, originalEntity: changeReferenceToLocalEntity(alias.originalEntity, localRef.padStart(16, "0")) }
						} else {
							return alias
						}
					})
				}
			}

			if (entityData.exposedEntities) {
				for (const [exposedEnt, data] of Object.entries(entityData.exposedEntities)) {
					data.refersTo = data.refersTo.map((target) => {
						const localRef = getReferencedLocalEntity(target)
						if (localRef) {
							return changeReferenceToLocalEntity(target, localRef.padStart(16, "0"))
						} else {
							return target
						}
					})
				}
			}

			if (entityData.exposedInterfaces) {
				for (const x of Object.keys(entityData.exposedInterfaces)) {
					entityData.exposedInterfaces[x] = entityData.exposedInterfaces[x].padStart(16, "0")
				}
			}

			if (entityData.subsets) {
				for (const x of Object.keys(entityData.subsets)) {
					entityData.subsets[x] = entityData.subsets[x].map((ent) => ent.padStart(16, "0"))
				}
			}
		}

		ent.entities = Object.fromEntries(Object.entries(ent.entities).map(([a, b]) => [a.padStart(16, "0"), b]))

		if (ent.entities[ent.rootEntity].name !== "Scene" || ent.tempHash !== "") {
			appWindow.setTitle(`${ent.entities[ent.rootEntity].name} (${ent.tempHash}) - QuickEntity Editor`)
		} else {
			appWindow.setTitle("QuickEntity Editor")
		}

		return ent
	}

	onMount(async () => {
		if ($appSettings.enableLogRocket) {
			Sentry.init({
				dsn: "https://7be7af4147884b6093b380e65750e9f6@o1144555.ingest.sentry.io/4503907590537216",
				integrations: [new BrowserTracing(), new SentryRRWeb()],
				tracesSampleRate: 0,
				release: await getVersion()
			})

			if ($appSettings.logRocketName != "") {
				Sentry.setUser({
					id: $appSettings.logRocketID,
					username: $appSettings.logRocketName,
					gameFileExtensions: $appSettings.gameFileExtensions,
					inVivoExtensions: $appSettings.inVivoExtensions
				})
			} else {
				Sentry.setUser({ id: $appSettings.logRocketID, gameFileExtensions: $appSettings.gameFileExtensions, inVivoExtensions: $appSettings.inVivoExtensions })
			}
		}
	})

	function breadcrumb(category: string, message: string, data: Record<string, string> = {}) {
		if ($appSettings.enableLogRocket) {
			Sentry.addBreadcrumb({
				message,
				category,
				data,
				level: "info"
			})
		}
	}

	async function extractForInspection(tempHash: string, patchVersion: number) {
		try {
			if (!(await exists(await join(await appDir(), "repository", "repo.json")))) {
				$addNotification = {
					kind: "info",
					title: "Extracting repository",
					subtitle: "Extracting the repository file"
				}

				let latestChunkRepo = $appSettings.extractModdedFiles
					? /is in: (.*?.rpkg)/gi.exec((await Command.sidecar("sidecar/rpkg-cli", ["-latest_hash", $appSettings.runtimePath, "-filter", "00204D1AFD76AB13"]).execute()).stdout)![1]
					: [
							...(await Command.sidecar("sidecar/rpkg-cli", ["-latest_hash", $appSettings.runtimePath, "-filter", "00204D1AFD76AB13"]).execute()).stdout.matchAll(
								/was found in RPKG file: (.*?.rpkg)/gi
							)
					  ]
							.filter((a) => !a[1].includes("patch") || Number(/(?:chunk|dlc)[0-9]*patch([0-9]*)\.rpkg/g.exec(a[1])![1]) < 10)
							.sort((a, b) =>
								b[1].localeCompare(a[1], undefined, {
									numeric: true,
									sensitivity: "base"
								})
							)[0][1]

				await Command.sidecar("sidecar/rpkg-cli", [
					"-extract_from_rpkg",
					await join($appSettings.runtimePath, latestChunkRepo),
					"-filter",
					"00204D1AFD76AB13",
					"-output_path",
					await join(await appDir(), "repository")
				]).execute()

				await copyFile(await join(await appDir(), "repository", latestChunkRepo.replace(".rpkg", ""), "REPO", "00204D1AFD76AB13.REPO"), await join(await appDir(), "repository", "repo.json"))
			}

			if (!(await exists(await join(await appDir(), "inspection-cache-" + patchVersion, tempHash + ".json")))) {
				if (await exists(await join(await appDir(), "inspection"))) {
					await removeDir(await join(await appDir(), "inspection"), { recursive: true })
				}

				$addNotification = {
					kind: "info",
					title: "Extracting TEMP files",
					subtitle: "Extracting binary TEMP files"
				}

				let latestChunkTemp = $appSettings.extractModdedFiles
					? /is in: (.*?.rpkg)/gi.exec((await Command.sidecar("sidecar/rpkg-cli", ["-latest_hash", $appSettings.runtimePath, "-filter", tempHash]).execute()).stdout)![1]
					: [
							...(await Command.sidecar("sidecar/rpkg-cli", ["-latest_hash", $appSettings.runtimePath, "-filter", tempHash]).execute()).stdout.matchAll(
								/was found in RPKG file: (.*?.rpkg)/gi
							)
					  ]
							.filter((a) => !a[1].includes("patch") || Number(/(?:chunk|dlc)[0-9]*patch([0-9]*)\.rpkg/g.exec(a[1])![1]) < 10)
							.sort((a, b) =>
								b[1].localeCompare(a[1], undefined, {
									numeric: true,
									sensitivity: "base"
								})
							)[0][1]

				await Command.sidecar("sidecar/rpkg-cli", [
					"-extract_from_rpkg",
					await join($appSettings.runtimePath, latestChunkTemp),
					"-filter",
					tempHash,
					"-output_path",
					await join(await appDir(), "inspection")
				]).execute()

				let tempPath, tempMetaPath, tbluPath, tbluMetaPath

				$addNotification = {
					kind: "info",
					title: "Converting TEMP files",
					subtitle: "Converting TEMP files to JSON"
				}

				for (let entry of (await readDir(await join(await appDir(), "inspection", latestChunkTemp.replace(".rpkg", "")), { recursive: true })).flatMap((a) => a.children || a)) {
					if (entry.path.endsWith(".TEMP")) {
						await Command.sidecar("ResourceTool", [$appSettings.h1 ? "HM2016" : $appSettings.h2 ? "HM2" : "HM3", "convert", "TEMP", entry.path, entry.path + ".json", "--simple"]).execute()
						tempPath = entry.path + ".json"
					} else if (entry.path.endsWith(".TEMP.meta")) {
						await Command.sidecar("sidecar/rpkg-cli", ["-hash_meta_to_json", entry.path]).execute()
						tempMetaPath = entry.path + ".JSON"
					}
				}

				let tbluHash = json.parse(await readTextFile(tempMetaPath)).hash_reference_data[json.parse(await readTextFile(tempPath)).blueprintIndexInResourceHeader].hash
				if (tbluHash.includes(":")) {
					tbluHash = ("00" + md5(tbluHash).slice(2, 16)).toUpperCase()
				}

				let latestChunkTblu = $appSettings.extractModdedFiles
					? /is in: (.*?.rpkg)/gi.exec((await Command.sidecar("sidecar/rpkg-cli", ["-latest_hash", $appSettings.runtimePath, "-filter", tbluHash]).execute()).stdout)![1]
					: [
							...(await Command.sidecar("sidecar/rpkg-cli", ["-latest_hash", $appSettings.runtimePath, "-filter", tbluHash]).execute()).stdout.matchAll(
								/was found in RPKG file: (.*?.rpkg)/gi
							)
					  ]
							.filter((a) => !a[1].includes("patch") || Number(/(?:chunk|dlc)[0-9]*patch([0-9]*)\.rpkg/g.exec(a[1])![1]) < 10)
							.sort((a, b) =>
								b[1].localeCompare(a[1], undefined, {
									numeric: true,
									sensitivity: "base"
								})
							)[0][1]

				$addNotification = {
					kind: "info",
					title: "Extracting TBLU files",
					subtitle: "Extracting binary TBLU files"
				}

				await Command.sidecar("sidecar/rpkg-cli", [
					"-extract_from_rpkg",
					await join($appSettings.runtimePath, latestChunkTblu),
					"-filter",
					tbluHash,
					"-output_path",
					await join(await appDir(), "inspection")
				]).execute()

				$addNotification = {
					kind: "info",
					title: "Converting TBLU files",
					subtitle: "Converting TBLU files to JSON"
				}

				for (let entry of (await readDir(await join(await appDir(), "inspection", latestChunkTblu.replace(".rpkg", "")), { recursive: true })).flatMap((a) => a.children || a)) {
					if (entry.path.endsWith(".TBLU")) {
						await Command.sidecar("ResourceTool", [$appSettings.h1 ? "HM2016" : $appSettings.h2 ? "HM2" : "HM3", "convert", "TBLU", entry.path, entry.path + ".json", "--simple"]).execute()
						tbluPath = entry.path + ".json"
					} else if (entry.path.endsWith(".TBLU.meta")) {
						await Command.sidecar("sidecar/rpkg-cli", ["-hash_meta_to_json", entry.path]).execute()
						tbluMetaPath = entry.path + ".JSON"
					}
				}

				$addNotification = {
					kind: "info",
					title: "Converting to QuickEntity",
					subtitle: "Converting source JSON files to QuickEntity JSON"
				}

				try {
					await createDir("inspection-cache-" + patchVersion, { dir: BaseDirectory.App, recursive: true })
				} catch {}

				await Command.sidecar("sidecar/quickentity-" + (patchVersion == 5 ? "3" : "rs"), [
					"entity",
					"convert",
					"--input-factory",
					tempPath,
					"--input-factory-meta",
					tempMetaPath,
					"--input-blueprint",
					tbluPath,
					"--input-blueprint-meta",
					tbluMetaPath,
					"--output",
					await join(await appDir(), "inspection-cache-" + patchVersion, tempHash + ".json")
				]).execute()
			}

			if (!(await exists(await join(await appDir(), "inspection")))) {
				await createDir(await join(await appDir(), "inspection"))
			}

			await copyFile(await join(await appDir(), "inspection-cache-" + patchVersion, tempHash + ".json"), await join(await appDir(), "inspection", "originalEntity.json"))
		} catch (e) {
			if ($appSettings.enableLogRocket) {
				Sentry.captureException(e)
			}

			$addNotification = {
				kind: "error",
				title: "Error while extracting",
				subtitle: `QNE encountered a${["a", "e", "i", "o", "u"].some((a) => e.name.toLowerCase().startsWith(a)) ? "n" : ""} ${e.name} while extracting the given entity.`
			}
		}
	}

	let reportIssueModalOpen = false
	let reportIssueModalSeverity = ""
	let reportIssueModalIssue = ""

	let fileTree: FileTree

	$: if ($entity.tempHash) appWindow.setTitle(`${$entity.entities[$entity.rootEntity].name} (${$entity.tempHash})`)
</script>

{#if ready}
	<header data-tauri-drag-region class:bx--header={true} class:compact={$appSettings.compactMode}>
		<SkipToContent />
		<!-- svelte-ignore a11y-missing-attribute -->
		<a data-tauri-drag-region class:bx--header__name={true}>
			<span data-tauri-drag-region class:bx--header__name--prefix={true}>QuickEntity&nbsp;</span>
			Editor
		</a>
		<nav data-tauri-drag-region class:bx--header__nav={true} class:w-full={true}>
			<ul data-tauri-drag-region role="menubar" class:bx--header__menu-bar={true}>
				<HeaderNavMenu text="Load">
					<HeaderNavItem
						href="#"
						text="Load workspace folder"
						on:click={async () => {
							let x = await open({
								directory: true,
								title: "Select the workspace folder"
							})

							if (x && !Array.isArray(x)) {
								$workspaceData.path = x

								goto("/tree")
							}
						}}
					/>
					<li
						role="none"
						use:shortcut={{ control: true, key: "o" }}
						on:click={async () => {
							let x = await open({
								multiple: false,
								title: "Select the entity JSON",
								filters: [
									{
										name: "QuickEntity JSON",
										extensions: ["json"]
									}
								]
							})

							if (x && !Array.isArray(x)) {
								$sessionMetadata.originalEntityPath = x
								$sessionMetadata.saveAsPatch = false
								$sessionMetadata.saveAsEntityPath = $sessionMetadata.originalEntityPath
								$sessionMetadata.loadedFromGameFiles = false
								$entity = await getEntityFromText(await readTextFile(x))

								breadcrumb("entity", `Loaded ${$entity.tempHash} from file`)

								goto("/tree")
							}
						}}
					>
						<HeaderNavItem href="#" text="Load entity from file" />
					</li>
					<li
						role="none"
						use:shortcut={{ control: true, alt: true, key: "o" }}
						on:click={() => {
							askGameFileModalOpen = true
						}}
					>
						<HeaderNavItem href="#" text="Load entity from game" />
					</li>
					<li
						role="none"
						use:shortcut={{ control: true, shift: true, key: "O" }}
						on:click={async () => {
							let y = await open({
								multiple: false,
								title: "Select the patch JSON",
								filters: [
									{
										name: "Patch JSON",
										extensions: ["json"]
									}
								]
							})

							if (!y || Array.isArray(y)) return

							let patch = json.parse(await readTextFile(y))
							let entityPath

							if ($appSettings.gameFileExtensions && (await exists(await join($appSettings.gameFileExtensionsDataPath, "TEMP", patch.tempHash + ".TEMP.entity.json")))) {
								await extractForInspection(patch.tempHash, Number(patch.patchVersion))

								entityPath = await join(await appDir(), "inspection", "originalEntity.json")
							} else {
								let x = await open({
									multiple: false,
									title: "Select the original entity JSON",
									filters: [
										{
											name: "QuickEntity JSON",
											extensions: ["json"]
										}
									]
								})

								if (!x || Array.isArray(x)) return

								entityPath = x
							}

							if (Number(patch.patchVersion) < 6) {
								await Command.sidecar("sidecar/quickentity-3", [
									"patch",
									"apply",
									"--permissive",
									"--input",
									entityPath,
									"--patch",
									y,
									"--output",
									await join(await appDir(), "patched.json")
								]).execute()
							} else {
								await Command.sidecar("sidecar/quickentity-rs", [
									"patch",
									"apply",
									"--permissive",
									"--input",
									entityPath,
									"--patch",
									y,
									"--output",
									await join(await appDir(), "patched.json")
								]).execute()
							}

							$sessionMetadata.saveAsPatch = true
							$sessionMetadata.saveAsPatchPath = y
							$sessionMetadata.loadedFromGameFiles = false
							$sessionMetadata.originalEntityPath = entityPath
							$entity = await getEntityFromText(await readTextFile(await join(await appDir(), "patched.json")))

							breadcrumb("entity", `Loaded ${$entity.tempHash} from patch`)

							goto("/tree")
						}}
					>
						<HeaderNavItem href="#" text="Load entity from patch" />
					</li>
				</HeaderNavMenu>
				<HeaderNavMenu text="Save&nbsp;as">
					<li
						role="none"
						use:shortcut={{ control: true, shift: true, key: "S" }}
						on:click={async () => {
							let x = await save({
								title: "Save the entity JSON",
								filters: [
									{
										name: "Entity JSON",
										extensions: ["entity.json"]
									}
								]
							})

							if (!x) return

							$saveWorkAndCallback = async () => {
								await writeTextFile(x, await getEntityAsText())

								$sessionMetadata.saveAsPatch = false
								$sessionMetadata.saveAsEntityPath = x
								$sessionMetadata.loadedFromGameFiles = false

								breadcrumb("entity", "Saved to file")

								$addNotification = {
									kind: "success",
									title: "Saved entity successfully",
									subtitle: "Saved the entity to the selected path"
								}
							}
						}}
					>
						<HeaderNavItem href="#" text="Save as entity file" />
					</li>
					<li
						role="none"
						use:shortcut={{ control: true, shift: true, alt: true, key: "S" }}
						on:click={async () => {
							let x = await save({
								title: "Save the patch JSON",
								filters: [
									{
										name: "Patch JSON",
										extensions: ["entity.patch.json"]
									}
								]
							})

							if (!x) return

							$saveWorkAndCallback = async () => {
								await writeTextFile("entity.json", await getEntityAsText(), { dir: BaseDirectory.App })

								await Command.sidecar("sidecar/quickentity-rs", [
									"patch",
									"generate",
									"--input1",
									String($sessionMetadata.originalEntityPath),
									"--input2",
									await join(await appDir(), "entity.json"),
									"--output",
									x,
									"--format-fix"
								]).execute()

								$sessionMetadata.saveAsPatch = true
								$sessionMetadata.saveAsPatchPath = x
								$sessionMetadata.loadedFromGameFiles = false

								breadcrumb("entity", "Saved to patch")

								$addNotification = {
									kind: "success",
									title: "Saved patch successfully",
									subtitle: "Saved the changes from the original entity to the selected path"
								}
							}
						}}
					>
						<HeaderNavItem href="#" text="Save as patch file" />
					</li>
				</HeaderNavMenu>
				{#if $sessionMetadata.originalEntityPath && !$sessionMetadata.loadedFromGameFiles}
					{#if $sessionMetadata.saveAsPatch}
						<li
							role="none"
							use:shortcut={{ control: true, key: "s" }}
							on:click={async () => {
								$saveWorkAndCallback = async () => {
									await writeTextFile("entity.json", await getEntityAsText(), { dir: BaseDirectory.App })

									await Command.sidecar("sidecar/quickentity-rs", [
										"patch",
										"generate",
										"--input1",
										String($sessionMetadata.originalEntityPath),
										"--input2",
										await join(await appDir(), "entity.json"),
										"--output",
										String($sessionMetadata.saveAsPatchPath),
										"--format-fix"
									]).execute()

									$sessionMetadata.loadedFromGameFiles = false

									$addNotification = {
										kind: "success",
										title: "Saved patch successfully",
										subtitle:
											"Saved the changes from the original entity to " +
											($sessionMetadata.saveAsPatchPath.split(sep).length > 3
												? "..." + $sessionMetadata.saveAsPatchPath.split(sep).slice(-3).join(sep)
												: $sessionMetadata.saveAsPatchPath)
									}

									breadcrumb("entity", "Saved to patch (original path)")
								}
							}}
						>
							<a role="menuitem" tabindex="0" href="#" class="bx--header__menu-item"><span class="bx--text-truncate--end">Save patch</span></a>
						</li>
					{:else}
						<li
							role="none"
							use:shortcut={{ control: true, key: "s" }}
							on:click={async () => {
								$saveWorkAndCallback = async () => {
									await writeTextFile($sessionMetadata.saveAsEntityPath, await getEntityAsText())

									$sessionMetadata.loadedFromGameFiles = false

									$addNotification = {
										kind: "success",
										title: "Saved entity successfully",
										subtitle:
											"Saved the entity to " +
											($sessionMetadata.saveAsEntityPath.split(sep).length > 3
												? "..." + $sessionMetadata.saveAsEntityPath.split(sep).slice(-3).join(sep)
												: $sessionMetadata.saveAsEntityPath)
									}

									breadcrumb("entity", "Saved to file (original path)")
								}
							}}
						>
							<a role="menuitem" tabindex="0" href="#" class="bx--header__menu-item"><span class="bx--text-truncate--end">Save entity</span></a>
						</li>
					{/if}
				{/if}
				{#if $sessionMetadata.originalEntityPath}
					{#if $appSettings.inVivoExtensions}
						<HeaderNavItem
							href="#"
							text="{!gameServer.connected ? 'Enable' : 'Disable'} game connection"
							class="shepherd-gameConnection"
							on:click={async () => {
								if (!gameServer.connected) {
									await gameServer.start()

									gameServer.client.addListener(({ datagram }) => {
										gameServer.lastMessage = Date.now()
									})

									$inVivoMetadata.entities = {}
								} else {
									await gameServer.kill()
								}

								gameServer.connected = gameServer.connected

								breadcrumb("gameserver", `Toggled to ${gameServer.connected}`)
							}}
						/>
						{#if gameServer.connected}
							<li role="none">
								<a href="#" disabled class="bx--header__menu-item">
									<span class="bx--text-truncate--end" style:color={currentTime - gameServer.lastMessage < 5000 ? "#bbf7d0" : "#fecaca"}>
										Last message from game: {gameServer.lastMessage != 0 ? Math.max(0, currentTime - gameServer.lastMessage) : "never"}
									</span>
								</a>
							</li>
						{/if}
					{/if}
				{/if}
				{#if $page.url.pathname == "/metadata" || $page.url.pathname == "/overrides" || $page.url.pathname == "/tree" || $page.url.pathname == "/graph"}
					<HeaderNavItem
						href="#"
						on:click={() => {
							if ($page.url.pathname == "/metadata") {
								const tour = new Shepherd.Tour({
									useModalOverlay: true,
									defaultStepOptions: {
										classes: "shadow-md bg-purple-dark",
										scrollTo: true
									}
								})

								tour.addStep({
									id: "page",
									text: "You're looking at the Metadata view, where you can customise general properties of the opened entity.",
									buttons: [
										{
											text: "Next",
											action: tour.next
										}
									]
								})

								tour.addStep({
									id: "factoryHash",
									text: "This is the alphanumeric 16 character game hash of the factory (TEMP) of the opened entity.",
									attachTo: {
										element: ".shepherd-factoryHash",
										on: "bottom"
									},
									buttons: [
										{
											text: "Next",
											action: tour.next
										}
									]
								})

								tour.addStep({
									id: "blueprintHash",
									text: "This is the alphanumeric 16 character game hash of the blueprint (TBLU) of the opened entity.",
									attachTo: {
										element: ".shepherd-blueprintHash",
										on: "bottom"
									},
									buttons: [
										{
											text: "Next",
											action: tour.next
										}
									]
								})

								tour.addStep({
									id: "rootEntity",
									text: "This is the entity ID of the root entity. For templates, the root entity should be the one that implements the required interfaces, exposes the required entities and aliases the required properties; properties of the template in another brick are propagated to the root entity. For scenes and bricks, the root entity should be a spatial entity which the other entities are parented to.",
									attachTo: {
										element: ".shepherd-rootEntity",
										on: "bottom"
									},
									buttons: [
										{
											text: "Next",
											action: tour.next
										}
									]
								})

								tour.addStep({
									id: "entityType",
									text: "This is the entity's type. Scenes are entities that are loaded by contract JSONs; they're the highest up in the hierarchy. Bricks are entities that are loaded by scenes. Templates are entities designed for a specific purpose that are then used by other entities.",
									attachTo: {
										element: ".shepherd-entityType",
										on: "bottom"
									},
									buttons: [
										{
											text: "Next",
											action: tour.next
										}
									]
								})

								tour.addStep({
									id: "externalScenes",
									text: "These are the external scenes that this entity references. Anything used in an externalScene property of a reference should be here, as well as any other bricks or entities you might want to load alongside this entity.",
									attachTo: {
										element: ".shepherd-externalScenes",
										on: "bottom"
									},
									buttons: [
										{
											text: "Next",
											action: tour.next
										}
									]
								})

								tour.addStep({
									id: "extraDependencies",
									text: "If you want to add any extra dependencies to the factory or blueprint, you can do so here.",
									attachTo: {
										element: ".shepherd-extraDependencies",
										on: "bottom"
									},
									buttons: [
										{
											text: "Next",
											action: tour.next
										}
									]
								})

								tour.start()
							}

							if ($page.url.pathname == "/overrides") {
								const tour = new Shepherd.Tour({
									useModalOverlay: true,
									defaultStepOptions: {
										classes: "shadow-md bg-purple-dark",
										scrollTo: true
									}
								})

								tour.addStep({
									id: "page",
									text: "You're looking at the Overrides view, where you can customise how this entity overrides other entities when it's loaded. This is usually used by bricks or scenes.",
									buttons: [
										{
											text: "Next",
											action: tour.next
										}
									]
								})

								tour.addStep({
									id: "propertyOverrides",
									text: "These are entity properties that will be overriden when this entity is loaded.",
									attachTo: {
										element: ".shepherd-propertyOverrides",
										on: "auto"
									},
									buttons: [
										{
											text: "Next",
											action: tour.next
										}
									]
								})

								tour.addStep({
									id: "overrideDeletes",
									text: "These are entities that will be removed when this entity is loaded.",
									attachTo: {
										element: ".shepherd-overrideDeletes",
										on: "auto"
									},
									buttons: [
										{
											text: "Next",
											action: tour.next
										}
									]
								})

								tour.start()
							}

							if ($page.url.pathname == "/tree") {
								const tour = new Shepherd.Tour({
									useModalOverlay: true,
									defaultStepOptions: {
										classes: "shadow-md bg-purple-dark",
										scrollTo: true
									}
								})

								tour.addStep({
									id: "page",
									text: "You're looking at the Tree view, where you'll spend most of your time in QuickEntity Editor. There are three components to this view: the tree, the information pane and the editor.",
									buttons: [
										{
											text: "Next",
											action: tour.next
										}
									]
								})

								tour.addStep({
									id: "tree",
									text: "This is the tree itself. It displays the sub-entities of the game entity you're looking at. You can also right click on sub-entities to create new ones, delete them, rename them, add comments or access other advanced options. The tree is sorted alphabetically, and you can drag sub-entities to re-parent them.",
									attachTo: {
										element: ".shepherd-tree",
										on: "right"
									},
									buttons: [
										{
											text: "Next",
											action: tour.next
										}
									]
								})

								tour.addStep({
									id: "information",
									text: "When you select an entity in the tree, you'll see relevant information show up here like entities that reference the entity you clicked.",
									attachTo: {
										element: ".shepherd-information",
										on: "right"
									},
									buttons: [
										{
											text: "Next",
											action: tour.next
										}
									]
								})

								tour.addStep({
									id: "editor",
									text: "You'll also see an editor show up here, allowing you to change the properties of an entity or edit the text of a comment. Some properties, like colours, have visual editors as well, which will show up below the main JSON editor.",
									attachTo: {
										element: ".shepherd-editor",
										on: "left"
									},
									buttons: [
										{
											text: "Next",
											action: tour.next
										}
									]
								})

								if ($appSettings.inVivoExtensions) {
									tour.addStep({
										id: "gameConnection",
										text: "Since you've enabled in-vivo extensions, you can connect to a running instance of the game using this (you should turn this on before launching the game). If you save an entity while the game connection is enabled, a helper sub-entity will be added to allow you to perform in-game actions on everything in the entity - if something isn't working right, save while the game connection is enabled and re-deploy.",
										attachTo: {
											element: ".shepherd-gameConnection",
											on: "left"
										},
										buttons: [
											{
												text: "Next",
												action: tour.next
											}
										]
									})
								}

								tour.start()
							}

							if ($page.url.pathname == "/graph") {
								const tour = new Shepherd.Tour({
									useModalOverlay: true,
									defaultStepOptions: {
										classes: "shadow-md bg-purple-dark",
										scrollTo: true
									}
								})

								tour.addStep({
									id: "page",
									text: "You're looking at the Graph view, where you can wire up events and triggers in a visual way. Forwarding (input and output copying) isn't supported in this view, at least right now.",
									buttons: [
										{
											text: "Next",
											action: tour.next
										}
									]
								})

								tour.addStep({
									id: "graphTree",
									text: "This is the tree view. Select an entity here and its children will be displayed on the graph. It's slimmed down compared to the Tree view; the only right-click action supported, currently, is Rename.",
									attachTo: {
										element: ".shepherd-graphTree",
										on: "bottom"
									},
									buttons: [
										{
											text: "Next",
											action: tour.next
										}
									]
								})

								tour.addStep({
									id: "graph",
									text: "This is the graph itself. It displays entities, their inputs and their outputs, in a visual way allowing you to drag to connect events. You can add a new entity by dragging it from the left pane to the main view.",
									attachTo: {
										element: ".shepherd-graph",
										on: "bottom"
									},
									buttons: [
										{
											text: "Next",
											action: tour.next
										}
									]
								})

								tour.addStep({
									id: "graph",
									text: "You can format the graph by clicking this button; the nodes will be automatically re-arranged in a way that makes everything as clean and visible as possible.",
									attachTo: {
										element: ".shepherd-formatGraphButton",
										on: "bottom"
									},
									buttons: [
										{
											text: "Next",
											action: tour.next
										}
									]
								})

								tour.start()
							}

							breadcrumb("ui", "Tour activated")
						}}
						text="Help"
					/>
				{/if}
			</ul>
		</nav>

		<div data-tauri-drag-region class="pointer-events-none cursor-none w-full text-center text-neutral-400">
			{$sessionMetadata.loadedFromGameFiles
				? $entity.tempHash
				: $sessionMetadata.saveAsPatch
				? $sessionMetadata.saveAsPatchPath.split(sep).length > 4
					? "..." + $sessionMetadata.saveAsPatchPath.split(sep).slice(-4).join(sep)
					: $sessionMetadata.saveAsPatchPath
				: $sessionMetadata.saveAsEntityPath
				? $sessionMetadata.saveAsEntityPath.split(sep).length > 4
					? "..." + $sessionMetadata.saveAsEntityPath.split(sep).slice(-4).join(sep)
					: $sessionMetadata.saveAsEntityPath
				: ""}
		</div>

		<div data-tauri-drag-region class="flex flex-row items-center justify-end text-white">
			<div class="h-full p-4 hover:bg-neutral-700 active:bg-neutral-600" on:click={appWindow.minimize}>
				<svg fill="none" stroke="currentColor" width="16px" stroke-width="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" d="M18 12H6" />
				</svg>
			</div>
			<div class="h-full p-4 hover:bg-neutral-700 active:bg-neutral-600" on:click={appWindow.toggleMaximize}>
				<svg fill="none" stroke="currentColor" width="16px" stroke-width="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M16.5 8.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v8.25A2.25 2.25 0 006 16.5h2.25m8.25-8.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-7.5A2.25 2.25 0 018.25 18v-1.5m8.25-8.25h-6a2.25 2.25 0 00-2.25 2.25v6"
					/>
				</svg>
			</div>
			<div class="h-full p-4 hover:bg-red-600 active:bg-red-700" on:click={appWindow.close}>
				<svg fill="none" stroke="currentColor" width="16px" stroke-width="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</div>
		</div>

		<SideNav bind:isOpen={isSideNavOpen} rail class={$appSettings.compactMode ? "compact" : ""}>
			<SideNavItems>
				<SideNavLink
					icon={Data2}
					text="Metadata"
					href="#"
					on:click={() => {
						$saveWorkAndCallback = async () => {
							goto("/metadata")
						}
					}}
					isSelected={$page.url.pathname == "/metadata"}
				/>
				<SideNavDivider />
				<SideNavLink
					icon={Edit}
					text="Overrides"
					href="#"
					on:click={() => {
						$saveWorkAndCallback = async () => {
							goto("/overrides")
						}
					}}
					isSelected={$page.url.pathname == "/overrides"}
				/>
				<SideNavDivider />
				<SideNavLink
					icon={TreeViewIcon}
					text="Tree View"
					href="#"
					on:click={() => {
						$saveWorkAndCallback = async () => {
							goto("/tree")
						}
					}}
					isSelected={$page.url.pathname == "/tree"}
				/>
				{#if $appSettings.gameFileExtensions}
					<SideNavDivider />
					<SideNavLink
						icon={DataUnstructured}
						text="Graph View"
						href="#"
						on:click={() => {
							$saveWorkAndCallback = async () => {
								goto("/graph")
							}
						}}
						isSelected={$page.url.pathname == "/graph"}
					/>
				{/if}
				<SideNavDivider />
				<SideNavLink
					icon={Settings}
					text="Settings"
					href="#"
					on:click={() => {
						$saveWorkAndCallback = async () => {
							goto("/settings")
						}
					}}
					isSelected={$page.url.pathname == "/settings"}
				/>
				{#if $appSettings.enableLogRocket}
					<SideNavDivider />
					<SideNavLink icon={WarningAlt} href="#" text="Report Issue" on:click={() => (reportIssueModalOpen = true)} />
				{/if}
			</SideNavItems>
		</SideNav>
	</header>
	<Content class={$appSettings.compactMode ? "compact" : ""}>
		<div class={$appSettings.compactMode ? "h-[calc(100vh-2rem)]" : "px-16 h-[90vh]"}>
			<SplitPanes theme="">
				{#if $workspaceData.path}
					<Pane size={15}>
						<div class="pt-2 px-3">
							<h1 class="flex-grow">Workspace</h1>
						</div>
						<div class="ml-2 max-h-[40vh] overflow-x-hidden">
							<FileTree
								directory={$workspaceData.path}
								bind:this={fileTree}
								on:selectionChange={({ detail }) => {
									$saveWorkAndCallback = async () => {
										// save old file
										if ($appSettings.autoSaveOnSwitchFile) {
											if ($sessionMetadata.originalEntityPath && !$sessionMetadata.loadedFromGameFiles) {
												if ($sessionMetadata.saveAsPatch) {
													await writeTextFile("entity.json", await getEntityAsText(), { dir: BaseDirectory.App })

													await Command.sidecar("sidecar/quickentity-rs", [
														"patch",
														"generate",
														"--input1",
														String($sessionMetadata.originalEntityPath),
														"--input2",
														await join(await appDir(), "entity.json"),
														"--output",
														String($sessionMetadata.saveAsPatchPath),
														"--format-fix"
													]).execute()

													$sessionMetadata.loadedFromGameFiles = false

													breadcrumb("entity", "Saved to patch (original path) when switching workspace file")
												} else {
													await writeTextFile($sessionMetadata.saveAsEntityPath, await getEntityAsText())

													$sessionMetadata.loadedFromGameFiles = false

													breadcrumb("entity", "Saved to file (original path) when switching workspace file")
												}
											}
										}

										// load new file
										if (detail[1].node.id.endsWith("entity.json")) {
											$sessionMetadata.originalEntityPath = detail[1].node.id
											$sessionMetadata.saveAsPatch = false
											$sessionMetadata.saveAsEntityPath = $sessionMetadata.originalEntityPath
											$sessionMetadata.loadedFromGameFiles = false
											$entity = await getEntityFromText(await readTextFile(detail[1].node.id))

											breadcrumb("entity", `Loaded ${$entity.tempHash} from workspace file`)
										} else if (detail[1].node.id.endsWith("entity.patch.json")) {
											let patch = json.parse(await readTextFile(detail[1].node.id))
											let entityPath

											if ($appSettings.gameFileExtensions && (await exists(await join($appSettings.gameFileExtensionsDataPath, "TEMP", patch.tempHash + ".TEMP.entity.json")))) {
												await extractForInspection(patch.tempHash, Number(patch.patchVersion))

												entityPath = await join(await appDir(), "inspection", "originalEntity.json")
											} else {
												let x = await open({
													multiple: false,
													title: "Select the original entity JSON",
													filters: [
														{
															name: "QuickEntity JSON",
															extensions: ["json"]
														}
													]
												})

												if (!x || Array.isArray(x)) return

												entityPath = x
											}

											if (Number(patch.patchVersion) < 6) {
												await Command.sidecar("sidecar/quickentity-3", [
													"patch",
													"apply",
													"--permissive",
													"--input",
													entityPath,
													"--patch",
													detail[1].node.id,
													"--output",
													await join(await appDir(), "patched.json")
												]).execute()
											} else {
												await Command.sidecar("sidecar/quickentity-rs", [
													"patch",
													"apply",
													"--permissive",
													"--input",
													entityPath,
													"--patch",
													detail[1].node.id,
													"--output",
													await join(await appDir(), "patched.json")
												]).execute()
											}

											$sessionMetadata.saveAsPatch = true
											$sessionMetadata.saveAsPatchPath = detail[1].node.id
											$sessionMetadata.loadedFromGameFiles = false
											$sessionMetadata.originalEntityPath = entityPath
											$entity = await getEntityFromText(await readTextFile(await join(await appDir(), "patched.json")))

											breadcrumb("entity", `Loaded ${$entity.tempHash} from workspace patch`)
										}
									}
								}}
							/>
						</div>
						<div class="pt-2 px-3">
							<h1>Game files</h1>
							{#each [...new Set($workspaceData.ephemeralFiles)] as hash}
								<Button
									style="width: 100%"
									kind={hash == $entity.tempHash && $sessionMetadata.loadedFromGameFiles ? "secondary" : "tertiary"}
									on:click={async () => {
										$saveWorkAndCallback = async () => {
											// save old file
											if ($appSettings.autoSaveOnSwitchFile) {
												if ($sessionMetadata.originalEntityPath && !$sessionMetadata.loadedFromGameFiles) {
													if ($sessionMetadata.saveAsPatch) {
														await writeTextFile("entity.json", await getEntityAsText(), { dir: BaseDirectory.App })

														await Command.sidecar("sidecar/quickentity-rs", [
															"patch",
															"generate",
															"--input1",
															String($sessionMetadata.originalEntityPath),
															"--input2",
															await join(await appDir(), "entity.json"),
															"--output",
															String($sessionMetadata.saveAsPatchPath),
															"--format-fix"
														]).execute()

														$sessionMetadata.loadedFromGameFiles = false

														breadcrumb("entity", "Saved to patch (original path) when switching to ephemeral file")
													} else {
														await writeTextFile($sessionMetadata.saveAsEntityPath, await getEntityAsText())

														$sessionMetadata.loadedFromGameFiles = false

														breadcrumb("entity", "Saved to file (original path) when switching to ephemeral file")
													}
												}
											}

											// load game file
											await extractForInspection(hash, 6)

											$sessionMetadata.originalEntityPath = await join(await appDir(), "inspection", "originalEntity.json")
											$sessionMetadata.saveAsPatch = false
											$sessionMetadata.saveAsEntityPath = $sessionMetadata.originalEntityPath
											$sessionMetadata.loadedFromGameFiles = true

											$entity = await getEntityFromText(await readTextFile(await join(await appDir(), "inspection", "originalEntity.json")))

											fileTree.deselect()

											breadcrumb("entity", `Loaded ${$entity.tempHash} as ephemeral file`)
										}
									}}
								>
									{hash}
									{#if $appSettings.gameFileExtensions}
										{#await $intellisense.getEntityByFactory(hash) then data}
											{#if data}
												({data.entities[data.rootEntity].name})
											{/if}
										{/await}
										{#await (async () => {
											const files = await $intellisense.getWorkspaceFiles()
											for (const file of files) {
												if ((await $intellisense.readJSONFile(file)).tempHash === hash) {
													return true
												}
											}
											return false
										})() then altered}
											{#if altered}
												(vanilla copy)
											{/if}
										{/await}
									{/if}
								</Button>
								<div class="mt-2" />
							{/each}
						</div>
					</Pane>
				{/if}
				<Pane>
					<slot />
				</Pane>
			</SplitPanes>
		</div>
	</Content>
	<div class="absolute h-screen top-0 right-2" style="z-index: 9999">
		<div class="h-screen flex flex-col-reverse content-end pb-4">
			{#each displayNotifications as { kind, title, subtitle } (title)}
				<div in:fly={{ x: 100 }} out:fade animate:flip>
					<ToastNotification hideCloseButton {kind} {title} {subtitle} />
				</div>
			{/each}
		</div>
	</div>
	<Modal
		bind:open={askGameFileModalOpen}
		modalHeading="Load game file"
		primaryButtonText="Load"
		secondaryButtonText="Cancel"
		on:click:button--secondary={() => (askGameFileModalOpen = false)}
		on:submit={async () => {
			let x = askGameFileModalResult.trim()
			if (x.includes(":")) {
				x = ("00" + md5(x).slice(2, 16)).toUpperCase()
			}

			askGameFileModalOpen = false

			await extractForInspection(x, 6)

			$sessionMetadata.originalEntityPath = await join(await appDir(), "inspection", "originalEntity.json")
			$sessionMetadata.saveAsPatch = false
			$sessionMetadata.saveAsEntityPath = $sessionMetadata.originalEntityPath
			$sessionMetadata.loadedFromGameFiles = true

			$entity = await getEntityFromText(await readTextFile(await join(await appDir(), "inspection", "originalEntity.json")))

			$workspaceData.ephemeralFiles = [...$workspaceData.ephemeralFiles, x]

			breadcrumb("entity", `Loaded ${$entity.tempHash} from game files`)

			goto("/tree")
		}}
	>
		<p>What game file would you like to load? Give either the hash or the path.</p>
		<br />
		<TextInput bind:value={askGameFileModalResult} labelText="Hash or path of game file" placeholder="00123456789ABCDE" />
	</Modal>
	<Modal
		bind:open={reportIssueModalOpen}
		modalHeading="Report issue"
		primaryButtonText="Send report"
		secondaryButtonText="Cancel"
		on:click:button--secondary={() => (reportIssueModalOpen = false)}
		on:submit={async () => {
			reportIssueModalOpen = false

			Sentry.captureMessage(reportIssueModalIssue, reportIssueModalSeverity)

			$addNotification = {
				kind: "success",
				title: "Sent report",
				subtitle: "A report has been sent, along with a log of some of the recent things you did."
			}
		}}
	>
		<p>What kind of issue are you reporting?</p>
		<br />
		<Select
			labelText="Type"
			on:change={({ detail }) => {
				reportIssueModalSeverity = detail
			}}
		>
			<option selected={reportIssueModalSeverity == "info"} value="info">Suggestion</option>
			<option selected={reportIssueModalSeverity == "warning"} value="warning">Minor Issue</option>
			<option selected={reportIssueModalSeverity == "error"} value="error">Major Issue</option>
		</Select>
		<br />
		<TextInput bind:value={reportIssueModalIssue} labelText="Description (be concise)" placeholder="XYZ doesn't work; ABC happens when I do DEF" />
	</Modal>
{/if}

<style global>
	.bx--content {
		background-color: initial;
	}

	.bx--toast-notification:first-child {
		@apply mt-0;
	}

	code {
		font-family: "Fira Code", "IBM Plex Mono", "Menlo", "DejaVu Sans Mono", "Bitstream Vera Sans Mono", Courier, monospace;
	}

	a.bx--header__menu-item:hover[disabled] {
		background-color: inherit;
		color: inherit;
	}

	.splitpanes__pane {
		@apply bg-[#202020] overflow-auto;
	}

	.splitpanes__splitter {
		background-color: #262626;
		position: relative;
	}

	.splitpanes--vertical > .splitpanes__splitter {
		cursor: col-resize;
		width: 5px;
	}

	.splitpanes--horizontal > .splitpanes__splitter {
		cursor: row-resize;
		height: 5px;
	}

	.splitpanes--vertical > .splitpanes__splitter:before {
		left: -2.5px;
		right: -2.5px;
		height: 100%;
	}

	.splitpanes--horizontal > .splitpanes__splitter:before {
		top: -2.5px;
		bottom: -2.5px;
		width: 100%;
	}

	.bx--toast-notification__caption {
		display: none;
	}

	.bx--inline-loading__animation {
		margin-right: 0px;
	}

	.bx--tree .bx--tree-node {
		background-color: inherit;
	}

	/* Compact mode styles */
	.bx--content.compact {
		padding: 0 0 0 2rem;
	}

	.compact .bx--tile {
		padding: 0.2rem;
		min-height: auto;
	}

	.compact .bx--search-input,
	.compact .bx--text-input,
	.bx--select-input {
		height: 2rem;
	}

	.compact .bx--btn {
		min-height: auto;
		padding-top: 0.2rem;
		padding-bottom: 0.2rem;
	}

	.compact h1 {
		font-size: 1.75rem;
	}

	.compact h2 {
		font-size: 1.5rem;
	}

	.compact h3 {
		font-size: 1.3rem;
	}

	.bx--header.compact {
		height: 2rem;
	}

	.bx--header.compact ~ .bx--content {
		margin-top: 2rem;
	}

	.compact .bx--side-nav--rail {
		width: 2rem;
	}

	.compact .bx--side-nav--ux {
		top: 2rem;
	}

	.compact a.bx--side-nav__link {
		padding: 0 0.5rem;
	}
</style>
