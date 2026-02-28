interface IOption {
  suffix: string
  override: string[]
}
export default (type: string, { suffix = '', override = [] }: IOption) => {
  const keys = ['ready', 'saving', 'success', 'error', 'confirm', 'update']
  return statuses[type]
    .map((elm: string) => elm.replace('%suffix%', suffix ? ` ${suffix}` : ''))
    .reduce((out: { [key: string]: string }, curr: string, i: number) => {
      // For each status option of this type, set to keyed object that we'll return
      return { ...out, [keys[i]]: override[i] || curr }
    }, {})
}

const DEFAULT_ERROR = 'Please Review'
const DEFAULT_CONFIRMATION = 'Again to Confirm'
const statuses = {
  save: [
    'Save%suffix%',
    'Saving%suffix%...',
    'Saved%suffix%!',
    DEFAULT_ERROR,
    DEFAULT_CONFIRMATION,
  ],
  continue: [
    'Continue%suffix%',
    'Saving%suffix%...',
    'Done%suffix%!',
    DEFAULT_ERROR,
    DEFAULT_CONFIRMATION,
  ],
  update: [
    'Update%suffix%',
    'Updating...%suffix%...',
    'Updated%suffix%!',
    DEFAULT_ERROR,
    DEFAULT_CONFIRMATION,
  ],
  add: ['Add%suffix%', 'Add%suffix%...', 'Added%suffix%!', DEFAULT_ERROR, DEFAULT_CONFIRMATION],
  send: [
    'Send%suffix%',
    'Sending%suffix%...',
    'Sent%suffix%!',
    DEFAULT_ERROR,
    DEFAULT_CONFIRMATION,
  ],
  delete: [
    'Delete%suffix%',
    'Deleting%suffix%...',
    'Deleted%suffix%!',
    "Couldn't Delete",
    'Again to Confirm',
  ],
}
