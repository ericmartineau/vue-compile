import path from 'path'
import fs from 'fs-extra'
import stringifyAttrs from 'stringify-attributes'
import { SFCBlock, SFCDescriptor, SFCScriptBlock, SFCStyleBlock, SFCTemplateBlock, } from '@vue/compiler-sfc'
import { cssExtensionsRe } from './utils'

export const writeSFC = async (
  {
    descriptor,
    scripts,
    styles,
    template,
    customBlocks,
    preserveTsBlock,
    preserveStyleBlock,
    preserveTemplateBlock,
  }: {
    descriptor: SFCDescriptor,
    scripts: SFCScriptBlock[]
    styles: SFCStyleBlock[]
    template: SFCTemplateBlock | null
    customBlocks: SFCBlock[]
    preserveTsBlock?: boolean;
    preserveTemplateBlock?: boolean;
    preserveStyleBlock?: boolean;
  },
  outFile: string,
): Promise<void> => {
  const parts = []

  if (!preserveTemplateBlock) {
    if (template) {
      parts.push(
        `<template${stringifyAttrs(template.attrs)}>${template.content
          .replace(/\n$/, '')
          .replace(/^/gm, '  ')}\n</template>`,
      );
    }
  } else if (descriptor.template) {
    parts.push(
      `<template${stringifyAttrs(descriptor.template?.attrs ?? {})}>${descriptor.template?.content}</template>`,
    );
  }

  if (preserveTsBlock) {
    if (descriptor.script) {
      parts.push(`<script lang="${descriptor.script.lang}">
    ${descriptor.script.content}
</script>`);
    }
    if (descriptor.scriptSetup) {
      parts.push(`<script lang="${descriptor.scriptSetup.lang}" setup>
    ${descriptor.scriptSetup.content}
</script>`);
    }

  } else {
    scripts.forEach((script) => {
      let scr = `<script `;
      if (script.setup) scr += ' setup';
      scr += '>\n';
      if (script.setup) {
        descriptor.scriptSetup?.content?.split("\n")?.flatMap((line) => {
          if (line.startsWith("import")) {
            if (line.endsWith(".vue';")) {
              const { 0: name } = /^import (.*?) from/.exec(line)?.groups ?? {};
              if (name) {
                return [name];
              }
            }
          }
          return [];
        })
        // Add back imports
        Object.entries(descriptor.scriptSetup?.imports ?? {}).forEach(([k, v]) => {
          if (v.source.endsWith('vue')) {
            scr += `import ${k} from ${v.source};\n`;
          }
        });
      }
      scr += script.content.trim();
      scr += "\n";
      scr += "</script>";
      parts.push(scr);
    })
  }

  if (!preserveStyleBlock) {
  if (styles.length > 0) {
    for (const style of styles) {

      const attrs = { ...style.attrs };
      delete attrs.lang

      if (style.src) {
        attrs.src = style.src.replace(cssExtensionsRe, '.css')
        parts.push(`<style${stringifyAttrs(attrs)}></style>`)
      } else {
        parts.push(
          `<style${stringifyAttrs(attrs)}>\n${style.content.trim()}\n</style>`,
        )
      }
      }
    }
  } else {
    descriptor.styles.forEach((style) => {
      parts.push(
        `<style${stringifyAttrs(style.attrs)}>\n${style.content.trim()}\n</style>`,
      )
    });
  }

  if (customBlocks) {
    for (const block of customBlocks) {
      parts.push(
        `<${block.type}${stringifyAttrs(block.attrs)}>${
          block.content ? block.content.trim() : ''
        }</${block.type}>`,
      )
    }
  }

  await fs.ensureDir(path.dirname(outFile))
  await fs.writeFile(outFile, parts.join('\n\n'), 'utf8')
}
