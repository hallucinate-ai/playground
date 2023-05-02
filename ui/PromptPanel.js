import { Component, Fragment, HStack, Icon, Image, Interactive, Overlay, Text, VStack } from '@architekt/ui'
import { Dropdown, Select, Slider, TextInput } from '@architekt/forms'
import { Route } from '@architekt/router'
import iconAspectSquare from '../assets/aspect-square.svg'
import iconAspectLandscape from '../assets/aspect-landscape.svg'
import iconAspectPortrait from '../assets/aspect-portrait.svg'
import Stylesheet from './PromptPanel.scss'
import ModelBrowser from './ModelBrowser.js'



export default Component(({ ctx }) => {
	let playground = ctx.upstream.playground
	let model = playground.params
	let redraw = () => ctx.redraw()

	playground.on('update', redraw)
	model.on('update', redraw)
	ctx.afterDelete(() => playground.off('update', redraw))
	ctx.afterDelete(() => model.off('update', redraw))

	function openModelBrowser(){
		ctx.upstream.route.set({
			path: '%/models'
		})
	}

	return () => {
		Route({ path: '/' })
		Route({ path: '/models' }, () => {
			Overlay(() => {
				ModelBrowser({
					onClose: () => ctx.upstream.route.set({
						path: '.',
						back: true
					})
				})
			})
		})

		Stylesheet()
		VStack({ class: 'w-80 p-6 rounded-xl bg-backgroundSecondary' }, () => {
			VStack({ class: 'form-group mb-8' }, () => {
				VStack({ class: 'form-field w-full' }, () => {
					Text({
						class: 'form-label',
						text: 'Model'
					})
					if(!playground.model)
						ModelCardPlaceholder()
					else
						Interactive({ onTap: openModelBrowser }, () => {
							ModelCard({ model: playground.model })
						})
				})
			})

			VStack({ class: 'form-group mb-8' }, () => {
				VStack({ class: 'form-field w-full' }, () => {
					Text({
						class: 'form-label',
						text: 'Prompt'
					})
					TextInput({
						model,
						key: 'prompt',
						multiline: true,
						class: 'textarea h-24'
					})
				})

				VStack({ class: 'form-field w-full' }, () => {
					Text({
						class: 'form-label',
						text: 'Negative Prompt'
					})
					TextInput({
						model,
						key: 'prompt_negative',
						multiline: true,
						class: 'textarea h-16'
					})
				})
			})

			HStack({ class: 'btn-group mb-8 aspect' }, () => {
				Select({ model, key: 'aspect' }, () => {
					VStack({ class: 'btn h-16', value: 'square' }, () => {
						Icon({
							asset: iconAspectSquare
						})
						Text({
							class: 'text-xs',
							text: 'Square'
						})
					})
					VStack({ class: 'btn h-16', value: 'landscape' }, () => {
						Icon({
							asset: iconAspectLandscape
						})
						Text({
							class: 'text-xs',
							text: 'Landscape'
						})
					})
					VStack({ class: 'btn h-16', value: 'portrait' }, () => {
						Icon({
							asset: iconAspectPortrait
						})
						Text({
							class: 'text-xs',
							text: 'Portrait'
						})
					})
				})
			})
			

			HStack({ class: 'form-group mb-8' }, () => {
				VStack({ class: 'form-field w-full' }, () => {
					Text({
						class: 'form-label',
						text: 'Sampler'
					})
					Dropdown({
						class: 'select',
						model,
						key: 'sampler',
						options: [
							{ value: 'k_lms' },
							{ value: 'k_euler' },
							{ value: 'k_euler_a' },
							{ value: 'k_heun' },
							{ value: 'k_dpm_2' },
							{ value: 'k_dpm_2_a' },
							{ value: 'k_dpmpp_2m' },
						]
					})
				})

				VStack({ class: 'form-field w-full' }, () => {
					Text({
						class: 'form-label',
						text: 'Steps'
					})
					TextInput({
						model,
						key: 'steps',
						type: 'number',
						class: 'input'
					})
				})
			})

			VStack({ class: 'form-field w-full' }, () => {
				Text({
					class: 'form-label',
					text: 'Config Scale'
				})
				HStack({ class: 'w-full gap-x-2 items-center' }, () => {
					Slider({
						model,
						key: 'cfg_scale',
						class: 'range w-full',
						min: 1,
						max: 25,
						step: 0.1
					})
					TextInput({
						model,
						key: 'cfg_scale',
						type: 'number',
						class: 'input w-20'
					})
				})
			})
		})
	}
})


const ModelCard = Fragment(({ model }) => {
	HStack({ class: 'model-card' }, () => {
		Image({
			class: 'w-12 h-12 rounded-md object-cover',
			url: model.thumbnails[0]
		})

		VStack({ class: 'w-full min-w-0' }, () => {
			HStack({ class: 'w-full min-w-0 gap-x-1' }, () => {
				Text({
					class: 'text-xs whitespace-nowrap text-ellipsis overflow-hidden',
					text: model.name
				})

				if(model.nsfw)
					Text({
						class: 'badge badge-xs badge-flat-error',
						text: 'NSFW'
					})
			})
			
			Text({
				class: 'text-xs font-mono text-content2 mt-2',
				text: `ID: ${model.id}`
			})
		})
	})
})


const ModelCardPlaceholder = Fragment(() => {
	HStack({ class: 'model-card' }, () => {
		Text({ class: 'skeleton w-12 h-12 rounded-md' })
	})
})