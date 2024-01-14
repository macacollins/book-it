import Dexie from 'dexie';
/*
|----------------------------|
| Declare your database      |
|----------------------------|
*/

const db = new Dexie('AppDatabase');

// Declare tables, IDs and indexes
db.version(1).stores({
    objectCache: '++id, key, value'
});

export async function getItemGZIP(key) {
    const result = await db.objectCache.where('key').equals(key).toArray();;

    if (result && result.length > 0) {
        if (result[0]) {
            // console.log("Got db result", result, result[0].value)
            return JSON.parse(result[0].value);
        }

        return []

    } else {
        return []
    }
}

export async function setItemGZIP(key, value) {

    let currentValue = await db.objectCache.where('key').equals(key).toArray();

    if (currentValue.length === 0) {
        let result = await db.objectCache.add({key, value: JSON.stringify(value)}).then(function (updated) {
            if (updated) {
                console.log("New record inserted for " + key);
            } else {
                console.log("Nothing was updated - there were no item with primary key: " + currentValue.id);
            }
        });;
    } else {

        let result = await db.objectCache.update(currentValue[0].id, {key, value: JSON.stringify(value)}).then(function (updated) {
            if (updated) {
                console.log("Key updated");
            } else {
                console.log("Nothing was updated - there were no item with primary key: " + currentValue.id);
            }
        });
    }
}
