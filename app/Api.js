import { createEmitter } from '@mwni/events'
import { decodeBase64, encodeBase64 } from '../lib/base64.js'
import createSocket from './Socket.js'


const chunkSize = 25000


export default ({ endpoint }) => {
	let callbacks = {}
	let handles = {}
	let receiveId
	let receiveBuffer
	let receiveBufferOffset
	let idStamp = 0

	let socket = createSocket({
		endpoint: `${endpoint}?version=1.0`
	})

	socket.on('disconnect', ({ error, event }) => {
		let message
		
		if(error){
			message = `Can not connect to hallucinate cloud: ${
				error.message || error.reason || `Server is unreachable.`
			}`
		}else{
			message = event.code === 4001
				? `Your version of the plugin is no longer compatible with hallucinate cloud. Please update the plugin.`
				: `Unexpectedly lost connection to the hallucinate cloud.`
		}

		for(let { reject } of Object.values(callbacks)){
			reject({ message })
		}

		for(let handle of Object.values(handles)){
			handle.emit('cancel', { message })
		}

		callbacks = {}
		handles = {}
	})

	socket.on('models', ({ models }) => {
		callbacks.models.resolve(models)
	})

	socket.on('progress', ({ id, value, stage }) => {
		console.log(`task(${id}) progress: ${stage} ${value}`)

		Object.assign(handles[id], {
			stage: 'progress',
			stage,
			progress: value
		})

		handles[id].emit('status')
	})

	socket.on('queue', ({ id, position }) => {
		console.log(`task(${id}) position in queue: ${position}`)

		Object.assign(handles[id], {
			stage: 'queue',
			position
		})

		handles[id].emit('status')
	})
	
	socket.on('error', ({ id, message }) => {
		console.log(`task(${id}) failed: ${message}`)
		
		handles[id].emit('cancel', { message })
	})

	socket.on('result', ({ id, length }) => {
		receiveId = id
		receiveBuffer = new Uint8Array(length)
		receiveBufferOffset = 0

		console.log(`task(${id}) finished: expecting ${length} bytes`)

		Object.assign(handles[id], {
			stage: 'progress',
			stage: 'receive',
			progress: undefined
		})

		handles[id].emit('status')
	})

	socket.on('chunk', ({ id, blob }) => {
		let chunk = decodeBase64(blob)

		receiveBuffer.set(chunk, receiveBufferOffset)
		receiveBufferOffset += chunk.length

		console.log('received bytes:', receiveBufferOffset)

		if(receiveBufferOffset >= receiveBuffer.length){
			console.log('received full image')

			handles[id].emit('result', {
				image: receiveBuffer.slice()
			})
		}
	})

	return {
		async getModels(){
			socket.send({ command: 'list_models' })
		
			return new Promise((resolve, reject) => {
				callbacks.models = { resolve, reject }
			})
		},

		generate({ image, mask, ...args }){
			let id = `D${idStamp++}`
			let files = {}
			let handle = handles[id] = {
				...createEmitter(),
				id,
				stage: 'upload',
				progress: 0,
				cancel(){
					handle.emit('cancel', { userCancel: true })
					socket.send({
						command: 'abort',
						id
					})
				}
			}

			handle.on('cancel', () => {
				delete handles[id]
			})

			for(let [key, blob] of [['input_image', image], ['mask_image', mask]]){
				if(!blob)
					continue

				let fileId = files[key] = `I${idStamp++}`

				socket.send({
					command: 'upload_image',
					id: fileId,
					blob: encodeBase64(blob)
				})

				console.log(`uploaded ${key} as ${fileId}`)
			}

			socket.send({
				command: 'diffuse',
				id,
				...files,
				...args
			})

			console.log(`submitted task (${id}):`, { ...files, ...args })

			return handle
		},

		cancel(sequence){
			send('cancel', { sequence })
		}
	}
}