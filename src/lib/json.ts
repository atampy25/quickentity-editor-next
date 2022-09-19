import * as LosslessJSON from "lossless-json"

import Decimal from "decimal.js"

function reviver(key: string, value: any) {
	if (value && value.isLosslessNumber) {
		return new Decimal(value.toString())
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

export const parse = (val: string) => LosslessJSON.parse(val, reviver)
export const stringify = (val: Record<string, any>, sp: string | undefined = undefined) => LosslessJSON.stringify(val, replacer, sp)

export default {
	parse,
	stringify
}
