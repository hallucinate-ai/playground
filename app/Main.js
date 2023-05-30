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

		setApiToken(token){
			if(app.apiToken === token)
				return

			app.apiToken = token
			app.epochs = []
			app.loadHistory()
		},

		setModel(model){
			app.model = model
			app.emit('update')
		},

		get currentPrompt(){
			return app.params.get('prompt')
		},

		getMatchingEpoch(){
			return app.epochs.find(
				epoch => isSamePrompt(epoch.prompt, app.currentPrompt) 
					&& epoch.model === app.model.id
			)
		},

		createEpoch(){
			let epoch = {
				...createEmitter(),
				prompt: app.currentPrompt,
				model: app.model.id,
				seed: 1 + Math.floor(1000000 * Math.random()),
				images: [],
			}

			app.epochs.push(epoch)
			app.emit('update')

			return epoch
		},

		sortEpochs(){
			app.epochs.sort((a, b) => {
				return a.images[a.images.length-1].timeCreated - b.images[b.images.length-1].timeCreated
			})
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
			epoch.images.splice(epoch.images.indexOf(result), 1)
			epoch.emit('update')

			if(epoch.images.length === 0){
				app.epochs.splice(app.epochs.indexOf(epoch), 1)
				app.emit('update')
			}
		},
		
		async generate(){
			try{
				let params = await app.getParams()
				let epoch = app.getMatchingEpoch() || app.createEpoch()
				let seed = epoch.seed++

				let computeHandle = app.api.generate({
					...params,
					seed,
					apiToken: app.apiToken
				})

				let result = {
					params: {
						...params,
						seed
					},
					timeCreated: new Date(),
					computeHandle
				}
			
				computeHandle.on('cancel', ({ message }) => {
					app.removeResult({ epoch, result })
					app.emit('compute-update')
					
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
					app.emit('compute-update')
				})

				epoch.images.push(result)
				app.sortEpochs()
				epoch.emit('update')
			}catch(e){
				app.emit('error', {
					title: `Can not generate`,
					message: e.message || 'Some parameters were invalid. Check the inputs that were marked red.'
				})
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

		async loadHistory(){
			try{
				var historyEpochs = await this.api.getHistory({
					apiToken: app.apiToken
				})
			}catch{
				await new Promise(resolve => setTimeout(resolve, 1000))
				return await app.loadHistory()
			}

			for(let { prompt, model, images } of historyEpochs){
				app.epochs.push({
					...createEmitter(),
					prompt,
					model,
					seed: images[images.length-1].params.seed + 1,
					images: images.map(
						({ params, timeCreated, url }) => ({
							...params,
							timeCreated,
							url
						})
					),
				})
			}

			app.emit('update')
		},

		get busy(){
			return app.epochs.some(
				epoch => epoch.images.some(
					result => result.computeHandle
				)
			)
		},

		get unseenCount(){
			return app.epochs.reduce(
				(count, epoch) => count + epoch.images.filter(
					result => !result.computeHandle && !result.seen
				).length,
				0
			)
		}
	}

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