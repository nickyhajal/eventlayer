import tippy from 'tippy.js'
import type { Props as TippyProps } from 'tippy.js'
import UserMiniCard__SvelteComponent from '$lib/components/community/UserMiniCard.svelte'
import v4 from 'uuid/v4'
import type { user } from '@prisma/client'
import '$lib/blank-tippy.css'

interface HoverProps extends Partial<TippyProps> {
  userId: string
}

export default function (
  node: HTMLElement,
  props: HoverProps | Partial<TippyProps>
) {
  const hoverNode = document.createElement('div')
  document.body.appendChild(hoverNode)
  new UserMiniCard__SvelteComponent({
    target: hoverNode,
    props,
  })
  tippy(node, {
    content: hoverNode,
    delay: [400, 400],
    interactive: true,
    theme: 'blank',
    hideOnClick: false,
    interactiveBorder: 10,
    arrow: false,
    touch: false,
    placement: 'left',
    onDestroy: () => {
      document.removeChild(hoverNode)
    },
    ...props,
  })
}
