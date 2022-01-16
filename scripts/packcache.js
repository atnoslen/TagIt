import { Settings, mod } from "./settings.js";

export class TagItPackCache {
    static index = null;
    static _index = null;

    static _getPackIndexPromises() {
        const packIndexes = [];
    
        for (const pack of game.packs.filter(a => a.metadata.entity === "Actor" || a.metadata.entity === "JournalEntry" || a.metadata.entity === "Item" || a.metadata.entity === "Scene")) {
            packIndexes.push({pack: pack.metadata.package, name: pack.metadata.name, type: pack.documentName, index: pack.getIndex({fields: ["flags","img","thumb"]})});
        }
    
        return packIndexes;
    }

    

    static async _getPacksWithTagsIndex(indexes) {
        const packs = [];
    
        await Promise.all(indexes.flatMap(a => a.index));
    
        for (const pack of indexes) {
            const index = await pack.index;
    
            var packsWithTags = index.filter(b => b.flags?.tagit?.tags?.length > 0);
        
            if (packsWithTags.length > 0) {
                packs.push({pack: pack.pack, name: pack.name, type: pack.type, items: packsWithTags});
            }
        }
    
        return packs;
    }

    static async _getPacksWithTagsIndex2(indexes) {
        const packs = {};
    
        await Promise.all(indexes.flatMap(a => a.index));
    
        for (const pack of indexes) {
            const index = await pack.index;
    
            var packsWithTags = index.filter(b => b.flags?.tagit?.tags?.length > 0);
        
            if (packsWithTags.length > 0) {
                packs[`${pack.pack}.${pack.name}`] = {pack: pack.pack, name: pack.name, type: pack.type, items: packsWithTags};
            }
        }
    
        return packs;
    }

    static async _getPacks(indexes) {
        const packs = [];
    
        await Promise.all(indexes.flatMap(a => a.index));
    
        for (const pack of indexes) {
            const index = await pack.index;
    
            packs.push({pack: pack.pack, name: pack.name, type: pack.type, items: index});
        }
    
        return packs;
    }

    static async refresh() {
        const promises = TagItPackCache._getPackIndexPromises();

        TagItPackCache.index = await TagItPackCache._getPacksWithTagsIndex(promises);

        return TagItPackCache.index;
    }

    static async getFullIndex() {
        const promises = TagItPackCache._getPackIndexPromises();
        const indexes = await TagItPackCache._getPacks(promises);

        return indexes;
    }

    static get Index() {
        return Object.values(TagItPackCache._index);
    }

    static async init() {
        const promises = TagItPackCache._getPackIndexPromises();

        TagItPackCache._index = await TagItPackCache._getPacksWithTagsIndex2(promises);
    }

    static async updateCompendiumCache(compendium) {
        const index = await compendium.getIndex({fields: ["flags","img","thumb"]});

        TagItPackCache._index[`${compendium.metadata.package}.${compendium.metadata.name}`] = {
            pack: compendium.metadata.package,
            name: compendium.metadata.name,
            type: compendium.documentName,
            items: index.filter(a => a.flags?.tagit?.tags?.length > 0)
        }
        console.log(`TagIt: Refreshed index for compendium ${compendium.metadata.package}.${compendium.metadata.name}`)
    }
}

Hooks.on('updateCompendium', (app, html, data) => {
    if (html.filter(a => a.data.flags?.tagit?.tags).length > 0) {
        TagItPackCache.updateCompendiumCache(app);
    }
});

Hooks.once('ready', async () => {
    TagItPackCache.init();
});