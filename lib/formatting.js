export function toRankNumber(nr){
	return {'1': 'st', '2': 'nd', '3': 'rd'}[nr] || 'th'
}