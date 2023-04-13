import { Button, Fragment, HStack, Icon, Text, VStack } from '@architekt/ui'
import iconWarning from '../assets/warning.svg'

export default Fragment(({ ctx, title, message }) => {
	VStack({ class: 'modal' }, () => {
		VStack({ class: 'modal-content gap-5' }, () => {
			HStack({ class: 'gap-x-4 items-center' }, () => {
				Icon({
					class: 'w-6 h-6',
					asset: iconWarning
				})
				Text({ 
					class: 'text-xl', 
					text: title || 'Notice' 
				})
			})
			Text({
				text: message
			})
			Button({
				class: 'btn btn-block',
				text: 'Acknowledge',
				onTap: ctx.upstream.overlay.close
			})
		})
	})
})