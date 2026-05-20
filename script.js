let lang = null;
let activePreset = null;
const state = {};

const LANGS = {
  cpp: { ext: 'cpp', label: 'C++' },
  c:   { ext: 'c',   label: 'C'   },
  py:  { ext: 'py',  label: 'Python' },
  js:  { ext: 'js',  label: 'JavaScript' },
};

const SECTIONS = {
  cpp: [
    { title: 'Braces', opts: [
      { key:'brace_if',    label:'IF brace',              hint:'how the if block opens', choices:['if(cond){','if(cond) {','if(cond)\n{'], def:0 },
      { key:'brace_else',  label:'ELSE position',          hint:'where else goes',        choices:['}else{','} else {','} else{','}\nelse {'], def:1 },
      { key:'brace_loop',  label:'FOR / WHILE brace',      hint:'how loops open',         choices:['for(i){','for(i) {','for(i)\n{'], def:0 },
      { key:'brace_func',  label:'Function / class brace', hint:'how functions open',     choices:['fn(){','fn() {','fn()\n{'], def:0 },
      { key:'brace_single',label:'Single-statement block', hint:'if body has 1 statement',choices:['always {}','omit {} if 1 line','all on 1 line'], def:0 },
    ]},
    { title: 'Indentation', opts: [
      { key:'indent_type', label:'Style',          hint:'spaces or tabs',   choices:['spaces','tabs'], def:0 },
      { key:'indent_size', label:'Width (spaces)', hint:'number of spaces', choices:['2','4','8'], def:1 },
      { key:'tab_width',   label:'Width (tabs)',   hint:'visual tab width', choices:['2','4','8'], def:1 },
    ]},
    { title: 'Spacing', opts: [
      { key:'sp_operator', label:'Around operators', hint:'assignment: =, +=, -= …', choices:['i = j + 1','i=j+1'], def:0 },
      { key:'sp_keyword',  label:'After keyword',    hint:'if, for, while',          choices:['if (cond)','if(cond)'], def:1 },
      { key:'sp_paren',    label:'Inside parens',    hint:'(cond) vs ( cond )',       choices:['(cond)','( cond )'], def:0 },
      { key:'sp_comma',    label:'After comma',      hint:'f(a,b) vs f(a, b)',        choices:['f(a, b)','f(a,b)'], def:0 },
      { key:'blank_lines', label:'Max blank lines',  hint:'between functions / blocks',choices:['0','1','2'], def:1 },
    ]},
    { title: 'Control flow', opts: [
      { key:'case_indent', label:'case indentation', hint:'', choices:['indented','at switch'], def:0 },
    ]},
    { title: 'Functions & classes', opts: [
      { key:'func_return_type', label:'Return type position', hint:'', choices:['int fn()','int\nfn()'], def:0 },
      { key:'ptr_style',        label:'Pointer style',        hint:'', choices:['int* ptr','int *ptr','int * ptr'], def:0 },
      { key:'ref_style',        label:'Reference style',      hint:'', choices:['int& ref','int &ref'], def:0 },
      { key:'init_list',        label:'Initializer list',     hint:'constructor init list', choices:['Foo() : x(0) {','Foo()\n  : x(0) {'], def:0 },
    ]},
    { title: 'Other', opts: [
      { key:'line_len',    label:'Max line length',  hint:'', choices:['80','100','120','no limit'], def:1 },
      { key:'eof_newline', label:'Final newline',    hint:'', choices:['yes','no'], def:0 },
      { key:'ns_indent',   label:'Namespace indent', hint:'', choices:['indent contents','not indented'], def:1 },
    ]},
  ],
};

SECTIONS.c = SECTIONS.cpp.map(s => {
  const opts = s.opts.filter(o => !['ref_style','init_list','ns_indent'].includes(o.key));
  return { ...s, opts };
}).filter(s => s.opts.length > 0);

SECTIONS.py = [
  { title: 'Formatting', opts: [
    { key:'line_len',    label:'Max line length', hint:'PEP8 = 79', choices:['79','88','100','120'], def:0 },
    { key:'quote_style', label:'Quotes',          hint:'',          choices:["'single'",'"double"'], def:0 },
    { key:'import_order',label:'Import order',    hint:'',          choices:['stdlib, third-party, local','alphabetical'], def:0 },
  ]},
];

SECTIONS.js = [
  { title: 'Indentation', opts: [
    { key:'indent_type', label:'Style', hint:'', choices:['spaces','tabs'], def:0 },
    { key:'indent_size', label:'Width', hint:'', choices:['2','4'], def:0 },
  ]},
  { title: 'Syntax', opts: [
    { key:'semicolon',      label:'Semicolon',      hint:'', choices:['always ;','never ;'], def:0 },
    { key:'quote_style',    label:'Quotes',         hint:'', choices:["'single'",'"double"','`template`'], def:0 },
    { key:'trailing_comma', label:'Trailing comma', hint:'', choices:['yes','no'], def:0 },
  ]},
  { title: 'Other', opts: [
    { key:'line_len', label:'Max line length', hint:'', choices:['80','100','120','no limit'], def:1 },
  ]},
];

// ─────────────────────────────────────────────
//  PRESETS
// ─────────────────────────────────────────────

const PRESETS = {
  cpp: [
    { name: 'Google', state: {
      brace_if:'if(cond) {', brace_else:'} else {', brace_loop:'for(i) {', brace_func:'fn() {', brace_single:'always {}',
      indent_type:'spaces', indent_size:'2',
      sp_keyword:'if (cond)', sp_paren:'(cond)', sp_comma:'f(a, b)', blank_lines:'1',
      case_indent:'indented', func_return_type:'int fn()', ptr_style:'int* ptr', ref_style:'int& ref',
      init_list:'Foo() : x(0) {', line_len:'80', eof_newline:'yes', ns_indent:'not indented',
    }},
    { name: 'LLVM', state: {
      brace_if:'if(cond) {', brace_else:'} else {', brace_loop:'for(i) {', brace_func:'fn()\n{', brace_single:'always {}',
      indent_type:'spaces', indent_size:'2',
      sp_keyword:'if (cond)', sp_paren:'(cond)', sp_comma:'f(a, b)', blank_lines:'1',
      case_indent:'at switch', func_return_type:'int fn()', ptr_style:'int *ptr', ref_style:'int &ref',
      init_list:'Foo() : x(0) {', line_len:'80', eof_newline:'yes', ns_indent:'not indented',
    }},
    { name: 'Linux Kernel', state: {
      brace_if:'if(cond) {', brace_else:'} else {', brace_loop:'for(i) {', brace_func:'fn()\n{', brace_single:'omit {} if 1 line',
      indent_type:'tabs', tab_width:'8',
      sp_keyword:'if (cond)', sp_paren:'(cond)', sp_comma:'f(a, b)', blank_lines:'1',
      case_indent:'at switch', func_return_type:'int fn()', ptr_style:'int *ptr',
      line_len:'80', eof_newline:'yes', ns_indent:'not indented',
    }},
    { name: 'Allman', state: {
      brace_if:'if(cond)\n{', brace_else:'}\nelse {', brace_loop:'for(i)\n{', brace_func:'fn()\n{', brace_single:'always {}',
      indent_type:'spaces', indent_size:'4',
      sp_keyword:'if (cond)', sp_paren:'(cond)', sp_comma:'f(a, b)', blank_lines:'1',
      case_indent:'indented', func_return_type:'int fn()', ptr_style:'int* ptr', ref_style:'int& ref',
      init_list:'Foo() : x(0) {', line_len:'100', eof_newline:'yes', ns_indent:'not indented',
    }},
    { name: 'GNU', state: {
      brace_if:'if(cond) {', brace_else:'} else {', brace_loop:'for(i) {', brace_func:'fn()\n{', brace_single:'always {}',
      indent_type:'spaces', indent_size:'2',
      sp_keyword:'if (cond)', sp_paren:'(cond)', sp_comma:'f(a, b)', blank_lines:'1',
      case_indent:'indented', func_return_type:'int fn()', ptr_style:'int *ptr', ref_style:'int &ref',
      init_list:'Foo() : x(0) {', line_len:'80', eof_newline:'yes', ns_indent:'not indented',
    }},
  ],
  py: [
    { name: 'PEP 8',  state: { line_len:'79', quote_style:"'single'", import_order:'stdlib, third-party, local' }},
    { name: 'Black',  state: { line_len:'88', quote_style:'"double"',  import_order:'stdlib, third-party, local' }},
    { name: 'Google', state: { line_len:'80', quote_style:'"double"',  import_order:'stdlib, third-party, local' }},
  ],
  js: [
    { name: 'Airbnb',   state: { indent_type:'spaces', indent_size:'2', semicolon:'always ;', quote_style:"'single'", trailing_comma:'yes', line_len:'100' }},
    { name: 'Standard', state: { indent_type:'spaces', indent_size:'2', semicolon:'never ;',  quote_style:"'single'", trailing_comma:'no',  line_len:'80'  }},
    { name: 'Prettier', state: { indent_type:'spaces', indent_size:'2', semicolon:'always ;', quote_style:'"double"', trailing_comma:'yes', line_len:'80'  }},
  ],
};
PRESETS.c = PRESETS.cpp;

// ─────────────────────────────────────────────
//  AI ONLY OPTIONS
// ─────────────────────────────────────────────

const AI_ONLY = {
  cpp: [
    { key:'ai_name_var',        label:'Variable names',       hint:'', choices:['snake_case','camelCase','PascalCase'], def:0 },
    { key:'ai_name_func',       label:'Function names',       hint:'', choices:['snake_case','camelCase','PascalCase'], def:0 },
    { key:'ai_name_class',      label:'Class names',          hint:'', choices:['PascalCase','snake_case'], def:0 },
    { key:'ai_name_const',      label:'Constant names',       hint:'', choices:['UPPER_CASE','kConstant','snake_case'], def:0 },
    { key:'ai_comment_lang',    label:'Comment language',     hint:'', choices:['English','none'], def:0 },
    { key:'ai_comment_density', label:'Comment density',      hint:'', choices:['minimal','when non-obvious','verbose'], def:1 },
    { key:'ai_magic_numbers',   label:'Magic numbers',        hint:'', choices:['always define as const','inline ok'], def:0 },
    { key:'ai_func_length',     label:'Max function length',  hint:'', choices:['20 lines','50 lines','100 lines','no limit'], def:1 },
    { key:'ai_error_handling',  label:'Error handling',       hint:'', choices:['always check return values','exceptions','minimal'], def:0 },
    { key:'ai_ternary',         label:'Ternary operator',     hint:'', choices:['use freely','short only','avoid'], def:1 },
  ],
  c: [
    { key:'ai_name_var',        label:'Variable names',       hint:'', choices:['snake_case','camelCase'], def:0 },
    { key:'ai_name_func',       label:'Function names',       hint:'', choices:['snake_case','camelCase'], def:0 },
    { key:'ai_name_const',      label:'Constant names',       hint:'', choices:['UPPER_CASE','snake_case'], def:0 },
    { key:'ai_comment_lang',    label:'Comment language',     hint:'', choices:['English','none'], def:0 },
    { key:'ai_comment_density', label:'Comment density',      hint:'', choices:['minimal','when non-obvious','verbose'], def:1 },
    { key:'ai_magic_numbers',   label:'Magic numbers',        hint:'', choices:['always define as const','inline ok'], def:0 },
    { key:'ai_func_length',     label:'Max function length',  hint:'', choices:['20 lines','50 lines','100 lines','no limit'], def:1 },
    { key:'ai_error_handling',  label:'Error handling',       hint:'', choices:['always check return values','minimal'], def:0 },
    { key:'ai_ternary',         label:'Ternary operator',     hint:'', choices:['use freely','short only','avoid'], def:1 },
  ],
  py: [
    { key:'ai_name_var',        label:'Variable names',       hint:'', choices:['snake_case','camelCase'], def:0 },
    { key:'ai_name_func',       label:'Function names',       hint:'', choices:['snake_case','camelCase'], def:0 },
    { key:'ai_name_class',      label:'Class names',          hint:'', choices:['PascalCase','snake_case'], def:0 },
    { key:'ai_type_hints',      label:'Type hints',           hint:'', choices:['always','signatures only','never'], def:0 },
    { key:'ai_comment_lang',    label:'Comment language',     hint:'', choices:['English','none'], def:0 },
    { key:'ai_comment_density', label:'Comment density',      hint:'', choices:['minimal','when non-obvious','verbose'], def:1 },
    { key:'ai_func_length',     label:'Max function length',  hint:'', choices:['20 lines','50 lines','no limit'], def:1 },
    { key:'ai_ternary',         label:'Ternary / comprehension', hint:'', choices:['use freely','short only','avoid'], def:0 },
  ],
  js: [
    { key:'ai_name_var',        label:'Variable names',       hint:'', choices:['camelCase','snake_case'], def:0 },
    { key:'ai_name_func',       label:'Function names',       hint:'', choices:['camelCase','snake_case'], def:0 },
    { key:'ai_name_class',      label:'Class names',          hint:'', choices:['PascalCase','camelCase'], def:0 },
    { key:'ai_name_const',      label:'Constant names',       hint:'', choices:['UPPER_CASE','camelCase'], def:0 },
    { key:'ai_var_decl',        label:'Variable declaration', hint:'', choices:['const','let','var'], def:0 },
    { key:'ai_arrow_fn',        label:'Arrow functions',      hint:'', choices:['always','short only','never'], def:0 },
    { key:'ai_comment_lang',    label:'Comment language',     hint:'', choices:['English','none'], def:0 },
    { key:'ai_comment_density', label:'Comment density',      hint:'', choices:['minimal','when non-obvious','verbose'], def:1 },
    { key:'ai_func_length',     label:'Max function length',  hint:'', choices:['20 lines','50 lines','no limit'], def:1 },
    { key:'ai_ternary',         label:'Ternary operator',     hint:'', choices:['use freely','short only','avoid'], def:0 },
  ],
};

// ─────────────────────────────────────────────
//  UI
// ─────────────────────────────────────────────

function selectLang(l, el, clearState = true) {
  lang = l;
  if (clearState) Object.keys(state).forEach(k => delete state[k]);
  document.querySelectorAll('.lang-card').forEach(c => c.classList.remove('selected'));
  (el || document.querySelector(`.lang-card[onclick*="'${l}'"]`))?.classList.add('selected');
  document.getElementById('s1').className = 'step done';
  document.getElementById('s2').className = 'step active';
  document.getElementById('s3').className = 'step';
  document.getElementById('prev-filename').textContent = `preview.${LANGS[l].ext}`;
  const f = getFilesForLang();
  const parts = [];
  if (f.clang)     parts.push('.clang-format');
  if (f.editor)    parts.push('.editorconfig');
  if (f.pyproject) parts.push('pyproject.toml');
  if (f.prettier)  parts.push('.prettierrc');
  parts.push('.vscode/settings.json', 'README.md');
  document.getElementById('export-label').textContent = parts.join(' + ');
  activePreset = null;
  buildPresets();
  buildOpts();
  document.getElementById('config').classList.add('visible');
  document.getElementById('config').scrollIntoView({ behavior:'smooth', block:'start' });
  stateToHash();
}

function buildPresets() {
  const row = document.getElementById('preset-row');
  const presets = PRESETS[lang] || [];
  row.innerHTML = presets.length ? '<span class="preset-label">start from:</span>' : '';
  presets.forEach(p => {
    const btn = document.createElement('button');
    btn.className = 'preset-btn' + (activePreset === p.name ? ' active' : '');
    btn.textContent = p.name;
    btn.onclick = () => {
      activePreset = p.name;
      Object.assign(state, p.state);
      buildPresets();
      buildOpts();
      stateToHash();
    };
    row.appendChild(btn);
  });
}

function buildOpts() {
  const sections = SECTIONS[lang];
  const panel    = document.getElementById('opts-panel');
  panel.innerHTML = '';
  const isTab = state.indent_type === 'tabs';

  sections.forEach(sec => {
    const wrap = document.createElement('div');
    wrap.className = 'section';

    sec.opts.forEach(opt => {
      if (state[opt.key] === undefined) state[opt.key] = opt.choices[opt.def];
      if (opt.key === 'indent_size' && isTab)  return;
      if (opt.key === 'tab_width'   && !isTab) return;

      const row = document.createElement('div');
      row.className = 'opt-row';
      row.id = 'row-' + opt.key;
      const hint = opt.hint ? `<span>${opt.hint}</span>` : '';
      row.innerHTML = `
        <div class="opt-label"><strong>${opt.label}</strong>${hint}</div>
        <div class="opt-choices" id="grp-${opt.key}">
          ${opt.choices.map(c => `
            <div class="choice ${state[opt.key]===c?'sel':''}"
                 onclick="pick('${opt.key}','${c.replace(/'/g,"\\'").replace(/"/g,'&quot;').replace(/\n/g,'\\n')}')"
            >${c.replace(/&/g,'&amp;').replace(/\n/g,'<br>')}</div>`).join('')}
        </div>`;
      wrap.appendChild(row);
    });
    panel.appendChild(wrap);
  });

  // AI-only section
  const aiOpts = AI_ONLY[lang] || [];
  if (aiOpts.length) {
    const header = document.createElement('div');
    header.className = 'ai-header';
    header.innerHTML = 'AI only <span class="ai-badge">PROMPT ONLY</span>';
    panel.appendChild(header);

    const aiWrap = document.createElement('div');
    aiWrap.className = 'section';
    aiOpts.forEach(opt => {
      if (state[opt.key] === undefined) state[opt.key] = opt.choices[opt.def];
      const row = document.createElement('div');
      row.className = 'opt-row';
      row.id = 'row-' + opt.key;
      row.innerHTML = `
        <div class="opt-label"><strong>${opt.label}</strong></div>
        <div class="opt-choices" id="grp-${opt.key}">
          ${opt.choices.map(c => `
            <div class="choice ${state[opt.key]===c?'sel':''}"
                 onclick="pick('${opt.key}','${c.replace(/'/g,"\\'").replace(/"/g,'&quot;').replace(/\n/g,'\\n')}')"
            >${c.replace(/&/g,'&amp;').replace(/\n/g,'<br>')}</div>`).join('')}
        </div>`;
      aiWrap.appendChild(row);
    });
    panel.appendChild(aiWrap);
  }

  updatePreview();
}

function pick(key, val) {
  state[key] = val.replace(/\\n/g,'\n');
  document.querySelectorAll(`#grp-${key} .choice`).forEach(c => {
    c.classList.toggle('sel', c.innerHTML.replace(/<br>/g,'\n').replace(/&amp;/g,'&') === state[key]);
  });
  if (key === 'indent_type') { buildOpts(); return; }
  if (!key.startsWith('ai_')) {
    activePreset = null;
    buildPresets();
  }
  updatePreview();
  stateToHash();
  document.getElementById('s3').className = 'step active';
}

// ─────────────────────────────────────────────
//  URL STATE SHARING
// ─────────────────────────────────────────────

function stateToHash() {
  if (!lang) return;
  try { location.hash = btoa(JSON.stringify({ lang, state })); } catch(e) {}
}

function hashToState() {
  const h = location.hash.slice(1);
  if (!h) return false;
  try {
    const data = JSON.parse(atob(h));
    if (!data.lang || !LANGS[data.lang]) return false;
    lang = data.lang;
    Object.assign(state, data.state || {});
    return true;
  } catch(e) { return false; }
}

function showToast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 250); }, 2000);
}

function copyLink() {
  navigator.clipboard.writeText(location.href).then(() => showToast('Link copied!'));
}


// ─────────────────────────────────────────────
//  PREVIEW
// ─────────────────────────────────────────────

function updatePreview() {
  const pre = document.getElementById('preview');
  pre.style.tabSize = state.tab_width || state.indent_size || '4';
  if (lang === 'cpp' || lang === 'c') pre.innerHTML = buildCppPreview();
  else if (lang === 'py') pre.innerHTML = buildPyPreview();
  else if (lang === 'js') pre.innerHTML = buildJsPreview();
}

function kw(s)  { return `<span class="kw">${s}</span>`; }
function fn(s)  { return `<span class="fn">${s}</span>`; }
function cm(s)  { return `<span class="cm">${s}</span>`; }
function num(s) { return `<span class="num">${s}</span>`; }

function toNaming(snake, style) {
  const parts = snake.split('_');
  if (style === 'camelCase') return parts[0] + parts.slice(1).map(p => p[0].toUpperCase() + p.slice(1)).join('');
  if (style === 'PascalCase') return parts.map(p => p[0].toUpperCase() + p.slice(1)).join('');
  return snake;
}
function toConstName(style) {
  if (style === 'kConstant') return 'kMaxSize';
  if (style === 'snake_case') return 'max_size';
  return 'MAX_SIZE';
}

function buildCppPreview() {
  const isTab   = state.indent_type === 'tabs';
  const ind     = isTab ? '\t' : ' '.repeat(parseInt(state.indent_size || '4'));
  const sp      = state.sp_operator === 'i=j+1' ? '' : ' ';
  const cs      = state.sp_comma === 'f(a,b)' ? ',' : ', ';
  const ksp     = state.sp_keyword === 'if(cond)' ? '' : ' ';
  const psp     = state.sp_paren === '( cond )' ? ' ' : '';
  const ob_fn   = state.brace_func?.includes('\n')   ? '\n{' : state.brace_func?.includes(' {') ? ' {' : '{';
  const ob_if_f = state.brace_if?.includes('\n')     ? '\n' + ind + '{' : state.brace_if?.includes(' {') ? ' {' : '{';
  const ob_lp_f = state.brace_loop?.includes('\n')   ? '\n' + ind + '{' : state.brace_loop?.includes(' {') ? ' {' : '{';
  const be      = state.brace_else || '} else {';
  const ci      = state.case_indent === 'indented' ? ind : '';
  const codeInd = state.case_indent === 'indented' ? ind + ind : ind;
  const blankL  = parseInt(state.blank_lines || '1');

  const varName    = toNaming('my_result',    state.ai_name_var  || 'snake_case');
  const fnA        = toNaming('add_values',   state.ai_name_func || 'snake_case');
  const fnB        = toNaming('process_data', state.ai_name_func || 'snake_case');
  const cstName    = toConstName(state.ai_name_const || 'UPPER_CASE');
  const showCmt    = state.ai_comment_lang !== 'none';
  const density    = state.ai_comment_density || 'when non-obvious';
  const useMagic   = state.ai_magic_numbers === 'always define as const';
  const useTernary = state.ai_ternary && state.ai_ternary !== 'avoid';
  const ptrDecl = state.ptr_style === 'int *ptr'
                ? kw('int') + ' *n'
                : state.ptr_style === 'int * ptr'
                ? kw('int') + ' * n'
                : kw('int') + '* n';

  const spBeforeElse = be.startsWith('}else') ? '' : ' ';
  const ifHead = kw('if')      + ksp + '(' + psp + varName + sp + '>'  + sp + num('0') + psp + ')';
  const eiHead = kw('else if') + ksp + '(' + psp + varName + sp + '==' + sp + num('0') + psp + ')';

  const L = [];

  if (useMagic) {
    const cstLine = lang === 'cpp'
      ? kw('constexpr') + ' ' + kw('int') + ' ' + cstName + ' = ' + num('100') + ';'
      : kw('#define') + ' ' + cstName + ' ' + num('100');
    L.push(cstLine);
    L.push('');
  }

  // function comment + signature
  if (showCmt && density !== 'minimal') L.push(cm('/* ' + fnA + ' */'));
  const fnSig = fn(fnA) + '(' + kw('int') + ' a' + cs + kw('int') + ' b)' + ob_fn;
  if (state.func_return_type === 'int\nfn()') {
    L.push(kw('int')); L.push(fnSig);
  } else {
    L.push(kw('int') + ' ' + fnSig);
  }

  L.push(ind + kw('int') + ' ' + varName + sp + '=' + sp + 'a' + sp + '+' + sp + 'b;');

  // single-statement if / else if / else
  if (state.brace_single === 'all on 1 line') {
    L.push(ind + ifHead + ' ' + fn('doA') + '();');
    L.push(ind + eiHead + ' ' + fn('doC') + '();');
    L.push(ind + kw('else') + ' ' + fn('doB') + '();');
  } else if (state.brace_single === 'omit {} if 1 line') {
    L.push(ind + ifHead);
    L.push(ind + ind + fn('doA') + '();');
    L.push(ind + eiHead);
    L.push(ind + ind + fn('doC') + '();');
    L.push(ind + kw('else'));
    L.push(ind + ind + fn('doB') + '();');
  } else {
    L.push(ind + ifHead + ob_if_f);
    L.push(ind + ind + fn('doA') + '();');
    if (be.includes('\n')) { L.push(ind + '}'); L.push(ind + eiHead + ob_if_f); }
    else                   { L.push(ind + '}' + spBeforeElse + eiHead + ob_if_f); }
    L.push(ind + ind + fn('doC') + '();');
    if (be.includes('\n'))     { L.push(ind + '}'); L.push(ind + kw('else') + ' {'); }
    else if (be === '}else{')  { L.push(ind + '}' + kw('else') + '{'); }
    else if (be === '} else{') { L.push(ind + '} ' + kw('else') + '{'); }
    else                       { L.push(ind + '} ' + kw('else') + ' {'); }
    L.push(ind + ind + fn('doB') + '();');
    L.push(ind + '}');
  }

  for (let i = 0; i < blankL; i++) L.push('');

  // multi-statement if / else if / else (brace_single doesn't apply)
  L.push(ind + ifHead + ob_if_f);
  L.push(ind + ind + fn('doA') + '();');
  L.push(ind + ind + fn('doD') + '();');
  if (be.includes('\n')) { L.push(ind + '}'); L.push(ind + eiHead + ob_if_f); }
  else                   { L.push(ind + '}' + spBeforeElse + eiHead + ob_if_f); }
  L.push(ind + ind + fn('doC') + '();');
  L.push(ind + ind + fn('doE') + '();');
  if (be.includes('\n'))     { L.push(ind + '}'); L.push(ind + kw('else') + ' {'); }
  else if (be === '}else{')  { L.push(ind + '}' + kw('else') + '{'); }
  else if (be === '} else{') { L.push(ind + '} ' + kw('else') + '{'); }
  else                       { L.push(ind + '} ' + kw('else') + ' {'); }
  L.push(ind + ind + fn('doB') + '();');
  L.push(ind + ind + fn('doF') + '();');
  L.push(ind + '}');

  for (let i = 0; i < blankL; i++) L.push('');

  // for loop
  const forHead = kw('for') + ksp + '(' + psp + kw('int') + ' i' + sp + '=' + sp + num('0') + '; i' + sp + '&lt;' + sp + 'n; i++' + psp + ')';
  if (state.brace_single === 'all on 1 line') {
    L.push(ind + forHead + ' x' + sp + '+=' + sp + num('1') + ';');
  } else if (state.brace_single === 'omit {} if 1 line') {
    L.push(ind + forHead);
    L.push(ind + ind + 'x' + sp + '+=' + sp + num('1') + ';');
  } else {
    L.push(ind + forHead + ob_lp_f);
    L.push(ind + ind + 'x' + sp + '+=' + sp + num('1') + ';');
    L.push(ind + '}');
  }

  for (let i = 0; i < blankL; i++) L.push('');

  // while loop
  const whileHead = kw('while') + ksp + '(' + psp + 'x' + sp + '>' + sp + num('0') + psp + ')';
  if (state.brace_single === 'all on 1 line') {
    L.push(ind + whileHead + ' x--;');
  } else if (state.brace_single === 'omit {} if 1 line') {
    L.push(ind + whileHead);
    L.push(ind + ind + 'x--;');
  } else {
    L.push(ind + whileHead + ob_lp_f);
    L.push(ind + ind + 'x--;');
    L.push(ind + '}');
  }

  for (let i = 0; i < blankL; i++) L.push('');

  // switch / case
  L.push(ind + kw('switch') + ksp + '(' + psp + 'x' + psp + ') {');
  L.push(ind + ci + kw('case') + ' ' + num('1') + ':');
  L.push(ind + codeInd + fn('doSomething') + '();');
  L.push(ind + codeInd + kw('break') + ';');
  L.push(ind + ci + kw('default') + ':');
  L.push(ind + codeInd + kw('break') + ';');
  L.push(ind + '}');

  if (useTernary) {
    L.push(ind + kw('return') + ' ' + varName + sp + '>' + sp + num('0') + ' ? ' + varName + ' : ' + num('0') + ';');
  } else {
    L.push(ind + kw('return') + ' ' + varName + ';');
  }
  L.push('}');

  for (let i = 0; i < blankL; i++) L.push('');

  // second function: ptr_style + func_return_type
  if (state.func_return_type === 'int\nfn()') {
    L.push(kw('void'));
    L.push(fn(fnB) + '(' + ptrDecl + ')' + ob_fn);
  } else {
    L.push(kw('void') + ' ' + fn(fnB) + '(' + ptrDecl + ')' + ob_fn);
  }
  if (showCmt) L.push(ind + cm('// ...'));
  L.push('}');

  // C++-only: init_list, ns_indent, ref_style
  if (lang === 'cpp') {
    for (let i = 0; i < blankL; i++) L.push('');

    const clsName = toNaming('my_class', state.ai_name_class || 'PascalCase');
    if (state.init_list?.includes('\n')) {
      L.push(fn(clsName) + '()');
      L.push('    : x(' + num('0') + ') {');
    } else {
      L.push(fn(clsName) + '() : x(' + num('0') + ')' + ob_fn);
    }
    L.push('}');

    for (let i = 0; i < blankL; i++) L.push('');

    const nsInd   = state.ns_indent === 'indent contents' ? ind : '';
    const refDecl = state.ref_style === 'int &ref' ? kw('int') + ' &r' : kw('int') + '& r';
    L.push(kw('namespace') + ' utils {');
    L.push(nsInd + kw('void') + ' ' + fn('helper') + '(' + refDecl + ');');
    L.push('}');
  }

  return L.join('\n');
}

function buildPyPreview() {
  const ind      = ' '.repeat(parseInt(state.indent_size) || 4);
  const q        = state.quote_style?.includes('"') ? '"' : "'";
  const fnName   = toNaming('add_values', state.ai_name_func  || 'snake_case');
  const clsName  = toNaming('my_class',   state.ai_name_class || 'PascalCase');
  const showCmt  = state.ai_comment_lang  !== 'none';
  const density  = state.ai_comment_density || 'when non-obvious';
  const hints    = state.ai_type_hints    || 'always';
  const hintOn   = hints !== 'never';
  const useTernary = state.ai_ternary !== 'avoid';

  const L = [];
  if (showCmt && density !== 'minimal') L.push(cm('# if / elif / else'));
  L.push(kw('if') + ' x > ' + num('0') + ':');
  L.push(ind + fn('do_a') + '()');
  L.push(kw('elif') + ' x == ' + num('0') + ':');
  L.push(ind + fn('do_b') + '()');
  L.push(kw('else') + ':');
  L.push(ind + fn('do_c') + '()');
  L.push('');

  if (useTernary) {
    L.push('result = x ' + kw('if') + ' x > ' + num('0') + ' ' + kw('else') + ' ' + num('0'));
    L.push('');
  }

  if (showCmt && density !== 'minimal') L.push(cm('# function'));
  const sig = hintOn
    ? kw('def') + ' ' + fn(fnName) + '(a: ' + kw('int') + ', b: ' + kw('int') + ') -> ' + kw('int') + ':'
    : kw('def') + ' ' + fn(fnName) + '(a, b):';
  L.push(sig);
  if (showCmt && density === 'verbose') L.push(ind + q + q + q + 'Add two numbers.' + q + q + q);
  L.push(ind + kw('return') + ' a + b');
  L.push('');

  if (showCmt && density !== 'minimal') L.push(cm('# class'));
  L.push(kw('class') + ' ' + fn(clsName) + ':');
  const initSig = hintOn
    ? kw('def') + ' ' + fn('__init__') + '(' + kw('self') + ', x: ' + kw('int') + ') -> ' + kw('None') + ':'
    : kw('def') + ' ' + fn('__init__') + '(' + kw('self') + ', x):';
  L.push(ind + initSig);
  L.push(ind + ind + kw('self') + '.x = x');
  return L.join('\n');
}

function buildJsPreview() {
  const ind      = state.indent_type === 'tabs' ? '\t' : ' '.repeat(parseInt(state.indent_size) || 2);
  const sc       = state.semicolon === 'never ;' ? '' : ';';
  const q        = state.quote_style?.includes('"') ? '"' : state.quote_style?.includes('`') ? '`' : "'";
  const varDecl  = state.ai_var_decl  || 'const';
  const arrowFn  = state.ai_arrow_fn  || 'always';
  const fnName   = toNaming('add_values', state.ai_name_func  || 'camelCase');
  const clsName  = toNaming('my_class',   state.ai_name_class || 'PascalCase');
  const showCmt  = state.ai_comment_lang !== 'none';
  const density  = state.ai_comment_density || 'when non-obvious';
  const useTernary = state.ai_ternary !== 'avoid';

  const L = [];
  if (showCmt && density !== 'minimal') L.push(cm('// if / else'));
  L.push(kw('if') + ' (x > ' + num('0') + ') {');
  L.push(ind + fn('doA') + '()' + sc);
  L.push('} ' + kw('else') + ' {');
  L.push(ind + fn('doB') + '()' + sc);
  L.push('}');
  L.push('');

  if (useTernary) {
    L.push(kw(varDecl) + ' result = x > ' + num('0') + ' ? x : ' + num('0') + sc);
    L.push('');
  }

  if (showCmt && density !== 'minimal') L.push(cm('// function'));
  if (arrowFn === 'always') {
    L.push(kw(varDecl) + ' ' + fn(fnName) + ' = (a, b) => {');
    L.push(ind + kw('return') + ' a + b' + sc);
    L.push('}' + sc);
  } else if (arrowFn === 'short only') {
    L.push(kw(varDecl) + ' ' + fn(fnName) + ' = (a, b) => a + b' + sc);
  } else {
    L.push(kw('function') + ' ' + fn(fnName) + '(a, b) {');
    L.push(ind + kw('return') + ' a + b' + sc);
    L.push('}');
  }
  L.push('');

  if (showCmt && density !== 'minimal') L.push(cm('// string'));
  L.push(kw(varDecl) + ' name = ' + q + 'hello' + q + sc);
  L.push('');
  if (showCmt && density !== 'minimal') L.push(cm('// class'));
  L.push(kw('class') + ' ' + fn(clsName) + ' {');
  L.push(ind + fn('constructor') + '(x) {');
  L.push(ind + ind + kw('this') + '.x = x' + sc);
  L.push(ind + '}');
  L.push('}');
  return L.join('\n');
}

// ─────────────────────────────────────────────
//  CONFIG GENERATORS
// ─────────────────────────────────────────────

function generateClangFormat() {
  const s = state;
  const indentSize = s.indent_type === 'tabs' ? parseInt(s.tab_width || '4') : parseInt(s.indent_size || '4');
  const fn_brace   = s.brace_func || 'fn(){';
  const if_brace   = s.brace_if   || 'if(cond){';
  let braceStyle   = 'Attach';
  if (fn_brace.includes('\n') && if_brace.includes('\n')) braceStyle = 'Allman';
  else if (fn_brace.includes('\n'))                       braceStyle = 'Linux';
  else if (fn_brace.includes(' {'))                       braceStyle = 'Attach';

  const colLimit       = s.line_len === 'no limit' ? '0' : (s.line_len || '100');
  const useTab         = s.indent_type === 'tabs' ? 'ForIndentation' : 'Never';
  const eof            = s.eof_newline !== 'no' ? 'true' : 'false';
  const nsIndent       = s.ns_indent === 'indent contents' ? 'All' : 'None';
  const ptrAlign       = s.ptr_style === 'int* ptr' ? 'Right' : s.ptr_style === 'int *ptr' ? 'Left' : 'Middle';
  const refAlign       = s.ref_style === 'int& ref' ? 'Right' : 'Left';
  const breakElse      = (s.brace_else || '').includes('\n') ? 'true' : 'false';
  const indentCase     = s.case_indent === 'indented' ? 'true' : 'false';
  const spBeforeParens = s.sp_keyword === 'if (cond)' ? 'ControlStatements' : 'Never';
  const spInParens     = s.sp_paren === '( cond )' ? 'true' : 'false';
  const spAssign       = s.sp_operator !== 'i=j+1' ? 'true' : 'false';
  const spComma        = s.sp_comma !== 'f(a,b)' ? 'true' : 'false';
  const allowShortIfs  = s.brace_single === 'all on 1 line' ? 'Always' : 'Never';
  const allowShortFns  = s.brace_single === 'all on 1 line' ? 'Inline' : 'None';
  const breakReturn    = s.func_return_type === 'int\nfn()' ? 'All' : 'None';
  const initList       = s.init_list?.includes('\n') ? 'NextLine' : 'BeforeColon';
  const maxEmpty       = s.blank_lines || '1';

  return `# Generated by Reforge
# Drop this file in your project root.
# VS Code with the C/C++ extension picks it up automatically.
---
BasedOnStyle:                        LLVM
IndentWidth:                         ${indentSize}
UseTab:                              ${useTab}
TabWidth:                            ${parseInt(s.tab_width || '4')}
ColumnLimit:                         ${colLimit}

# Braces
BreakBeforeBraces:                   ${braceStyle}
ElseOnNewLine:                       ${breakElse}
AllowShortIfStatementsOnASingleLine: ${allowShortIfs}
AllowShortLoopsOnASingleLine:        ${s.brace_single === 'all on 1 line' ? 'true' : 'false'}
AllowShortFunctionsOnASingleLine:    ${allowShortFns}

# Spaces
SpaceBeforeParens:                   ${spBeforeParens}
SpacesInParentheses:                 ${spInParens}
SpaceBeforeAssignmentOperators:      ${spAssign}
SpaceAfterComma:                     ${spComma}
SpaceAfterCStyleCast:                false

# Indentation
IndentCaseLabels:                    ${indentCase}
NamespaceIndentation:                ${nsIndent}
BreakConstructorInitializers:        ${initList}
MaxEmptyLinesToKeep:                 ${maxEmpty}

# Pointers & References
PointerAlignment:                    ${ptrAlign}
ReferenceAlignment:                  ${refAlign}

# Line breaks
AlwaysBreakAfterReturnType:          ${breakReturn}
AlignTrailingComments:               true

# Includes & EOF
SortIncludes:                        true
InsertNewlineAtEOF:                  ${eof}
`;
}

function generateEditorConfig() {
  const s = state;
  const indStyle = s.indent_type === 'tabs' ? 'tab' : 'space';
  const indSize  = s.indent_type === 'tabs' ? parseInt(s.tab_width || '4') : parseInt(s.indent_size || '4');
  const eof      = s.eof_newline !== 'no' ? 'true' : 'false';

  const cppSize  = (lang === 'cpp' || lang === 'c') ? indSize : 4;
  const pySize   = lang === 'py' ? parseInt(s.indent_size || '4') : 4;
  const jsSize   = lang === 'js' ? parseInt(s.indent_size || '2') : 2;
  const cppStyle = (lang === 'cpp' || lang === 'c') ? indStyle : 'space';
  const jsStyle  = lang === 'js' ? indStyle : 'space';

  return `# Generated by Reforge
# Works in VS Code, JetBrains, Vim, Emacs and more.
# VS Code: install the EditorConfig extension.
root = true

[*]
charset                  = utf-8
end_of_line              = lf
insert_final_newline     = ${eof}
trim_trailing_whitespace = true

[*.{c,cpp,h,hpp}]
indent_style             = ${cppStyle}
indent_size              = ${cppSize}

[*.py]
indent_style             = space
indent_size              = ${pySize}

[*.{js,ts,jsx,tsx}]
indent_style             = ${jsStyle}
indent_size              = ${jsSize}

[*.{json,yml,yaml}]
indent_style             = space
indent_size              = 2

[*.md]
trim_trailing_whitespace = false
`;
}

function generatePyprojectToml() {
  const s = state;
  const lineLen     = s.line_len === 'no limit' ? '100' : (s.line_len || '88');
  const skipStrNorm = s.quote_style?.includes('"') ? 'false' : 'true';
  const quoteStyle  = s.quote_style?.includes('"') ? '"double"' : '"single"';

  return `# Generated by Reforge
# Install: pip install black ruff isort
# Format:  black . && ruff check --fix . && isort .

[tool.black]
line-length               = ${lineLen}
skip-string-normalization = ${skipStrNorm}
target-version            = ["py311"]

[tool.ruff]
line-length               = ${lineLen}
target-version            = "py311"
select                    = ["E", "F", "W", "I"]
ignore                    = []

[tool.ruff.format]
quote-style               = ${quoteStyle}
indent-style              = "space"
line-ending               = "lf"

[tool.isort]
profile                   = "black"
line_length               = ${lineLen}

[tool.mypy]
python_version            = "3.11"
strict                    = false
ignore_missing_imports    = true
`;
}

function generatePrettierrc() {
  const s = state;
  const tabWidth = parseInt(s.indent_size || '2');
  const useTabs  = s.indent_type === 'tabs';
  const semi     = s.semicolon !== 'never ;';
  const singleQ  = !s.quote_style?.includes('"');
  const printW   = s.line_len === 'no limit' ? 120 : parseInt(s.line_len || '100');
  const trailing = s.trailing_comma === 'yes' ? '"all"' : '"none"';

  return `{
  "printWidth":    ${printW},
  "tabWidth":      ${tabWidth},
  "useTabs":       ${useTabs},
  "semi":          ${semi},
  "singleQuote":   ${singleQ},
  "trailingComma": ${trailing},
  "arrowParens":   "always",
  "endOfLine":     "lf"
}
`;
}

function generateReadme() {
  const label = LANGS[lang].label;
  const f = getFilesForLang();
  let install = '';
  if (f.clang)     install += `### .clang-format\n1. Install the [C/C++ extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode.cpptools) in VS Code\n2. Place \`.clang-format\` in your project root\n3. Right-click in a .c/.cpp file → Format Document\n\n`;
  if (f.tidy)      install += `### .clang-tidy\nAutomatically adds missing braces to your code.\n1. Install [clangd](https://marketplace.visualstudio.com/items?itemName=llvm-vs-code-extensions.vscode-clangd) in VS Code for inline warnings\n2. Place \`.clang-tidy\` in your project root\n3. One-time fix: \`clang-tidy --fix yourfile.c\`\n\n`;
  if (f.editor)    install += `### .editorconfig\n1. Install the [EditorConfig extension](https://marketplace.visualstudio.com/items?itemName=EditorConfig.EditorConfig) in VS Code\n2. Place \`.editorconfig\` in your project root\n3. Applied automatically while editing\n\n`;
  if (f.pyproject) install += `### pyproject.toml\n1. \`pip install black ruff isort\`\n2. Place \`pyproject.toml\` in your project root\n3. Run: \`black . && ruff check --fix . && isort .\`\n\n`;
  if (f.prettier)  install += `### .prettierrc\n1. Install [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) in VS Code\n2. Place \`.prettierrc\` in your project root\n3. Right-click in a .js/.ts file → Format Document\n\n`;

  return `# Reforge Config — ${label}

Generated: ${new Date().toLocaleDateString('en')}

## Contents
${f.clang     ? '- `.clang-format` — C/C++ formatting\n' : ''}\
${f.tidy      ? '- `.clang-tidy` — enforces braces around all statements\n' : ''}\
${f.editor    ? '- `.editorconfig` — universal editor settings\n' : ''}\
${f.pyproject ? '- `pyproject.toml` — Python (black, ruff, isort)\n' : ''}\
${f.prettier  ? '- `.prettierrc` — JavaScript/TypeScript (Prettier)\n' : ''}\
- \`.vscode/settings.json\` — format on save

## Setup

${install}---
All files go in the **project root** (same level as the \`.git\` folder).
`;
}

function generateVscodeSettings() {
  let out = '{\n  "editor.formatOnSave": true';
  if (lang === 'cpp' || lang === 'c') {
    const ext = lang === 'c' ? '"[c]"' : '"[cpp]"';
    out += `,\n  ${ext}: {\n    "editor.defaultFormatter": "ms-vscode.cpptools"\n  }`;
  } else if (lang === 'py') {
    out += `,\n  "[python]": {\n    "editor.defaultFormatter": "ms-python.black-formatter"\n  }`;
  } else if (lang === 'js') {
    out += `,\n  "[javascript]": {\n    "editor.defaultFormatter": "esbenp.prettier-vscode"\n  },\n  "[typescript]": {\n    "editor.defaultFormatter": "esbenp.prettier-vscode"\n  }`;
  }
  out += '\n}';
  return out;
}

function generateClangTidy() {
  const checks = [];
  if (state.brace_single === 'always {}') checks.push('readability-braces-around-statements');
  const checksStr    = checks.length ? `'${checks.join(',')}'` : "''";
  const checkOptions = checks.includes('readability-braces-around-statements')
    ? `\nCheckOptions:\n  - key:   readability-braces-around-statements.ShortStatementLines\n    value: '0'`
    : '';

  return `# Generated by Reforge
# Run: clang-tidy --fix yourfile.c
# VS Code: install the clangd extension for inline warnings.
---
Checks:      ${checksStr}
FormatStyle: file${checkOptions}
`;
}

function getFilesForLang() {
  const isCpp = lang === 'cpp' || lang === 'c';
  return {
    clang:     isCpp,
    tidy:      isCpp,
    editor:    true,
    pyproject: lang === 'py',
    prettier:  lang === 'js',
  };
}

function buildFiles() {
  const f = getFilesForLang();
  const files = {};
  if (f.clang)     files['.clang-format']         = generateClangFormat();
  if (f.tidy)      files['.clang-tidy']            = generateClangTidy();
  if (f.editor)    files['.editorconfig']           = generateEditorConfig();
  if (f.pyproject) files['pyproject.toml']          = generatePyprojectToml();
  if (f.prettier)  files['.prettierrc']             = generatePrettierrc();
  files['.vscode/settings.json'] = generateVscodeSettings();
  files['README.md']             = generateReadme();
  return files;
}

// ─────────────────────────────────────────────
//  EXPORT
// ─────────────────────────────────────────────

async function saveFiles() {
  const btn = document.getElementById('download-btn');
  btn.disabled = true;

  if ('showDirectoryPicker' in window) {
    let dirHandle;
    try {
      dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
    } catch (e) {
      btn.disabled = false;
      return; // user cancelled
    }
    btn.textContent = 'Saving...';
    try {
      const files = buildFiles();
      for (const [path, content] of Object.entries(files)) {
        const parts = path.split('/');
        let handle = dirHandle;
        for (let i = 0; i < parts.length - 1; i++) {
          handle = await handle.getDirectoryHandle(parts[i], { create: true });
        }
        const fh = await handle.getFileHandle(parts.at(-1), { create: true });
        const w  = await fh.createWritable();
        await w.write(content);
        await w.close();
      }
      btn.textContent = 'Saved! ✓';
    } catch (e) {
      btn.textContent = 'Error — try again';
    }
  } else {
    // fallback: ZIP download
    btn.textContent = 'Packing...';
    if (!window.JSZip) {
      await new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        s.onload = res; s.onerror = rej;
        document.head.appendChild(s);
      });
    }
    const zip = new JSZip();
    for (const [path, content] of Object.entries(buildFiles())) zip.file(path, content);
    const blob = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `reforge_${LANGS[lang].ext}_config.zip`;
    a.click();
    btn.textContent = 'Downloaded! ✓';
  }

  setTimeout(() => {
    const label = 'showDirectoryPicker' in window ? 'Save to folder' : 'Download ZIP';
    btn.textContent = label;
    btn.disabled = false;
  }, 2500);
  document.getElementById('s3').className = 'step done';
}

// set button label on load based on browser support
document.addEventListener('DOMContentLoaded', () => {
  if (!('showDirectoryPicker' in window)) {
    document.getElementById('download-btn').textContent = 'Download ZIP';
  }
  if (hashToState()) {
    selectLang(lang, null, false);
  }
});

function generateAiPrompt() {
  const s = state;
  const label = LANGS[lang].label;
  const L = [];

  L.push(`When writing ${label} code for me, always follow these exact style rules:\n`);

  if (lang === 'cpp' || lang === 'c') {
    L.push(`- Indentation: ${s.indent_type === 'tabs' ? `tabs (${s.tab_width || '4'} spaces wide)` : `${s.indent_size || '4'} spaces per level`}`);

    const ob_fn  = s.brace_func?.includes('\n') ? 'next line (Allman)' : 'same line (K&R)';
    const ob_if  = s.brace_if?.includes('\n')   ? 'next line' : 'same line';
    const ksp    = s.sp_keyword === 'if(cond)' ? '' : ' ';
    const ifEx   = `if${ksp}(x)${s.brace_if?.includes(' {') ? ' {' : s.brace_if?.includes('\n') ? '\n{' : '{'}`;
    L.push(`- Function/class opening brace: ${ob_fn}`);
    L.push(`- if opening brace: ${ob_if} — example: \`${ifEx}\``);
    L.push(`- else position: \`${s.brace_else || '} else {'}\``);
    L.push(`- Loop opening brace: ${s.brace_loop?.includes('\n') ? 'next line' : 'same line'}`);

    if (s.brace_single === 'all on 1 line')       L.push(`- Single-statement blocks: all on one line, no braces — \`if (x) doSomething();\``);
    else if (s.brace_single === 'omit {} if 1 line') L.push(`- Single-statement blocks: omit braces, body on next line`);
    else                                              L.push(`- Single-statement blocks: always use braces`);

    L.push(`- Spaces around operators: ${s.sp_operator !== 'i=j+1' ? 'yes — `x = a + b`' : 'no — `x=a+b`'}`);
    L.push(`- Space before keyword parens: ${s.sp_keyword === 'if(cond)' ? 'no — `if(x)`' : 'yes — `if (x)`'}`);
    L.push(`- Space inside parens: ${s.sp_paren === '( cond )' ? 'yes — `( x )`' : 'no — `(x)`'}`);
    L.push(`- Space after comma: ${s.sp_comma !== 'f(a,b)' ? 'yes — `f(a, b)`' : 'no — `f(a,b)`'}`);
    L.push(`- Max blank lines between functions/blocks: ${s.blank_lines || '1'}`);
    L.push(`- switch/case: ${s.case_indent === 'indented' ? 'indent case labels' : 'case labels at switch level'}`);
    L.push(`- Return type: ${s.func_return_type === 'int\nfn()' ? 'on its own line above the function name' : 'on the same line as the function name'}`);
    L.push(`- Pointer style: \`${s.ptr_style || 'int* ptr'}\``);

    if (lang === 'cpp') {
      L.push(`- Reference style: \`${s.ref_style || 'int& ref'}\``);
      L.push(`- Constructor initializer list: ${s.init_list?.includes('\n') ? 'on next line — `Foo()\\n  : x(0) {`' : 'on same line — `Foo() : x(0) {`'}`);
      L.push(`- Namespace contents: ${s.ns_indent === 'indent contents' ? 'indented' : 'not indented'}`);
    }

    L.push(`- Max line length: ${s.line_len === 'no limit' ? 'no limit' : `${s.line_len || '100'} characters`}`);
    L.push(`- Final newline at end of file: ${s.eof_newline !== 'no' ? 'yes' : 'no'}`);
  }

  if (lang === 'py') {
    L.push(`- Max line length: ${s.line_len || '79'} characters`);
    L.push(`- Quotes: prefer ${s.quote_style?.includes('"') ? 'double' : 'single'} quotes`);
    L.push(`- Import order: ${s.import_order || 'stdlib, then third-party, then local'}`);
  }

  if (lang === 'js') {
    L.push(`- Indentation: ${s.indent_type === 'tabs' ? 'tabs' : `${s.indent_size || '2'} spaces per level`}`);
    L.push(`- Semicolons: ${s.semicolon !== 'never ;' ? 'always' : 'never'}`);
    L.push(`- Quotes: ${s.quote_style?.includes('"') ? 'double quotes' : s.quote_style?.includes('`') ? 'template literals (backtick)' : 'single quotes'}`);
    L.push(`- Trailing commas in multi-line expressions: ${s.trailing_comma === 'yes' ? 'yes' : 'no'}`);
    L.push(`- Max line length: ${s.line_len === 'no limit' ? 'no limit' : `${s.line_len || '100'} characters`}`);
  }

  const aiOpts = AI_ONLY[lang] || [];
  if (aiOpts.length) {
    L.push('\n// AI-only preferences (not enforceable by formatter):');
    aiOpts.forEach(opt => {
      const val = state[opt.key];
      if (val !== undefined) L.push(`- ${opt.label}: ${val}`);
    });
  }

  L.push(`\nApply these rules to every ${label} snippet you write for me, without exception.`);
  return L.join('\n');
}

function copyAiPrompt() {
  navigator.clipboard.writeText(generateAiPrompt()).then(() => showToast('AI prompt copied!'));
}
