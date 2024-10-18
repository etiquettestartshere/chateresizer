export class Resizer {

  // TODO stop using localStorage and use an invisible setting (config: false)
  static init() {
    Hooks.once('renderSidebarTab', Resizer._sideBarSize);
    Hooks.on('renderChatLog', Resizer._sideBarLog);
    Hooks.on('renderChatLog', Resizer._popOutLog);
    Hooks.on('collapseSidebar', Resizer._collapseSidebar);
  }

  // Set sidebar size on first render
  static _sideBarSize(sidebar, html) {
    const lastSidebarSize = window.localStorage.getItem('chatresizer.sidebar-init-size');
    if (!lastSidebarSize) return stl.setProperty('--chatresizer-sidebar-init-size', `300px`);
    let updatesize;
    if (Number.isInteger(+lastSidebarSize) && lastSidebarSize <= 560) updatesize = lastSidebarSize;
    else updatesize = 560;
    const stl = document.querySelector(":root").style;
    stl.setProperty('--chatresizer-sidebar-init-size', `${updatesize}px`);
    return;
    if (Number.isInteger(+lastSidebarSize)) {

      // TODO Find new class rather than ID
      const sidebar = document.querySelector('#sidebar-content');
      sidebar.setAttribute('style', `width: ${lastSidebarSize}px`);
    }
  }

  // Handle preserving sidebar side on sidebar collapse
  static _collapseSidebar(sidebar, isCollapsing) {
    sidebar.element.querySelector('#sidebar-content').removeAttribute('style');
    return;
    const lastSidebarSize = window.localStorage.getItem('chatresizer.sidebar-init-size');
    if (!lastSidebarSize || isCollapsing) return;
    if (Number.isInteger(+lastSidebarSize)) {

      // TODO Find new class rather than ID
      const sidebar = document.querySelector('#sidebar-content');
      sidebar.setAttribute('style', `width: ${lastSidebarSize}px`);
    }
  }

  // Handle sidebar chatlog resizing
  // TODO stop destructuring, foundry.applications.instances
  // TODO update first param
  static _sideBarLog(chat, html) {
    if (chat.isPopout) return;
    const sidebar = ui.sidebar.element.querySelector('#sidebar-content');
    const chatform = ui.chat.element.querySelector('form textarea');
    if (!chatform) return;
    Resizer._assignResizer(sidebar);
    Resizer._assignVerticalResizer(chatform);
    chat.options.window.resizable = true;
    chat.options.position.height = 0;
    /*
    const lastSidebarSize = window.localStorage.getItem('chatresizer.sidebar-init-size');
    if (lastSidebarSize && Number.isInteger(+lastSidebarSize)) chat.options.position.width = parseInt(lastSidebarSize);*/
    const lastChatformSize = window.localStorage.getItem('chatresizer.chatform-sidebar-init-size');
    if (!lastChatformSize) return;
    if (Number.isInteger(+lastChatformSize)) {
      chatform.setAttribute('style', `flex: 0 0 ${lastChatformSize}px`);
    };
  }

  // Handle pop out chat resizing and pop out chat form resizing
  // TODO stop destructuring
  // TODO update first param
  static _popOutLog(chat, html) {
    if (!chat.isPopout) return;
    chat.options.window.resizable = true;
    const element = html.querySelector('textarea');
    //element.id = '__temp'; // Hack for popout duplicate element id
    element.classList.add("popout");
    const chatform = html.querySelector('form textarea');
    if (!chatform) return;
    Resizer._assignVerticalResizer(chatform);
    //html.setAttribute('style', 'width: 900px');
    //chat.options.window.resizable = true;
    const lastChatformSize = window.localStorage.getItem('chatresizer.chatform-popout-init-size');
    if (!lastChatformSize) return;
    if (Number.isInteger(+lastChatformSize)) {
      chatform.setAttribute('style', `flex: 0 0 ${lastChatformSize}px`);
    }
  }

  // Perform sidebar resizing
  static _assignResizer(sidebar) {
    let minSize = 300;
    let maxSize = 570;
    let mouseStart, startSize, newSize;

    // Create a resizer handle
    const resizer = document.createElement('div');
    resizer.style.width = '6px';
    resizer.style.height = '100%';
    resizer.style.position = 'absolute';
    resizer.style.top = '0';
    resizer.style.cursor = 'col-resize';
    sidebar.appendChild(resizer);

    // TODO         foundry.applications.instances              foundry.applications.sidebar.tabs.ChatLog
    for (const v of Object.values(ui.windows)) if (v instanceof ChatLog) return v.element[0].appendChild(resizer);

    // Listen for mousedown on resizer
    resizer.addEventListener('mousedown', startResize, false);

    // React to user resizing
    function startResize(e) {

      // TODO foundry.applications.instances  
      if (!ui.sidebar.expanded) return;
      mouseStart = e.clientX;
      startSize = sidebar.offsetWidth;
      window.addEventListener('mousemove', resize, false);
      window.addEventListener('mouseup', stopResize, false);
    }

    // Perform the resize operation
    function resize(e) {
      newSize = Math.round(startSize + mouseStart - e.clientX);
      if (newSize >= minSize && newSize < maxSize) {
        sidebar.setAttribute('style', `width: ${newSize}px`);
      } else if (newSize < minSize && newSize < maxSize) {
        sidebar.setAttribute('style', `width: ${minSize}px`);
      } else sidebar.setAttribute('style', `width: ${maxSize}px`);
    }

    // On mouseup remove listeners & save final size
    function stopResize(e) {
      window.localStorage.setItem('chatresizer.sidebar-init-size', sidebar.offsetWidth);
      const stl = document.querySelector(":root").style;
      const lastSidebarSize = window.localStorage.getItem('chatresizer.sidebar-init-size');
      let updatesize;
      if (Number.isInteger(+lastSidebarSize) && lastSidebarSize <= 560) updatesize = lastSidebarSize;
      else updatesize = 560;
      stl.setProperty('--chatresizer-sidebar-init-size', `${updatesize}px`);
      window.removeEventListener('mousemove', resize, false);
      window.removeEventListener('mouseup', stopResize, false);
    }
  }

  // Perform chat form resizing
  static _assignVerticalResizer(chatform) {
    let minSize = 100;
    let mouseStart, startSize, newSize;

    // Create a resizer handle
    const resizer = document.createElement('div');
    /*
    resizer.style.width = '100%';
    resizer.style.height = '4px';
    resizer.style.position = 'fixed';
    resizer.style.cursor = 'row-resize';*/
    resizer.style.width = '100%'
    resizer.style.height = '6px';
    resizer.style.position = 'absolute';
    resizer.style.cursor = 'row-resize';
    resizer.classList.add("FIXME");
    //chatform.prepend(resizer);
    chatform.insertAdjacentElement("beforebegin", resizer);

    // Listen for mousedown on resizer
    resizer.addEventListener('mousedown', startResize, false);

    // React to user resizing
    function startResize(e) {
      mouseStart = e.clientY;
      startSize = chatform.offsetHeight;
      window.addEventListener('mousemove', resize, false);
      window.addEventListener('mouseup', stopResize, false);
    }

    // Perform the resize operation
    function resize(e) {
      newSize = Math.round(startSize + mouseStart - e.clientY);
      if (newSize >= minSize) {
        chatform.setAttribute('style', `flex: 0 0 ${newSize}px`);
      } else {
        chatform.setAttribute('style', `flex: 0 0 ${minSize}px`);
      }
    }

    // On mouseup remove listeners & save final size
    function stopResize(e) {
      const chatType = Array.from(chatform.classList).includes('popout') ? "popout" : "sidebar";
      window.localStorage.setItem(`chatresizer.chatform-${chatType}-init-size`, chatform.offsetHeight);
      window.removeEventListener('mousemove', resize, false);
      window.removeEventListener('mouseup', stopResize, false);
    }
  }
}

Hooks.once("init", Resizer.init);