import { Child, Command } from "@tauri-apps/api/shell"

class RPKGInstance {
	rpkgCommand: Command
	rpkgProcess: Child

	output: string
	previousOutput: string

	initialised: boolean
	ready: boolean

	waitingFor: string | null = null

	constructor() {
		this.rpkgCommand = Command.sidecar("sidecar/rpkg-cli", ["-i"])
		this.output = ""
		this.previousOutput = ""
		this.initialised = false
		this.ready = false

		this.rpkgCommand.stdout.on("data", (data) => {
			this.output += String(data)

			if (this.output.endsWith("usage info.\r\r") || this.output.endsWith("TEXT data is LZ4ed: True\r\r") || this.output.endsWith("TEXT data is LZ4ed: False\r\r")) {
				if (!this.initialised) {
					this.initialised = true
					this.ready = false
					this.output = ""
					this.previousOutput = ""
					return
				}

				this.previousOutput = this.output
				this.output = ""
				this.ready = true
			}
		})
	}

	async waitForInitialised() {
		this.rpkgProcess = await this.rpkgCommand.spawn()
		// yes, bad, pls tell me how to make good
		return new Promise(waitForInitialised.bind(this))
	}

	async callFunction(func: string): Promise<string> {
		console.log("Calling", func)

		this.ready = false

		await this.rpkgProcess.write(func)
		await this.rpkgProcess.write("\n")

		return new Promise(waitForReady.bind(this))
	}

	async exit() {
		await this.rpkgProcess.kill()
	}
}

function waitForInitialised(this: RPKGInstance, resolve: (result: string) => unknown) {
	// yes, bad, pls tell me how to make good
	if (this.initialised) {
		resolve(this.previousOutput)
	} else {
		setTimeout(waitForInitialised.bind(this, resolve), 100)
	}
}

function waitForReady(this: RPKGInstance, resolve: (result: string) => unknown) {
	// yes, bad, pls tell me how to make good
	if (this.ready) {
		resolve(this.previousOutput.slice(0, -8).replace(/Running command: .*\r\n\r\n/g, ""))
	} else {
		setTimeout(waitForReady.bind(this, resolve), 100)
	}
}

export default RPKGInstance
