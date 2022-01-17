import { Settings, mod } from "./settings.js";
import { TagItPackCache } from "./packcache.js";

export class TagItTagManager {
    static async getUsedTags() {
        let tags = new Set();
    
        const journaltags = game.journal.filter(a => a.data.flags?.tagit?.tags?.length > 0)
        .map(a => {
            return a.data.flags.tagit.tags
            .filter(b => {
                if (tags.has(b.tag)) {return false;}
                tags.add(b.tag);
                return true;
            });
        })
        .flat();

        const scenetags = game.scenes.filter(a => a.data.flags?.tagit?.tags?.length > 0)
        .map(a => {
            return a.data.flags.tagit.tags
            .filter(b => {
                if (tags.has(b.tag)) {return false;}
                tags.add(b.tag);
                return true;
            });
        })
        .flat();
    
        const actortags = game.actors.filter(a => a.data.flags?.tagit?.tags?.length > 0)
        .map(a => {
            return a.data.flags.tagit.tags
            .filter(b => {
                if (tags.has(b.tag)) {return false;}
                tags.add(b.tag);
                return true;
            });
        })
        .flat();
    
        const itemtags = game.items.filter(a => a.data.flags?.tagit?.tags?.length > 0)
        .map(a => {
            return a.data.flags.tagit.tags
            .filter(b => {
                if (tags.has(b.tag)) {return false;}
                tags.add(b.tag);
                return true;
            });
        })
        .flat();

        const tokentags = game.scenes.filter(a => a.tokens.some(b => (!b.isLinked) && b.data.flags?.tagit?.tags?.length > 0))
        .flatMap(a => a.tokens.contents)
        .filter(a => !a.isLinked)
        .map(a => a.data.flags.tagit.tags
            .filter(b => {
                if (tags.has(b.tag)) {return false;}
                tags.add(b.tag);
                return true;
            }))
        .flat();
    
        const packtags = TagItPackCache.TagIndex.flatMap(a => a.items)
        .map(a => a.flags.tagit.tags
            .filter(b => {
                if (tags.has(b.tag)) {return false;}
                tags.add(b.tag);
                return true;
            }))
        .flat();
    
        return [...new Set([].concat(journaltags, scenetags, actortags, itemtags, tokentags, packtags))]
        .sort((a,b) => a.tag.localeCompare(b.tag));
    }

    static async removeAll() {
        const promises = [];

        for (const document of game.journal.filter(a => a.data.flags?.tagit?.tags?.length > 0)) {
            promises.push(document.unsetFlag(mod, 'tags'));
        }

        for (const document of game.scenes.filter(a => a.data.flags?.tagit?.tags?.length > 0)) {
            promises.push(document.unsetFlag(mod, 'tags'));
        }

        for (const document of game.actors.filter(a => a.data.flags?.tagit?.tags?.length > 0)) {
            promises.push(document.unsetFlag(mod, 'tags'));
        }

        for (const document of game.items.filter(a => a.data.flags?.tagit?.tags?.length > 0)) {
            promises.push(document.unsetFlag(mod, 'tags'));
        }

        for (const pack of TagItPackCache.TagIndex) {
            for (const index of pack.items) {
                const document = await game.packs.get(`${pack.pack}.${pack.name}`).getDocument(index._id);
                
                promises.push(document.unsetFlag(mod, 'tags'));
            }
        }

        for (const scene of game.scenes.filter(a => a.tokens.some(b => (!b.isLinked) && b.data.flags?.tagit?.tags?.length > 0))) {
            for (const document of scene.tokens.filter(a => (!a.isLinked) && a.data.flags?.tagit?.tags?.length > 0)) {
                promises.push(document.unsetFlag(mod, 'tags'));
            }
        }

        await Promise.all(promises);
        await TagItPackCache.init();

        ui.notifications.info(`Removed tags from ${promises.length} documents.`);
    }
}