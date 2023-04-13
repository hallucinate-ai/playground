import { createEmitter } from '@mwni/events'
import createParams from './Params.js'


export default ({ apiUrl }) => {
	let events = createEmitter()
	let app = {
		...events,
		epochs: [],
		params: createParams(),

		get currentPrompt(){
			return app.params.get('prompt')
		},

		willCreateNewEpoch(){
			let epoch = app.epochs[app.epochs.length - 1]
			return !epoch || !isSamePrompt(epoch.prompt, params.prompt)
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