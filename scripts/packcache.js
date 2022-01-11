import { Settings, mod } from "./settings.js";

export class TagItPackCache {
    static index = null;

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
    }

    static async getFullIndex() {
        const promises = TagItPackCache._getPackIndexPromises();
        const indexes = await TagItPackCache._getPacks(promises);

        return indexes;
    }
}