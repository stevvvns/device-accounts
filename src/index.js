import nacl from "tweetnacl";

export function toB64(u8) {
  const bytes = u8 instanceof ArrayBuffer ? new Uint8Array(u8) : u8;
  return btoa(
    bytes.reduce((data, byte) => data + String.fromCharCode(byte), ""),
  );
}

export function toU8(b64) {
  return new Uint8Array(
    atob(b64)
      .split("")
      .map((ch) => ch.charCodeAt(0)),
  );
}

function getSign(keys) {
  return function sign(bytes) {
    const signed = nacl.sign(bytes, keys.secretKey);
    const rv = new Uint8Array(signed.length + nacl.sign.publicKeyLength);
    rv.set(keys.publicKey, 0);
    rv.set(signed, nacl.sign.publicKeyLength);
    return rv;
  };
}

function hydrate(accounts, validate) {
  return accounts.map(([secret, isActive, data]) => {
    const keys = nacl.sign.keyPair.fromSecretKey(toU8(secret));
    const account = {
      id: toB64(keys.publicKey),
      keys,
      isActive,
      data: validate(data, []),
      sign: getSign(keys),
    };
    return account;
  });
}

function dehydrate(accounts) {
  return accounts.map(({ keys, isActive, data }) => [
    toB64(keys.secretKey),
    isActive,
    data,
  ]);
}

export function newAccount(data, isActive = true) {
  const keys = nacl.sign.keyPair();
  return {
    id: toB64(keys.publicKey),
    keys,
    isActive,
    data,
    sign: getSign(keys),
  };
}

export const localStorageBackend = {
  load(validate) {
    return localStorage.getItem("accounts");
  },
  save(accounts) {
    localStorage.setItem("accounts", accounts);
  },
};

function bindBackend(backend, validate) {
  return {
    save(accounts) {
      backend.save(JSON.stringify(dehydrate(accounts)));
    },
    load(accounts) {
      try {
        return hydrate(JSON.parse(backend.load()), validate);
      } catch (ex) {
        console.warn(ex);
        return [];
      }
    },
  };
}

export function getAccounts(
  validate = (data) => data ?? {},
  backend = localStorageBackend,
) {
  const { load, save } = bindBackend(backend, validate);
  const accounts = load(validate);
  if (accounts.length === 0) {
    accounts.push(newAccount(validate(undefined, [])));
  }
  return [accounts, save];
}
