import { ref, computed } from "@stevvvns/incomponent";
import { getAccounts, newAccount, save } from "../index.js";

const accounts = {};

export function init(validate = (data) => data ?? {}) {
  const all = ref(getAccounts(validate));
  save(all.value);

  function setActive(id) {
    all.mut((draft) => {
      for (const acct of draft) {
        acct.isActive = acct.id === id;
      }
    });
    save(all.value);
  }

  function add(data = null, isActive = true) {
    const acct = newAccount(data ?? validate(undefined, all.value), isActive);
    all.mut((draft) => {
      draft.push(acct);
    });
    if (isActive) {
      setActive(acct.id);
    } else {
      save(all.value);
    }
  }

  computed(() => {
    if (all.value.length === 0) {
      add(validate(undefined, []));
    }
  });

  function remove(id) {
    const accountIdx = all.value.findIndex(acct => acct.id === id);
    if (accountIdx > -1) {
      const wasActive = all.value[accountIdx].isActive;
      all.mut(draft => {
        draft.splice(accountIdx, 1);
        if (wasActive && draft.length > 0) {
          draft[0].isActive = true;
        }
        return draft;
      });
      save(all.value);
    }
  }

  const active = computed(() => {
    const account = all.value.find?.((acct) => acct.isActive);
    if (account) {
      return account;
    }
    setActive(all.value[0].id);
    return all.value[0];
  });

  function setData(id, data, isUpdate = false) {
    all.mut(draft => {
      const account = draft.find(acct => acct.id === id);
      if (account) {
        if (isUpdate) {
          account.data = { ...account.data, ...data };
        } else {
          account.data = data;
        }
      }
    });
    save(all.value);
  }

  function updateData(id, data) {
    setData(id, data, true);
  }

  accounts.setData = setData;
  accounts.updateData = updateData;
  accounts.all = all;
  accounts.active = active;
  accounts.setActive = setActive;
  accounts.add = add;
  accounts.remove = remove;
}

export default accounts;
