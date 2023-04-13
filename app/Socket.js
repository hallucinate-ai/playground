import { createEmitter } from '@mwni/events'


export default ({ endpoint }) => {
	let emitter = createEmitter()
	let queue = []
	let ws

	function connect(){
		ws = new WebSocket(endpoint)

		ws.onopen = () => {
			console.log(`connection to ${endpoint} accepted`)
	
			ws.onmessage = ev => {
				let { event, ...payload } = JSON.parse(ev.data)
	
				emitter.emit(event, payload)
			}
	
			ws.onerror = undefined
			setTimeout(didConnect, 1)
		}
	
		ws.onerror = error => {
			queue.length = 0
			ws.onclose = undefined
			emitter.emit('disconnect', { error })
			console.warn(`error when connecting to ${endpoint}:`, error)
			setTimeout(connect, 3000)
		}
	
		ws.onclose = event => {
			queue.length = 0
			emitter.emit('disconnect', { event })
			console.warn(`connection to ${endpoint} lost`)
			setTimeout(connect, 3000)
		}
	}

	function didConnect(){
		for(let payload of queue){
			send(payload)
		}
	}

	function send(payload){
		if(ws.readyState !== 1){
			queue.push(payload)
			return
		}

		ws.send(JSON.stringify(payload))
	}

	connect()

	return { ...emitter, send }
}