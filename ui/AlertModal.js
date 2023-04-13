import { Button, Fragment, Text, VStack } from '@architekt/ui'

export default Fragment(({ ctx, title, message }) => {
	VStack({ class: 'modal' }, () => {
		VStack({ class: 'modal-content gap-5' }, () => {
			Text({ 
				class: 'text-xl', 
				text: title || 'Notice' 
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