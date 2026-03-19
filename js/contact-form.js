const form = document.getElementById("contactForm");
const confirmList = document.getElementById("confirmList");

const confirmBtn = document.getElementById("confirmBtn");
const backBtn = document.getElementById("backToEditBtn");
const sendBtn = document.getElementById("sendBtn");

const formError = document.getElementById("formError");

// ラベル表示用
const TYPE_LABEL = {
  logo: "ロゴ",
  kv: "キービジュアル",
  web: "Web",
  print: "紙もの",
  other: "その他",
};

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getValues() {
  const fd = new FormData(form);
  return {
    name: (fd.get("name") || "").toString().trim(),
    email: (fd.get("email") || "").toString().trim(),
    type: (fd.get("type") || "").toString(),
    budget: (fd.get("budget") || "").toString().trim(),
    deadline: (fd.get("deadline") || "").toString().trim(),
    message: (fd.get("message") || "").toString().trim(),
  };
}

// 必須：お名前/メール/種別/概要
function validate(v) {
  const errors = [];
  if (!v.name) errors.push("お名前を入力してください。");
  if (!v.email) errors.push("メールアドレスを入力してください。");
  if (v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) {
    errors.push("メールアドレスの形式が正しくありません。");
  }
  if (!v.type) errors.push("種別を選択してください。");
  if (!v.message) errors.push("概要を入力してください。");
  return errors;
}

function renderConfirm(v) {
  const rows = [
    ["お名前", v.name],
    ["メール", v.email],
    ["種別", TYPE_LABEL[v.type] || v.type],
    ["ご予算（目安）", v.budget || "—"],
    ["希望納期", v.deadline || "—"],
    ["概要", v.message || "—"],
  ];

  confirmList.innerHTML = rows
    .map(
      ([k, val]) =>
        `<div><dt>${escapeHtml(k)}</dt><dd>${escapeHtml(val)}</dd></div>`,
    )
    .join("");
}

function toConfirmMode() {
  document.body.classList.add("is-confirm");
}

function toEditMode() {
  document.body.classList.remove("is-confirm");
  showErrors([]); // 任意：戻ったら消す
}

confirmBtn.addEventListener("click", () => {
  const v = getValues();
  const errors = validate(v);

  if (errors.length) {
    showErrors(errors);
    return;
  }

  renderConfirm(v);
  toConfirmMode();
});

function showErrors(errors) {
  if (!formError) return;

  if (!errors.length) {
    formError.innerHTML = "";
    formError.classList.remove("is-show");
    return;
  }

  // 改行で表示
  formError.innerHTML = errors.map((err) => `<div>・${err}</div>`).join("");

  formError.classList.add("is-show");
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
});

backBtn.addEventListener("click", () => {
  toEditMode();
});

const donePanel = document.getElementById("donePanel");
const backToSiteBtn = document.getElementById("backToSiteBtn");

function toDoneMode() {
  document.body.classList.remove("is-confirm");
  document.body.classList.add("is-done");
}

sendBtn.addEventListener("click", async () => {
  // 念のためもう一回バリデーション（確認後に編集されてる可能性を潰す）
  const v = getValues();
  const errors = validate(v);
  if (errors.length) {
    // 確認画面にいるので、とりあえず編集に戻してエラー出す
    toEditMode();
    showErrors(errors);
    return;
  }

  sendBtn.disabled = true;
  sendBtn.textContent = "送信中…";

  try {
    const res = await fetch(form.action, {
      method: "POST",
      headers: { Accept: "application/json" },
      body: new FormData(form),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      const msg = data?.errors?.map((e) => e.message) ?? [
        "送信に失敗しました。もう一度お試しください。",
      ];
      toEditMode();
      showErrors(msg);
      return;
    }

    // ✅ 完了表示
    toDoneMode();
  } catch (e) {
    toEditMode();
    showErrors(["通信に失敗しました。ネットワークをご確認ください。"]);
  } finally {
    sendBtn.disabled = false;
    sendBtn.textContent = "送信";
  }
});

backToSiteBtn?.addEventListener("click", () => {
  // iframeなら親に「戻る」通知するのが自然
  window.parent?.postMessage({ type: "CONTACT_CLOSE" }, "*");
});
