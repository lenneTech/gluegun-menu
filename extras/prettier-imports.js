const { parsers: typescriptParsers } = require('prettier/parser-typescript');
const ts = require('typescript');

// =============================================================================
// Prettier plugin to optimize and sort imports
// see https://github.com/prettier/prettier/issues/6260
// =============================================================================

class SingleLanguageServiceHost {
  constructor(name, content) {
    this.name = name;
    this.content = content;
    this.getCompilationSettings = ts.getDefaultCompilerOptions;
    this.getDefaultLibFileName = ts.getDefaultLibFilePath;
  }
  getScriptFileNames() {
    return [this.name];
  }
  getScriptVersion() {
    return ts.version;
  }
  getScriptSnapshot() {
    return ts.ScriptSnapshot.fromString(this.content);
  }
  getCurrentDirectory() {
    return '';
  }
}

function applyChanges(text, changes) {
  return changes.reduceRight((text, change) => {
    const head = text.slice(0, change.span.start);
    const tail = text.slice(change.span.start + change.span.length);
    return `${head}${change.newText}${tail}`;
  }, text);
}

function organizeImports(text) {
  const fileName = 'file.ts';
  const host = new SingleLanguageServiceHost(fileName, text);
  const languageService = ts.createLanguageService(host);
  const formatOptions = ts.getDefaultFormatCodeSettings();
  const fileChanges = languageService.organizeImports({ type: 'file', fileName }, formatOptions, {});
  const textChanges = [...fileChanges.map((change) => change.textChanges)];
  return applyChanges(text, textChanges);
}

const parsers = {
  typescript: {
    ...typescriptParsers.typescript,
    preprocess(text) {
      text = organizeImports(text);
      return text;
    }
  }
};

// Uses module.export because of 'Unexpected token export' error
module.exports = parsers;
