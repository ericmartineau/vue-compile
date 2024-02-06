import { createCompiler } from "./index";
import glob from 'fast-glob'

void glob('**/*.vue', {
  cwd: '/Users/ericm/keap/@infusionsoft/content-assistant-vue/src',
  ignore: [],
}).then((vfiles) => {
  console.log('FOUND', vfiles);
  const vueCompiler = createCompiler({
    input: '/Users/ericm/keap/@infusionsoft/content-assistant-vue/src',
    output: 'dist2',
    preserveTsBlock: false,
    babelrc: true,
    preserveTemplateBlock: true,
    preserveStyleBlock: true,
    include: vfiles,
  });

  return vueCompiler.normalize()
    .then(() => {
      console.log('Done transpiling vue files');
    }).catch((err)=> {
      console.error(err);
    });
}).catch((e)=>console.error(e))