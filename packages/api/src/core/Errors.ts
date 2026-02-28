import { error } from '@sveltejs/kit'

export const NotAuthdError = () => error(403, 'You must be authenticated to do that')
export const NoPermissionError = () => error(403, `You don't have permission to do that`)
export const NoPermissionToUpdateError = () =>
  error(403, `You don't have permission to update that`)
export const NoPermissionToViewError = () => error(401, `You don't have permission to view that`)
