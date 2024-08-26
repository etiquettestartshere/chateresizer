const _sdbDebouncedReload = foundry.utils.debounce(() => window.location.reload(), 100);
const _sdbFloatingDefaultSize = 2.5;

Hooks.once('init', function() {
  game.settings.register('sidebar-resizer', 'enableChatFormatting', {
    name: 'Enable Chat Formatting (EXPERIMENTAL)',
    hint: 'Enhances the chat box with text formatting tools.',
    scope: 'world',
    config: true,
    type: Boolean,
    default: false,
    onChange: _sdbDebouncedReload
  });

  game.settings.register('sidebar-resizer', 'chatFormattingSendMod', {
    name: 'Formatted Chat Key Modifier',
    hint: 'Key combination to press with Enter before sending a message, when chat formatting is enabled',
    scope: 'world',
    config: true,
    type: String,
    choices: {
      'enter': 'Enter',
      'shift': 'Shift + Enter',
      'ctrl': 'Ctrl + Enter'
    },
    default: 'ctrl',
    onChange: _sdbDebouncedReload
  });
})

function _getImportantStr() {
  if (game.modules.get('dnd-ui')?.active || game.modules.get('pathfinder-ui-legacy')?.active)
    return ' !important';
  else
    return '';
}

function _createTinyMceChat(selector) {
  const modKey = game.settings.get('sidebar-resizer', 'chatFormattingSendMod')
  tinyMCE.init({
    target: selector,
    branding: false,
    statusbar: false,
    menubar: false,
    plugins: 'lists',
    toolbar: 'bold italic underline | backcolor forecolor removeformat | numlist bullist | p h1 h2 h3',
    height: '100%',
    forced_root_block: false,
    body_class: 'chat-form-tinymce',
    content_style: '.chat-form-tinymce {background-color:#f1f2f6;}',
    setup: function(editor) {
      editor.on('keydown', function (event) {
        if (modKey === 'enter' && event.keyCode === 13 && event.shiftKey) {
          event.preventDefault();
          event.stopPropagation();
          this.execCommand('InsertLineBreak');
        } else if (event.keyCode === 13 && ((modKey === 'ctrl' && event.ctrlKey) || (modKey === 'shift' && event.shiftKey) || (modKey === 'enter' && !event.ctrlKey))) {
          if (!event.target?.innerText.trim()?.length)
            return;
          event.preventDefault();
          event.stopPropagation();
          ChatMessage.create({content: event.target.innerHTML, speaker: ChatMessage.getSpeaker()})
          event.target.innerHTML = '';
        }
      });
    }
  })
}

function _assignResizer(sidebar) {
  let minSize = 300;
  let mouseStart, startSize, newSize;
  let isImportant = _getImportantStr();

  // Create a resizer handle
  const resizer = document.createElement('div');
  resizer.style.width = '6px';
  resizer.style.height = '100%';
  resizer.style.position = 'absolute';
  resizer.style.top = '0';
  resizer.style.cursor = 'col-resize';
  sidebar.appendChild(resizer);

  // Listen for mousedown on resizer
  resizer.addEventListener('mousedown', startResize, false);

  // React to user resizing
  function startResize(e) {
    if (ui.sidebar._collapsed) return;
    mouseStart = e.clientX;
    startSize = sidebar.offsetWidth;
    window.addEventListener('mousemove', resize, false);
    window.addEventListener('mouseup', stopResize, false);
  }

  // Perform the resize operation
  function resize(e) {
    newSize = Math.round(startSize + mouseStart - e.clientX);
    if (newSize >= minSize) {
      sidebar.setAttribute('style', `width: ${newSize}px${isImportant}`);
    } else {
      sidebar.setAttribute('style', `width: ${minSize}px${isImportant}`);
    }
  }

  // On mouseup remove listeners & save final size
  function stopResize(e) {
    window.localStorage.setItem('sidebar-resizer-init-size', sidebar.offsetWidth);
    window.removeEventListener('mousemove', resize, false);
    window.removeEventListener('mouseup', stopResize, false);
  }
}

function _assignVerticalResizer(chatform) {
  let minSize = 100;
  let mouseStart, startSize, newSize;
  let isImportant = '';

  if (game.modules.get('dnd-ui')?.active || game.modules.get('pathfinder-ui-legacy')?.active)
    isImportant = ' !important';

  // Create a resizer handle
  const resizer = document.createElement('div');
  resizer.style.width = '100%';
  resizer.style.height = '4px';
  if (game.settings.get('sidebar-resizer', 'enableChatFormatting'))
    resizer.style.position = 'relative';
  else
    resizer.style.position = 'fixed';
  resizer.style.cursor = 'row-resize';
  chatform.prepend(resizer);

  // Listen for mousedown on resizer
  resizer.addEventListener('mousedown', startResize, false);

  // React to user resizing
  function startResize(e) {
    if (ui.sidebar._collapsed) return;
    mouseStart = e.clientY;
    startSize = chatform.offsetHeight;
    window.addEventListener('mousemove', resize, false);
    window.addEventListener('mouseup', stopResize, false);
  }

  // Perform the resize operation
  function resize(e) {
    newSize = Math.round(startSize + mouseStart - e.clientY);
    if (newSize >= minSize) {
      chatform.setAttribute('style', `flex: 0 0 ${newSize}px${isImportant}`);
    } else {
      chatform.setAttribute('style', `flex: 0 0 ${minSize}px${isImportant}`);
    }
  }

  // On mouseup remove listeners & save final size
  function stopResize(e) {
    window.localStorage.setItem('chatform-resizer-init-size', chatform.offsetHeight);
    window.removeEventListener('mousemove', resize, false);
    window.removeEventListener('mouseup', stopResize, false);
  }
}

Hooks.on("renderChatLog", function(chat) {
  const sidebar = ui.sidebar.element[0];
  const chatform = $(ui.chat.element[0]).find("#chat-form")[0];
  if (!chatform) return;
  _assignResizer(sidebar);
  _assignVerticalResizer(chatform);
  chat.options.resizable = true;
  chat.options.height = parseInt($("#board").css('height')) / _sdbFloatingDefaultSize;
  const lastSidebarSize = window.localStorage.getItem('sidebar-resizer-init-size');
  if (lastSidebarSize && Number.isInteger(+lastSidebarSize)) chat.options.width = parseInt(lastSidebarSize);
});

/*
Hooks.once('ready', function () {
  // Enable Chat popout Resize
  return
  if (game.modules.get('lib-wrapper')?.active) {
    libWrapper.register('sidebar-resizer', 'ChatLog.defaultOptions', function (wrapped, ...args) {
      let result = wrapped(...args);
      result.resizable = true;
      result.height = parseInt($("#board").css('height')) / _sdbFloatingDefaultSize;
      const lastSidebarSize = window.localStorage.getItem('sidebar-resizer-init-size');
      if (lastSidebarSize && Number.isInteger(+lastSidebarSize)) result.width = parseInt(lastSidebarSize);
      return result;
    }, 'WRAPPER');
    libWrapper.register('sidebar-resizer', 'CombatTracker.defaultOptions', function (wrapped, ...args) {
      let result = wrapped(...args);
      result.resizable = true;
      result.height = parseInt($("#board").css('height')) / _sdbFloatingDefaultSize;
      return result;
    }, 'WRAPPER');
    libWrapper.register('sidebar-resizer', 'SceneDirectory.defaultOptions', function (wrapped, ...args) {
      let result = wrapped(...args);
      result.resizable = true;
      result.height = parseInt($("#board").css('height')) / _sdbFloatingDefaultSize;
      return result;
    }, 'WRAPPER');
    libWrapper.register('sidebar-resizer', 'ActorDirectory.defaultOptions', function (wrapped, ...args) {
      let result = wrapped(...args);
      result.resizable = true;
      result.height = parseInt($("#board").css('height')) / _sdbFloatingDefaultSize;
      return result;
    }, 'WRAPPER');
    libWrapper.register('sidebar-resizer', 'ItemDirectory.defaultOptions', function (wrapped, ...args) {
      let result = wrapped(...args);
      result.resizable = true;
      result.height = parseInt($("#board").css('height')) / _sdbFloatingDefaultSize;
      return result;
    }, 'WRAPPER');
    libWrapper.register('sidebar-resizer', 'RollTableDirectory.defaultOptions', function (wrapped, ...args) {
      let result = wrapped(...args);
      result.resizable = true;
      result.height = parseInt($("#board").css('height')) / _sdbFloatingDefaultSize;
      return result;
    }, 'WRAPPER');
    libWrapper.register('sidebar-resizer', 'CardsDirectory.defaultOptions', function (wrapped, ...args) {
      let result = wrapped(...args);
      result.resizable = true;
      result.height = parseInt($("#board").css('height')) / _sdbFloatingDefaultSize;
      return result;
    }, 'WRAPPER');
    libWrapper.register('sidebar-resizer', 'PlaylistDirectory.defaultOptions', function (wrapped, ...args) {
      let result = wrapped(...args);
      result.resizable = true;
      result.height = parseInt($("#board").css('height')) / _sdbFloatingDefaultSize;
      return result;
    }, 'WRAPPER');
    libWrapper.register('sidebar-resizer', 'CompendiumDirectory.defaultOptions', function (wrapped, ...args) {
      let result = wrapped(...args);
      result.resizable = true;
      result.height = parseInt($("#board").css('height')) / _sdbFloatingDefaultSize;
      return result;
    }, 'WRAPPER');
  } else {
    ui.notifications.warn("Sidebar and Chat Resizer: LibWrapper not enabled")
  }
});
*/

Hooks.once('renderSidebarTab', function() {
  const lastSidebarSize = window.localStorage.getItem('sidebar-resizer-init-size');
  if (!lastSidebarSize) return;
  if (Number.isInteger(+lastSidebarSize)) {
    const sidebar = document.querySelector('#sidebar');
    sidebar.setAttribute('style', `width: ${lastSidebarSize}px${_getImportantStr()}`);
  }
});

Hooks.on('renderChatLog', function (chat, div) {
  if (chat.popOut) {
    const element = div.find("#chat-message")[0];
    element.id = '__temp'; // Hack for popout duplicate element id
    if (game.settings.get('sidebar-resizer', 'enableChatFormatting'))
      _createTinyMceChat(div.find('textarea')[0]);
    element.id = 'chat-message';
  }
  const chatform = div.find("#chat-form")[0];
  if (!chatform) return;
  const lastChatformSize = window.localStorage.getItem('chatform-resizer-init-size');
  if (!lastChatformSize) return;
  if (Number.isInteger(+lastChatformSize)) {
    chatform.setAttribute('style', `flex: 0 0 ${lastChatformSize}px`);
  }
  _assignVerticalResizer(chatform);
});

Hooks.once('renderChatLog', function(chat, div) {
  if (game.settings.get('sidebar-resizer', 'enableChatFormatting')) {
    _createTinyMceChat(div.find('textarea')[0]);
  }
});

Hooks.on('collapseSidebar', function(_, isCollapsing) {
  const lastSidebarSize = window.localStorage.getItem('sidebar-resizer-init-size');
  if (!lastSidebarSize || isCollapsing) return;
  if (Number.isInteger(+lastSidebarSize)) {
    const sidebar = document.querySelector('#sidebar');
    sidebar.setAttribute('style', `width: ${lastSidebarSize}px${_getImportantStr()}`);
  }
});