export const roundsPerDay = 2 * 60 * 24
export const roundsInDeadline = 2 * 30 
export const deadlines = 48
export const maxSectorsPerPost = 2349
export function wpostToSectors(wpost) { return maxSectorsPerPost * wpost }
export function sectorsToPost(sectors) { return sectors / maxSectorsPerPost }
export function gbToPB(v) { return v/1024/1024 }
export function pbToGB(v) { return v*1024*1024}
// Returns the estimated growthRate per day assuming this number of prove
// commits at one height (or an average etc)
export function growthRate(prove) { return gbToPB(prove * 32) * roundsPerDay }
export function roundsInDays(rounds) { return Math.ceil(rounds / 2 / 60 / 24) }

export function objectMap(obj, fn) {
    return Object.entries(obj).map(
      ([k, v], i) => fn(v, k, i)
    )
}


export function sizeToString(s) {
    var biUnits = ["B", "KiB", "MiB", "GiB", "TiB", "PiB", "EiB"]
	var unit = 0
	while (s >= 1024 && unit < biUnits.length-1) {
		s /= 1024
		unit++
	}
	return `${s} ${biUnits[unit]}`
}

export function sizeToSectors(s) {
    return s/1024/1024/1024/32
}

export function attoToFIL(atto) {
    return atto * BigInt(10)**-18
}
