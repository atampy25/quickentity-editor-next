import * as LosslessJSON from "lossless-json"

import Decimal from "decimal.js"

function reviver(key: string, value: any) {
	if (typeof value === "string" && value.startsWith("~|")) {
		return new Decimal(value.slice(2))
	} else {
		return value
	}
}

function replacer(key: string, value: any) {
	if (value instanceof Decimal) {
		return new LosslessJSON.LosslessNumber(value.toString())
	} else {
		return value
	}
}

export const parse = (val: string) => JSON.parse(val.replace(/:\s*([-+Ee0-9.]+)/g, ': "~|$1"'), reviver)
export const stringify = (val: Record<string, any>, sp: string | undefined = undefined) => LosslessJSON.stringify(val, replacer, sp)

export default {
	parse,
	stringify
}
