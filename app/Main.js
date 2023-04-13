import { createEmitter } from '@mwni/events'
import createParams from './Params.js'
import createApi from './Api.js'


export default ({ apiUrl }) => {
	let events = createEmitter()
	let app = {
		...events,
		epochs: [],
		params: createParams(),
		api: createApi({ endpoint: apiUrl }),

		get currentPrompt(){
			return app.params.get('prompt')
		},

		willCreateNewEpoch(){
			let epoch = app.epochs[app.epochs.length - 1]
			return !epoch || !isSamePrompt(epoch.prompt, app.currentPrompt)
		},

		createEpoch(){
			let epoch = {
				...createEmitter(),
				prompt: app.currentPrompt,
				seed: 1 + Math.floor(1000000 * Math.random()),
				date: Math.floor(Date.now() / 1000),
				results: []
			}

			app.epochs.push(epoch)
			app.emit('update')

			return epoch
		},

		async getParams(){
			await app.params.validate()

			let { aspect, ...params } = app.params.data
			let width = 512
			let height = 512

			return {
				...params,
				width,
				height
			}
		},

		removeResult({ epoch, result }){
			epoch.results.splice(epoch.results.indexOf(result), 1)
			epoch.emit('update')

			if(epoch.results.length === 0){
				app.epochs.splice(app.epochs.indexOf(epoch), 1)
				app.emit('update')
			}
		},
		
		async generate(){
			try{
				let params = await app.getParams()

				let epoch = app.willCreateNewEpoch()
					? app.createEpoch()
					: app.epochs[app.epochs.length - 1]
			
				
				let seed = epoch.seed++
				let computeHandle = app.api.generate({
					...params,
					seed
				})

				let result = {
					params,
					seed,
					computeHandle
				}
			
				computeHandle.on('cancel', ({ message }) => {
					app.removeResult({ epoch, result })
					
					if(message){
						app.emit('error', {
							title: `Generate failed`,
							message
						})
					}
				})
			
				computeHandle.on('result', ({ image }) => {
					result.image = image
					result.computeHandle = undefined
					epoch.emit('update')
				})

				epoch.results.push(result)
				epoch.emit('update')
			}catch(e){
				app.emit('error', {
					title: `Can not generate`,
					message
				})
			}
		}
	}

	return app
}



function isSamePrompt(a, b){
	return a.trim() === b.trim()
}

/*
export function addResult({ epoch, result }){
	Object.assign(result, {
		path: `${epoch.folder}/${result.seed}.png`
	})

	epoch.results.push(result)

	m.redraw()
}

export function removeResult({ epoch, result }){
	epoch.results.splice(
		epoch.results.indexOf(result),
		1
	)

	if(epoch.results.length === 0){
		deleteEpoch(epoch)
	}

	m.redraw()
}

export function putResultImage({ epoch, result, image }){
	result.uri = URL.createObjectURL(
		new Blob([image])
	)

	delete result.computeHandle

	writeBinary(result.path, image)
	storeEpoch(epoch)

	m.redraw()
}

export function willCreateNewEpoch(){
	let epoch = state.epochs[state.epochs.length - 1]
	return !epoch || !isSamePrompt(epoch.prompt, state.prompt)
}

export async function createEpoch(){
	let epoch = {
		mode: state.mode,
		prompt: state.prompt,
		xid: generateXid(),
		seed: 1 + Math.floor(1000000 * Math.random()),
		date: Math.floor(Date.now() / 1000),
		results: []
	}

	epoch.folder = `epochs/${epoch.mode}/${epoch.xid}`

	try{
		await createDataFolder(epoch.folder)
		await storeEpoch(epoch)
	}catch(error){
		console.log(`failed to write epoch to drive:`, error)
	}

	setState({
		epochs: [
			...state.epochs,
			epoch
		]
	})

	return epoch
}*/