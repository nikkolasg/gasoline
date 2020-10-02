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
