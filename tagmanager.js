import { Settings, mod } from "./settings.js";
import { TagItPackCache } from "./packcache.js";

export class TagItTagManager {
    static async getUsedTags() {
        let tags = [];
    
        const journaltags = game.journal.filter(a => a.data.flags?.tagit?.tags?.length > 0)
        .map(e => {
            return e.data.flags.tagit.tags;
        })
        .flat();
    
        const actortags = game.actors.filter(a => a.data.flags?.tagit?.tags?.length > 0)
        .map(e => {
            return e.data.flags.tagit.tags;
        })
        .flat();
    
        const itemtags = game.items.filter(a => a.data.flags?.tagit?.tags?.length > 0)
        .map(e => {
            return e.data.flags.tagit.tags;
        })
        .flat();
    
        const tokentags = canvas.tokens.objects?.children?.filter(a => a.data.actorData?.flags?.tagit?.tags?.length > 0)
        .map(e => {
            return e.data.actorData.flags.tagit.tags;
        })
        .flat();
    
        const packtags = TagItPackCache.index.flatMap(a => a.items)
        .map(a => a.flags.tagit.tags)
        .flat();
    
        return [...new Set([].concat(journaltags, actortags, itemtags, tokentags, packtags))].sort();
    }

    static async removeAll() {
        const promises = [];
        const packRefresh = TagItPackCache.refresh();

        for (const entity of game.journal.filter(a => a.data.flags?.tagit)) {
            promises.push(entity.unsetFlag(mod, 'tags'));
        }

        for (const entity of game.actors.filter(a => a.data.flags?.tagit)) {
            promises.push(entity.unsetFlag(mod, 'tags'));
        }

        for (const entity of game.items.filter(a => a.data.flags?.tagit)) {
            promises.push(entity.unsetFlag(mod, 'tags'));
        }

        await packRefresh;

        for (const pack of TagItPackCache.index) {
            for (const index of pack.items) {
                const entity = await game.packs.get(`${pack.pack}.${pack.name}`).getDocument(index._id);
                
                promises.push(entity.unsetFlag(mod, 'tags'));
            }
        }

        await Promise.all(promises);
    }
}