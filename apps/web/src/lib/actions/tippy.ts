import tippy, { roundArrow } from 'tippy.js'
import type { Props as TippyProps } from 'tippy.js'
import 'tippy.js/dist/tippy.css'
import 'tippy.js/dist/svg-arrow.css'

export default function (node: HTMLElement, props: Partial<TippyProps>) {
  if (props?.content) {
    tippy(node, { ...props, delay: 100, arrow: roundArrow })
  }
}
