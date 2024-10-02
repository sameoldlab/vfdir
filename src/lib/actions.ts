import type { Action } from 'svelte/action'

export const resizer: Action<HTMLDivElement> = el => {
	const left = el.previousElementSibling as HTMLDivElement
	const leftWidth = left.getBoundingClientRect().width

	const doc_mouseMove = (e: MouseEvent) => {
		const leftWidth = left.getBoundingClientRect().width
		left.style.width = `${leftWidth + e.movementX}px`
	}
	const doc_mouseUp = () => {
		document.body.style.removeProperty('cursor')
		document.body.style.removeProperty('user-select')
		// document.body.style.removeProperty('pointer-events')

		document.removeEventListener('mousemove', doc_mouseMove)
		document.removeEventListener('mouseup', doc_mouseUp)
	}

	const el_mouseDown = () => {
		document.body.style.cursor = 'col-resize'
		document.body.style.userSelect = 'none'
		// document.body.style.pointerEvents = 'none'
		document.addEventListener('mousemove', doc_mouseMove)
		document.addEventListener('mouseup', doc_mouseUp)
	}
	const el_dblclick = () => {
		left.style.width = `${leftWidth}px`
	}

	el.addEventListener('dblclick', el_dblclick)
	el.addEventListener('mousedown', el_mouseDown)

	return {
		destroy() {
			el.removeEventListener('dblclick', el_dblclick)
			el.removeEventListener('mousedown', el_mouseDown)
			document.removeEventListener('mousemove', doc_mouseMove)
			document.removeEventListener('mouseup', doc_mouseUp)
		},
	}
}
export const key: Action<HTMLAnchorElement> = (a) => {
	const prev = a.previousElementSibling as HTMLAnchorElement | null
	const next = a.nextElementSibling as HTMLAnchorElement | null
	function keydown(e: KeyboardEvent) {
		// console.log(e);
		// console.log(next);
		if (e.key === "ArrowDown") {
			next.focus()
			return
		}
		if (e.key === "ArrowUp") {
			prev.focus()
			return
		}
	}
	a.addEventListener('keydown', keydown)
	return ({
		destroy() {
			a.removeEventListener('keydown', keydown)
		},
	})
}
