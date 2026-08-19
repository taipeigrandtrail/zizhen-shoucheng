(() => {
  "use strict";

  const DEFAULT_CANVAS = { width: 390, height: 844 };

  const state = {
    canvas: { ...DEFAULT_CANVAS },
    blocks: [],
    selectedId: null,
    dragState: null
  };

  const refs = {
    canvas: document.querySelector("#canvas"),
    bgLayer: document.querySelector("#bg-layer"),
    viewport: document.querySelector("#viewport"),
    addButton: document.querySelector("#add-block"),
    removeButton: document.querySelector("#remove-block"),
    clearButton: document.querySelector("#clear-blocks"),
    copyButton: document.querySelector("#copy-json"),
    downloadButton: document.querySelector("#download-json"),
    importButton: document.querySelector("#import-json-btn"),
    importArea: document.querySelector("#import-json"),
    output: document.querySelector("#output-json"),
    message: document.querySelector("#tb-message"),
    bgInput: document.querySelector("#bg-input"),
    fieldName: document.querySelector("#field-name"),
    fieldText: document.querySelector("#field-text"),
    fieldX: document.querySelector("#field-x"),
    fieldY: document.querySelector("#field-y"),
    fieldW: document.querySelector("#field-w"),
    fieldH: document.querySelector("#field-h"),
    status: document.querySelector("#selected-status")
  };

  let blockIdSeed = 0;
  let urlRevokeQueue = [];

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function normalize(value) {
    return Number.parseFloat(value.toFixed(2));
  }

  function loadSaved() {
    const raw = localStorage.getItem("zizhen-text-box-layout");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.blocks)) return;
      const incoming = parsed.blocks;
      if (typeof parsed.canvasWidth === "number" && parsed.canvasWidth > 0) {
        state.canvas.width = parsed.canvasWidth;
      }
      if (typeof parsed.canvasHeight === "number" && parsed.canvasHeight > 0) {
        state.canvas.height = parsed.canvasHeight;
      }
      state.blocks = incoming
        .filter(item => item && typeof item === "object")
        .map(item => ({
          id: item.id || `block-${Date.now()}-${blockIdSeed += 1}`,
          name: item.name || "文字區塊",
          text: item.text || "",
          x: clamp(Number(item.x || 0), 0, 100),
          y: clamp(Number(item.y || 0), 0, 100),
          w: clamp(Number(item.w || 30), 1, 100),
          h: clamp(Number(item.h || 12), 1, 100),
          rawText: String(item.text || "")
        }))
        .filter(block => block.w > 0 && block.h > 0);
      blockIdSeed = state.blocks.length;
      if (state.blocks.length) {
        state.selectedId = state.blocks[0].id;
      }
    } catch (_error) {
      showMessage("無法解析本地儲存資料，將會以空白重新開始");
      localStorage.removeItem("zizhen-text-box-layout");
    }
  }

  function saveState() {
    localStorage.setItem("zizhen-text-box-layout", JSON.stringify(serializeState()));
  }

  function createElement(block) {
    const node = document.createElement("button");
    node.type = "button";
    node.className = "tb-block";
    node.dataset.id = block.id;
    node.setAttribute("aria-label", `${block.name}(${block.text || "空白"})`);
    node.style.left = `${block.x}%`;
    node.style.top = `${block.y}%`;
    node.style.width = `${block.w}%`;
    node.style.height = `${block.h}%`;

    const label = document.createElement("span");
    label.className = "label";
    label.textContent = block.text || block.name || "文字方塊";
    node.append(label);

    const handle = document.createElement("span");
    handle.className = "handle";
    handle.setAttribute("aria-hidden", "true");
    handle.addEventListener("pointerdown", event => {
      event.stopPropagation();
      onBlockPointerDown(event, block.id, "resize");
    });
    node.append(handle);

    node.addEventListener("pointerdown", event => onBlockPointerDown(event, block.id, "move"));
    return node;
  }

  function renderCanvas() {
    const old = Array.from(refs.viewport.querySelectorAll(".tb-block"));
    old.forEach(node => node.remove());

    state.blocks.forEach(block => {
      const node = createElement(block);
      if (block.id === state.selectedId) {
        node.classList.add("active");
      }
      refs.viewport.append(node);
    });

    refs.status.textContent = state.selectedId ? `已選取：${getSelected().name}` : "未選取";
    bindGlobalPointerHandlers();
    updateInspectorValues();
    updateOutput();
  }

  function renderText(node, block) {
    node.style.left = `${clamp(block.x, 0, 100)}%`;
    node.style.top = `${clamp(block.y, 0, 100)}%`;
    node.style.width = `${clamp(block.w, 1, 100)}%`;
    node.style.height = `${clamp(block.h, 1, 100)}%`;
    node.querySelector(".label").textContent = block.text || block.name || "文字方塊";
  }

  function getSelected() {
    return state.blocks.find(block => block.id === state.selectedId) || null;
  }

  function setSelected(id) {
    state.selectedId = id;
    renderCanvas();
  }

  function addBlock() {
    const id = `block-${Date.now()}-${blockIdSeed += 1}`;
    const block = {
      id,
      name: `文字區塊 ${state.blocks.length + 1}`,
      text: "文字",
      x: 12,
      y: 12 + Math.min(state.blocks.length, 4) * 8,
      w: 30,
      h: 12
    };
    state.blocks.push(block);
    state.selectedId = id;
    renderCanvas();
    saveState();
    showMessage("已新增文字區塊");
  }

  function removeSelected() {
    if (!state.selectedId) {
      showMessage("請先選取要刪除的區塊");
      return;
    }
    const index = state.blocks.findIndex(block => block.id === state.selectedId);
    if (index >= 0) {
      state.blocks.splice(index, 1);
      state.selectedId = state.blocks[0]?.id || null;
      renderCanvas();
      saveState();
      showMessage("已刪除所選區塊");
    }
  }

  function clearBlocks() {
    if (!state.blocks.length) return;
    if (!confirm("確定清空全部區塊？")) return;
    state.blocks = [];
    state.selectedId = null;
    renderCanvas();
    saveState();
    showMessage("已清空區塊");
  }

  function updateInspectorValues() {
    const selected = getSelected();
    if (!selected) {
      refs.fieldName.value = "";
      refs.fieldText.value = "";
      refs.fieldX.value = "";
      refs.fieldY.value = "";
      refs.fieldW.value = "";
      refs.fieldH.value = "";
      return;
    }
    refs.fieldName.value = selected.name;
    refs.fieldText.value = selected.text;
    refs.fieldX.value = selected.x.toFixed(2);
    refs.fieldY.value = selected.y.toFixed(2);
    refs.fieldW.value = selected.w.toFixed(2);
    refs.fieldH.value = selected.h.toFixed(2);
  }

  function onInspectorInput() {
    const selected = getSelected();
    if (!selected) return;
    selected.name = refs.fieldName.value || selected.name;
    selected.text = refs.fieldText.value || "";
    selected.x = clamp(normalize(Number(refs.fieldX.value)), 0, 100 - selected.w);
    selected.y = clamp(normalize(Number(refs.fieldY.value)), 0, 100 - selected.h);
    selected.w = clamp(normalize(Number(refs.fieldW.value)), 1, 100 - selected.x);
    selected.h = clamp(normalize(Number(refs.fieldH.value)), 1, 100 - selected.y);
    const node = refs.viewport.querySelector(`[data-id="${selected.id}"]`);
    if (node) {
      renderText(node, selected);
      node.setAttribute("aria-label", `${selected.name}(${selected.text || "空白"})`);
    }
    refs.status.textContent = `已選取：${selected.name}`;
    updateOutput();
    saveState();
  }

  function serializeState() {
    return {
      version: "1.0",
      canvasWidth: state.canvas.width,
      canvasHeight: state.canvas.height,
      blocks: state.blocks.map(block => ({
        id: block.id,
        name: block.name,
        text: block.text,
        x: normalize(block.x),
        y: normalize(block.y),
        w: normalize(block.w),
        h: normalize(block.h)
      }))
    };
  }

  function updateOutput() {
    const payload = JSON.stringify(serializeState(), null, 2);
    refs.output.value = payload;
    saveState();
  }

  function copyOutput() {
    const payload = refs.output.value;
    navigator.clipboard.writeText(payload).then(() => {
      showMessage("已複製設定到剪貼簿");
    }).catch(() => {
      showMessage("複製失敗，請手動選取文字複製");
      refs.output.focus();
      refs.output.select();
    });
  }

  function downloadOutput() {
    const payload = refs.output.value || JSON.stringify(serializeState(), null, 2);
    const file = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(file);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "text-box-layout.json";
    anchor.style.display = "none";
    document.body.append(anchor);
    anchor.click();
    URL.revokeObjectURL(url);
    anchor.remove();
    showMessage("已開始下載");
  }

  function importFromText() {
    const raw = refs.importArea.value.trim();
    if (!raw) {
      showMessage("請先貼上 JSON");
      return;
    }
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (_error) {
      showMessage("JSON 解析失敗，請確認格式");
      return;
    }
    if (!parsed || !Array.isArray(parsed.blocks)) {
      showMessage("匯入格式錯誤，缺少 blocks 陣列");
      return;
    }
    state.blocks = parsed.blocks
      .filter(item => item && typeof item === "object")
      .map((item, index) => ({
        id: item.id || `block-${Date.now()}-${index}`,
        name: item.name || `文字區塊 ${index + 1}`,
        text: item.text || "",
        x: clamp(Number(item.x || 0), 0, 100),
        y: clamp(Number(item.y || 0), 0, 100),
        w: clamp(Number(item.w || 25), 1, 100),
        h: clamp(Number(item.h || 10), 1, 100)
      }));
    if (typeof parsed.canvasWidth === "number" && parsed.canvasWidth > 0) {
      state.canvas.width = parsed.canvasWidth;
    }
    if (typeof parsed.canvasHeight === "number" && parsed.canvasHeight > 0) {
      state.canvas.height = parsed.canvasHeight;
    }
    state.selectedId = state.blocks[0]?.id || null;
    renderCanvas();
    saveState();
    showMessage("已成功匯入 JSON");
  }

  function onBackgroundInput(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (urlRevokeQueue.length >= 20) {
      const old = urlRevokeQueue.shift();
      if (old) URL.revokeObjectURL(old);
    }
    urlRevokeQueue.push(url);
    refs.bgLayer.style.backgroundImage = `url("${url}")`;
    showMessage("背景已更新");
  }

  function onBlockPointerDown(event, id, mode) {
    event.preventDefault();
    const selected = state.blocks.find(block => block.id === id);
    if (!selected) return;
    state.selectedId = id;
    const rect = refs.canvas.getBoundingClientRect();
    const start = {
      x: event.clientX,
      y: event.clientY,
      mode,
      id,
      startX: selected.x,
      startY: selected.y,
      startW: selected.w,
      startH: selected.h
    };
    state.dragState = start;
    renderCanvas();

    const node = refs.viewport.querySelector(`[data-id="${id}"]`);
    if (node) {
      node.setPointerCapture?.(event.pointerId);
    }
    updateInspectorValues();
    node?.ownerDocument?.addEventListener("pointermove", onDragMove);
    node?.ownerDocument?.addEventListener("pointerup", onDragEnd, { once: true });
  }

  function onDragMove(event) {
    if (!state.dragState) return;
    const selected = state.blocks.find(block => block.id === state.dragState.id);
    if (!selected) return;
    const rect = refs.canvas.getBoundingClientRect();
    const deltaX = ((event.clientX - state.dragState.x) / rect.width) * 100;
    const deltaY = ((event.clientY - state.dragState.y) / rect.height) * 100;

    if (state.dragState.mode === "resize") {
      selected.w = clamp(normalize(state.dragState.startW + deltaX), 1, 100 - selected.x);
      selected.h = clamp(normalize(state.dragState.startH + deltaY), 1, 100 - selected.y);
    } else {
      selected.x = clamp(normalize(state.dragState.startX + deltaX), 0, 100 - selected.w);
      selected.y = clamp(normalize(state.dragState.startY + deltaY), 0, 100 - selected.h);
    }

    const node = refs.viewport.querySelector(`[data-id="${selected.id}"]`);
    if (node) renderText(node, selected);
    updateInspectorValues();
    updateOutput();
  }

  function onDragEnd() {
    const node = refs.viewport.querySelector(`[data-id="${state.selectedId}"]`);
    node?.ownerDocument?.removeEventListener("pointermove", onDragMove);
    state.dragState = null;
    saveState();
  }

  function bindGlobalPointerHandlers() {
    refs.viewport.querySelectorAll(".tb-block").forEach(node => {
      node.addEventListener("pointerdown", () => setSelected(node.dataset.id));
    });
  }

  function showMessage(text) {
    refs.message.textContent = text;
    window.clearTimeout(showMessage.timer);
    showMessage.timer = window.setTimeout(() => {
      refs.message.textContent = "";
    }, 1800);
  }

  function init() {
    loadSaved();
    renderCanvas();

    refs.addButton.addEventListener("click", addBlock);
    refs.removeButton.addEventListener("click", removeSelected);
    refs.clearButton.addEventListener("click", clearBlocks);
    refs.copyButton.addEventListener("click", copyOutput);
    refs.downloadButton.addEventListener("click", downloadOutput);
    refs.importButton.addEventListener("click", importFromText);
    refs.bgInput.addEventListener("change", onBackgroundInput);

    [refs.fieldName, refs.fieldText, refs.fieldX, refs.fieldY, refs.fieldW, refs.fieldH].forEach(input => {
      input.addEventListener("input", onInspectorInput);
    });

    refs.canvas.addEventListener("pointerdown", event => {
      if (event.target !== refs.viewport && event.target !== refs.canvas && event.target !== refs.bgLayer) return;
      state.selectedId = null;
      updateInspectorValues();
      renderCanvas();
    });
    updateOutput();
  }

  init();
})();
