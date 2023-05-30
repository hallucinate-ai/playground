import { Button, Component, Fragment, HStack, Icon, Image, Interactive, Progress, Text, VStack } from '@architekt/ui'
import iconFolderOpen from '../assets/folder-open.svg'
import iconFolderClosed from '../assets/folder-closed.svg'
import Stylesheet from './Results.scss'
import { toRankNumber } from '../lib/formatting.js'


const progressStageLabels = {
	upload: 'Uploading',
	download_model: 'Downloading model',
	wait: 'Waiting for worker',
	init: 'Warming up',
	encode: 'Encoding',
	sample: 'Sampling',
	decode: 'Decoding',
	receive: 'Receiving',
}



export default Component(({ ctx }) => {
	let redraw = ctx.redraw.bind(ctx)
	let playground = ctx.upstream.playground
	let openEpoch = playground.getMatchingEpoch()
	let updateOpenEpoch = () => {
		let e = playground.getMatchingEpoch()

		if(e !== openEpoch){
			openEpoch = e
			redraw()
		}
	}

	playground.on('update', redraw)
	playground.params.on('update', updateOpenEpoch)
	ctx.afterDelete(() => playground.off('update', redraw))
	ctx.afterDelete(() => playground.params.off('update', updateOpenEpoch))

	return () => {
		Stylesheet()
		VStack({ class: 'w-full' }, () => {
			EpochPlaceholder()

			if(openEpoch)
				Epoch({ epoch: openEpoch, open: true })

			for(let epoch of playground.epochs.slice().reverse()){
				if(epoch !== openEpoch)
					Epoch({ epoch })
			}
		})
	}
})


const EpochPlaceholder = Component(({ ctx }) => {
	let playground = ctx.upstream.playground
	let redraw = ctx.redraw.bind(ctx)

	playground.params.on('update', redraw)
	ctx.afterDelete(() => playground.params.off('update', redraw))

	return () => {
		if(!playground.getMatchingEpoch()){
			VStack({ class: 'w-full mb-10' }, () => {
				if(playground.currentPrompt.length > 0)
					EpochHeader({
						prompt: playground.currentPrompt,
						model: playground.model.id,
						open: true,
						onToggle: () => null
					})

				GenerateTrigger()
			})
		}
	}
})

const EpochHeader = Fragment(({ ctx, prompt, model: modelId, open, onToggle }) => {
	let playground = ctx.global.playground
	let model = playground.models.find(
		model => model.id === modelId
	)

	HStack({ class: 'w-full items-center justify-between mb-4' }, () => {
		HStack({ class: 'items-center gap-x-2' }, () => {
			Interactive({ onTap: onToggle }, () => {
				Icon({
					asset: open
						? iconFolderOpen
						: iconFolderClosed
				})
			})
			Text({
				class: 'text-xs',
				text: prompt
			})
		})
		if(model){
			HStack({ class: 'items-center gap-x-2' }, () => {
				Image({
					class: 'w-4 h-4 rounded-full shrink-0 object-cover',
					url: model.thumbnails[0]
				})
				Text({
					class: 'text-xs text-content2',
					text: model.name
				})
			})
		}
	})
})

const Epoch = Component(({ ctx, epoch, open }) => {
	let redraw = ctx.redraw.bind(ctx)

	epoch.on('update', redraw)
	ctx.afterDelete(() => epoch.off('update', redraw))

	return ({ epoch: newEpoch }) => {
		if(epoch !== newEpoch)
			return ctx.teardown()

		VStack({ class: 'w-full mb-10' }, () => {
			EpochHeader({
				prompt: epoch.prompt,
				model: epoch.model,
				open: !epoch.minimized,
				onToggle: () => {
					epoch.minimized = !epoch.minimized
					epoch.emit('update')
				}
			})
	
			if(!epoch.minimized){
				HStack({ class: 'gap-4 flex-wrap' }, () => {
					for(let result of epoch.images){
						if(result.computeHandle){
							Status({ computeHandle: result.computeHandle })
						}else{
							Result({ result })
						}
					}
	
					if(open)
						GenerateTrigger()
				})
			}
		})
	}
})

const Status = Component(({ ctx, computeHandle }) => {
	let redraw = ctx.redraw.bind(ctx)

	computeHandle.on('status', redraw)
	ctx.afterDelete(() => computeHandle.off('status', redraw))

	return () => {
		let text

		if(computeHandle.stage === 'queue'){
			text = `${computeHandle.position}${toRankNumber(computeHandle.position)} in queue`
		}else{
			text = progressStageLabels[computeHandle.stage]
		}

		VStack({ class: 'tile status' }, () => {
			Button({
				class: 'cancel btn btn-xs btn-rounded absolute top-3 right-3',
				text: '✕',
				onTap: computeHandle.cancel
			})
			VStack({ class: 'h-12 justify-center' }, () => {
				if(computeHandle.progress)
					Progress({
						class: 'progress h-2 w-24',
						value: computeHandle.progress
					}, () => {})
				else
					VStack({ class: 'spinner-dot-intermittent' }, () => {})
			})
			Text({ text })
		})
	}
})

const Result = ({ result }) => {
	result.seen = true

	VStack({ class: 'tile result' }, () => {
		Image({
			blob: result.image,
			url: result.url
		})
	})
}

const GenerateTrigger = Fragment(({ ctx }) => {
	Interactive({ onTap: ctx.upstream.playground.generate }, () => {
		VStack({ class: 'tile trigger' }, () => {
			Text({
				text: 'Click to generate'
			})
		})
	})
})

/*
const Epoch = {
	view: ({ attrs }) => {
		let items = []
		let epoch = attrs.epoch
		let sealed = attrs.sealed

		let numItems = epoch.results.length
		let numItemsPadded = Math.max(2, Math.ceil((numItems + 1) / 2) * 2)
		let placedGenerateTrigger = false

		for(let i=0; i<numItemsPadded; i++){
			let result = epoch.results[i]

			if(result){
				if(result.computeHandle){
					items.push(
						result.computeHandle.stage === 'queue'
							? <InQueue handle={result.computeHandle}/>
							: <Progress handle={result.computeHandle}/>
					)
				}else{
					items.push(<Result result={result}/>)
				}
			}else if(!sealed){
				if(!placedGenerateTrigger){
					items.push(<GenerateTrigger/>)
					placedGenerateTrigger = true
				}else{
					items.push(<Stub/>)
				}
			}
		}

		return (
			<div class="epoch">
				<div class="head" onclick={() => toggleEpochMinimization(epoch)}>
					<FolderIcon open={!epoch.minimized}/>
					<span>{attrs.epoch.prompt}</span>
				</div>
				{
					!epoch.minimized && 
					(
						<div class="items">
							{ items }
						</div>
					)
				}
			</div>
		)
	}
}

const EpochPlaceholder = {
	view: () => (
		<div class="epoch placeholder">
			{
				appState.prompt.length > 0 &&
				(
					<div class="head">
						<FolderIcon open={true}/>
						<span>{appState.prompt}</span>
					</div>
				)
			}
			<div class="items">
				<GenerateTrigger/>
				<Stub/>
			</div>
		</div>
	)
}



const Stub = {
	view: () => (
		<div class="placeholder stub">
			<div/>
		</div>
	)
}

const GenerateTrigger = {
	view: () => (
		<div>
			<div class="placeholder generate" onclick={() => generate()}>
				<span>Click to Generate</span>
			</div>
		</div>
	)
}

const Progress = {
	view: ({ attrs }) => (
		<div>
			<div class="placeholder progress">
				{
					attrs.handle.progress
						? <ProgressBar value={attrs.handle.progress}/>
						: null
				}
				<span>{progressStageLabels[attrs.handle.stage]} ...</span>
				<Cancel handle={attrs.handle}/>
			</div>
		</div>
	)
}

const ProgressBar = {
	view: ({ attrs, dom }) => {
		if(dom)
			dom.value = attrs.value

		return <sp-progressbar value={attrs.value} max="1"/>
	}
}

const InQueue = {
	view: ({ attrs }) => (
		<div>
			<div class="placeholder in-queue">
				<div class="pos">{attrs.handle.position}</div>
				<span>In Queue</span>
				<Cancel handle={attrs.handle}/>
			</div>
		</div>
	)
}

const Cancel = {
	view: ({ attrs }) => (
		<div class="cancel" onclick={attrs.handle.cancel}>
			✕
		</div>
	)
}

const Result = {
	oncreate: ({ dom }) => {
		let img = dom.querySelector('img')
		let cap = () => {
			let w = img.naturalWidth
			let h = img.naturalHeight

			if(w / h > 16 / 12)
				img.style.width = '100%'
			else
				img.style.height = '30vw'
		}

		if(img.complete)
			cap()
		else
			img.onload = cap
	},
	view: ({ attrs }) => (
		<div>
			<div class={`image ${appState.previewing === attrs.result ? `active` : ``}`}>
				<div class="wrap">
					<img src={attrs.result.uri} onclick={() => enterPreviewMode(attrs.result)}/>
				</div>
			</div>
		</div>
	)
}
*/