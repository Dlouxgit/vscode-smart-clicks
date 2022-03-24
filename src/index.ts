import type { ExtensionContext, Selection, TextEditor } from 'vscode'
import { TextEditorSelectionChangeKind, window, workspace } from 'vscode'
import type { AstRoot } from './types'
import { trigger } from './trigger'

export const astCache = new Map<string, AstRoot[]>()

export function activate(ext: ExtensionContext) {
  let last = 0
  let prevEditor: TextEditor | undefined
  let prevSelection: Selection | undefined
  let timer: any

  ext.subscriptions.push(
    workspace.onDidChangeTextDocument((e) => {
      astCache.delete(e.document.uri.fsPath)
    }),

    window.onDidChangeTextEditorSelection(async(e) => {
      clearTimeout(timer)
      if (e.kind !== TextEditorSelectionChangeKind.Mouse)
        return

      const selection = e.selections[0]

      function update() {
        prevEditor = e.textEditor
        prevSelection = selection
        last = Date.now()
      }

      // editor
      if (prevEditor !== e.textEditor)
        return update()

      // selection
      if (
        e.selections.length !== 1
        || !prevSelection
        || !prevSelection.isEmpty
        || selection.start.line !== prevSelection.start.line
      )
        return update()

      if (Date.now() - last > 1000)
        return update()

      update()

      timer = setTimeout(async() => {
        const newSelection = await trigger(e.textEditor.document, prevSelection!, selection)
        if (newSelection) {
          e.textEditor.selections = newSelection
          last = 0
        }
      }, 100)
    }),
  )
}

export function deactivate() {

}
