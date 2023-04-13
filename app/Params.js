import { createModel } from '@architekt/forms'

export default data => createModel({
	data: {
		prompt: '',
		promptNegative: '',
		aspect: 'square',
		sampler: 'k_lms',
		steps: 42,
		cfg_scale: 7.5,
		...data
	},
	constraints: [
		
	]
})