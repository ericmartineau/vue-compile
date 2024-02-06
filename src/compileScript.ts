import { SFCScriptBlock } from '@vue/compiler-sfc'
import { notSupportedLang } from './utils'
import { ScriptCompilerContext } from './types'

export const compileScript = async (
  script: SFCScriptBlock | null,
  ctx: ScriptCompilerContext,
): Promise<SFCScriptBlock | null> => {
  if (!script) return script

  const code = script.content.replace(/^\/\/$/gm, '')

  if (
    !script.lang ||
    script.lang === 'esnext' ||
    script.lang === 'babel' ||
    script.lang === 'ts' ||
    script.lang === 'typescript'
  ) {
    await import(
      './script-compilers/babel'
      ).then(async ({ compile }) => {
      script.content = await compile(code, ctx);
    })

  } else {
    throw new Error(notSupportedLang(script.lang, 'script'))
  }

  return script
}
