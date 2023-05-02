import { Button, Checkbox, Component, Fragment, Group, HStack, Icon, Image, Interactive, Text, TextInput, VScroll, VStack } from '@architekt/ui'
import iconHeart from '../assets/heart.svg'


export default Fragment(({ onClose }) => {
	VStack({ class: 'modal' }, () => {
		Interactive({ onTap: onClose }, () => {
			VStack({ class: 'absolute top-0 left-0 w-full h-full cursor-default' })
		})
		VStack({ class: 'modal-content w-full max-w-2xl h-full gap-5' }, () => {
			Button({
				class: 'btn btn-sm btn-circle btn-ghost absolute right-2 top-2',
				text: '✕',
				onTap: onClose
			})
			HStack({ class: 'w-full gap-x-4 items-center' }, () => {
				Text({ 
					class: 'text-xl', 
					text: 'Select Model'
				})
			})
			Browser({ onClose })
		})
	})
})

const Browser = Component(({ ctx, onClose }) => {
	let playground = ctx.upstream.playground
	let filterTerm = ''
	let nsfw = false
	
	function setFilterTerm(term){
		filterTerm = term
		ctx.redraw()
	}

	function toggleNSFW(){
		nsfw = !nsfw
		ctx.redraw()
	}

	return () => {
		let filteredModels = playground.models
			.filter(model => nsfw || !model.nsfw)
			.filter(model => model.name.toLowerCase().includes(filterTerm.toLowerCase()) 
				|| model.id.toLowerCase().includes(filterTerm.toLowerCase()))


		HStack({ class: 'w-full gap-x-2 items-center' }, () => {
			TextInput({
				class: 'input input-xl max-w-full',
				placeholder: 'Search by Name or ID...',
				text: filterTerm,
				onInput: evt => setFilterTerm(evt.target.value)
			})
			Button({ class: 'btn btn-ghost shrink-0', onTap: toggleNSFW }, () => {
				HStack({ class: 'gap-x-2' }, () => {
					Checkbox({
						class: 'checkbox',
						checked: nsfw
					})
					Text({
						text: 'Show NSFW (18+)',
						class: 'text-sm text-content2'
					})
				})
			})
		})

		VScroll({ class: 'h-full' }, () => {
			VStack({ class: 'pr-1 gap-y-1' }, () => {
				for(let model of filteredModels){
					Interactive({
						onTap: () => {
							playground.setModel(model)
							onClose()
						}
					}, () => {
						BaseModelCard({ 
							model
						})
					})
					
				}
			})
		})
	}
})


const BaseModelCard = Fragment(({ model }) => {
	HStack({ class: 'model-card' }, () => {
		Image({
			class: 'w-12 h-12 rounded-md shrink-0 object-cover',
			url: model.thumbnails[0]
		})

		VStack({ class: 'w-full min-w-0' }, () => {
			HStack({ class: 'w-full min-w-0 gap-x-1' }, () => {
				Text({
					class: 'text-lg whitespace-nowrap text-ellipsis overflow-hidden',
					text: model.name
				})
				if(model.nsfw)
					Text({
						class: 'badge badge-xs badge-flat-error',
						text: 'NSFW'
					})
			})
			Text({
				class: 'text-xs text-content2',
				text: `ID: ${model.id}`
			})
		})

		HStack({ class: 'ml-auto shrink-0' }, () => {
			if(model.source === 'base'){
				Text({
					class: 'badge badge-lg badge-flat-secondary',
					text: 'BASE MODEL'
				})
			}else{
				HStack({ class: 'gap-x-1 mr-1 items-center' }, () => {
					Icon({
						asset: iconHeart,
						class: 'w-5'
					})
					Text({
						class: 'text-xs',
						text: model.numFavs.toLocaleString('en')
					})
				})
			}
		})

		
	})
})