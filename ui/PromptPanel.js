import { Component, HStack, Icon, Text, VStack } from '@architekt/ui'
import { createModel, Dropdown, Select, Slider, TextInput } from '@architekt/forms'
import iconAspectSquare from 'asset:../assets/aspect-square.json'
import iconAspectLandscape from 'asset:../assets/aspect-landscape.json'
import iconAspectPortrait from 'asset:../assets/aspect-portrait.json'
import Stylesheet from './PromptPanel.scss'



export default Component(({ ctx }) => {
	let model = ctx.upstream.playground.params
	let redraw = () => ctx.redraw()

	model.on('update', redraw)
	ctx.afterDelete(() => model.off('update', redraw))

	return () => {
		Stylesheet()
		VStack({ class: 'w-80 p-6 rounded-xl bg-backgroundSecondary' }, () => {
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
						key: 'promptNegative',
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