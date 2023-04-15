import { createModel } from '@architekt/forms'

export default data => createModel({
	data: {
		model: 'stable-diffusion-v1-5',
		prompt: '',
		prompt_negative: '',
		aspect: 'square',
		sampler: 'k_lms',
		steps: 42,
		cfg_scale: 7.5,
		...data
	},
	constraints: [
		{
			key: 'prompt',
			check: ({ prompt }) => {
				if(prompt.length === 0)
					throw 'required'
			}
		},
		{
			key: 'steps',
			check: ({ steps }) => {
				if(steps <= 0)
					throw 'must be higher than 0'

				if(steps >= 200)
					throw 'max 200 steps allowed'
			}
		},
		{
			key: 'cfg_scale',
			check: ({ cfg_scale }) => {
				if(cfg_scale < 1 || cfg_scale > 25)
					throw 'must be between 1 and 25'
			}
		}
	]
})