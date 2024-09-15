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

let storageGames = [];

export let customTimestamp;

export const memory = {
    customTimestamp: 100
};

export async function getLatestLichessTimestamp() {
    console.log("WOW", memory)
    return typeof memory.customTimestamp === "undefined" ? Date.now() : memory.customTimestamp;
}

export async function setLatestLichessTimestamp(newTimestamp) {
    console.log("setting timestamp to", newTimestamp)

    memory.customTimestamp = newTimestamp;
}

export async function clearLatestLichessTimestamp() {
    memory.customTimestamp = undefined;
}

export async function clearAllGames() {
    storageGames = [];
}

export async function addGamesBulk(games) {
    storageGames = storageGames.concat(games);
}

export async function getAllGames() {
    return storageGames;
}