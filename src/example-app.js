import { html, ref, comp, computed, renderRoot, repeat } from "@stevvvns/incomponent";
import accounts, { init } from "./stores/accounts.js";
import { toB64 } from './index.js';
import nacl from 'tweetnacl';
import getAvatar from 'https://cdn.jsdelivr.net/npm/@stevvvns/pixel-avatar';

init((data, all) => {
  if (data) {
    return data;
  }
  if (all.every(acct => acct.data.name !== 'unknown')) {
    return { name: 'unknown' };
  }
  for (let idx = 1; ; ++idx) {
    const name = `unknown ${idx}`;
    if (all.every(acct => acct.data.name !== name)) {
      return { name };
    }
  }
});

comp(function Account() {
  const id = ref('');
  function setName(evt) {
    accounts.updateData(id.value, { name: evt.target.value });
  }
  const avatar = computed(() => {
    return getAvatar(id.value, { size: 8 });
  });
  return {
    id,
    setName,
    avatar,
    active: accounts.active
  };
}).template(el => html`
  <button @click=${() => accounts.remove(el.id.value)}>remove</button>
  <button @click=${() => accounts.setActive(el.id.value)} ?disabled=${el.id === el.active.id}>activate</button>
  <input value=${el.data.name} @change=${el.setName} />
  <br />
  <small class=${el.id === el.active.id ? 'active' : ''}><code>${el.id}</code></small>
  <br />
  <img src=${el.avatar.imageUrl} />
`).style('.active { color: #090; font-weight: bold } img { margin-bottom: 2em }');

comp(function AccountList() {
  return accounts;
}).template(el => {
  const signed = el.active.sign(new TextEncoder().encode(`hello from ${el.active.data.name}`));
  const pubKey = signed.slice(0, nacl.sign.publicKeyLength);
  const payload = signed.slice(nacl.sign.publicKeyLength);
  const msg = new TextDecoder().decode(nacl.sign.open(payload, pubKey));
  return html`
  <ol>
    ${repeat(
      el.all ?? [],
      item => item.id,
      acct => html`<li><inc-account .id=${acct.id} .data=${acct.data} ?is-active=${acct.isActive}></inc-account></li>`
    )}
  </ol>
  <button @click=${() => accounts.add()}>add</button>
  <p>signed message with pubkey prefix: <code>${toB64(signed)}</code></p>
  <p>opened message: ${msg}</p>
`;
});

comp('ExampleApp').template(html`<inc-account-list></inc-account-list>`);

renderRoot(html`<inc-example-app></inc-example-app>`);
