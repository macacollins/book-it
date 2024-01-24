export const keysCalledGet = [];
export const keysCalledSet = [];
export async function setItemDexie(key, value) {
    // console.log("setItemDexie mock called");
    keysCalledSet.push(key);

    return Promise.resolve();
}

export async function getItemDexie(key) {
    // console.log("getItemDexie thing called");

    keysCalledGet.push(key);

    return Promise.resolve([]);
}

export function resetKeys() {
    keysCalledGet.length = 0;
    keysCalledSet.length = 0;
}
