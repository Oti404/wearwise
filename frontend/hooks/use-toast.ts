import * as React from "react"
import type { ToastActionElement, ToastProps } from "@/components/ui/toast"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

let count = 0
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

type Action =
  | { type: "ADD_TOAST", toast: ToasterToast }
  | { type: "UPDATE_TOAST", toast: Partial<ToasterToast> }
  | { type: "DISMISS_TOAST", toastId?: ToasterToast["id"] }
  | { type: "REMOVE_TOAST", toastId?: ToasterToast["id"] }

interface State { toasts: ToasterToast[] }

const listeners: Array<(state: State) => void> = []
let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => { listener(memoryState); })
}

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST": return { ...state, toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT) };
    case "UPDATE_TOAST": return { ...state, toasts: state.toasts.map((t) => t.id === action.toast.id ? { ...t, ...action.toast } : t) };
    case "DISMISS_TOAST": return { ...state, toasts: state.toasts.map((t) => (t.id === action.toastId || action.toastId === undefined) ? { ...t, open: false } : t) };
    case "REMOVE_TOAST": return { ...state, toasts: action.toastId === undefined ? [] : state.toasts.filter((t) => t.id !== action.toastId) };
  }
}

export function useToast() {
  const [state, setState] = React.useState<State>(memoryState)
  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) listeners.splice(index, 1)
    }
  }, [state])
  return { ...state, toast: (props: Omit<ToasterToast, "id">) => {
    const id = genId();
    dispatch({ type: "ADD_TOAST", toast: { ...props, id, open: true } });
    return { id, dismiss: () => dispatch({ type: "DISMISS_TOAST", toastId: id }) };
  } };
}
