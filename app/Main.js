import { createEmitter } from '@mwni/events'
import createParams from './Params.js'
import createApi from './Api.js'


export default ({ apiUrl }) => {
	let events = createEmitter()
	let app = {
		...events,
		model: undefined,
		models: [],
		epochs: [],
		params: createParams(),
		api: createApi({ endpoint: apiUrl }),

		setModel(model){
			app.model = model
			app.emit('update')
		},

		get currentPrompt(){
			return app.params.get('prompt')
		},

		willCreateNewEpoch(){
			let epoch = app.epochs[app.epochs.length - 1]
			return !epoch || !isSamePrompt(epoch.prompt, app.currentPrompt) || epoch.model.id !== app.model.id
		},

		createEpoch(){
			let epoch = {
				...createEmitter(),
				prompt: app.currentPrompt,
				seed: 1 + Math.floor(1000000 * Math.random()),
				date: Math.floor(Date.now() / 1000),
				results: [],
				model: app.model
			}

			app.epochs.push(epoch)
			app.emit('update')

			return epoch
		},

		async getParams(){
			if(!app.model)
				throw { message: 'Model list has not been loaded, yet.' }

			await app.params.validate()

			let { aspect, ...params } = app.params.data
			let width = 512
			let height = 512

			return {
				...params,
				model: app.model.id,
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

		async refreshModelsList(){
			try{
				app.models = await this.api.getModels()
			}catch{
				await new Promise(resolve => setTimeout(resolve, 1000))
				return await app.refreshModelsList()
			}
			

			if(!app.model){
				app.model = app.models.find(
					model => model.id === 'stable-diffusion-v1-5'
				)
			}

			app.emit('update')
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
					message: e.message || 'Some parameters were invalid. Check the inputs that were marked red.'
				})
			}
		},

		get busy(){
			return app.epochs.some(
				epoch => epoch.results.some(
					result => result.computeHandle
				)
			)
		},

		get unseenCount(){
			return app.epochs.reduce(
				(count, epoch) => count + epoch.results.filter(
					result => !result.computeHandle && !result.seen
				).length,
				0
			)
		}
	}

	app.params.on('update', () => {
		if(app.epochs.length === 0)
			return

		let last = app.epochs[app.epochs.length - 1]
		
		last.sealed = app.willCreateNewEpoch()
		last.emit('update')
	})

	app.refreshModelsList()

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