export function encodeBase64(buffer){
	let CHUNK_SIZE = 0x8000
	let index = 0
	let length = buffer.length
	let result = ''
	let slice

	while (index < length) {
		slice = buffer.subarray(index, Math.min(index + CHUNK_SIZE, length))
		result += String.fromCharCode.apply(null, slice)
		index += CHUNK_SIZE
	}

	return btoa(result)
}

export function decodeBase64(str){
	let binstr = atob(str)
	let bytes = new Uint8Array(binstr.length)

	for(let i=0; i<binstr.length; i++){
		bytes[i] = binstr.charCodeAt(i)
	}

	return bytes
}