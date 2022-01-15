import { Settings, mod } from "./settings.js";
import { TagItPackCache } from "./packcache.js";

export class TagItTagManager {
    static async getUsedTags() {
        let tags = [];
    
        const journaltags = game.journal.filter(a => a.data.flags?.tagit?.tags?.length > 0)
        .map(a => {
            return a.data.flags.tagit.tags;
        })
        .flat()
        .map(a => a.tag);

        const scenetags = game.scenes.filter(a => a.data.flags?.tagit?.tags?.length > 0)
        .map(a => {
            return a.data.flags.tagit.tags;
        })
        .flat()
        .map(a => a.tag);
    
        const actortags = game.actors.filter(a => a.data.flags?.tagit?.tags?.length > 0)
        .map(a => {
            return a.data.flags.tagit.tags;
        })
        .flat()
        .map(a => a.tag);
    
        const itemtags = game.items.filter(a => a.data.flags?.tagit?.tags?.length > 0)
        .map(a => {
            return a.data.flags.tagit.tags;
        })
        .flat()
        .map(a => a.tag);
    
        const tokentags = canvas.tokens.getDocuments().filter(a => a.data.flags?.tagit?.tags?.length > 0)
        .map(a => {
            return a.data.flags.tagit.tags;
        })
        .flat()
        .map(a => a.tag);
    
        const packtags = TagItPackCache.Index.flatMap(a => a.items)
        .map(a => a.flags.tagit.tags)
        .flat()
        .map(a => a.tag);
    
        return [...new Set([].concat(journaltags, scenetags, actortags, itemtags, tokentags, packtags))].sort();
    }

    static async getUsedTags2() {
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
    
        // const tokentags = canvas.tokens.getDocuments().filter(a => a.data.flags?.tagit?.tags?.length > 0)
        // .map(a => {
        //     return a.data.flags.tagit.tags
        //     .filter(b => {
        //         if (tags.has(b.tag)) {return false;}
        //         tags.add(b.tag);
        //         return true;
        //     });
        // })
        // .flat();

        const tokentags = game.scenes.filter(a => a.tokens.some(b => b.data.flags?.tagit?.tags?.length))
        .flatMap(a => a.tokens)
        .map(a => a.flags.tagit.tags
            .filter(b => {
                if (tags.has(b.tag)) {return false;}
                tags.add(b.tag);
                return true;
            }))
        .flat();
    
        const packtags = TagItPackCache.Index.flatMap(a => a.items)
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

        for (const entity of game.journal.filter(a => a.data.flags?.tagit)) {
            promises.push(entity.unsetFlag(mod, 'tags'));
        }

        for (const entity of game.scenes.filter(a => a.data.flags?.tagit)) {
            promises.push(entity.unsetFlag(mod, 'tags'));
        }

        for (const entity of game.actors.filter(a => a.data.flags?.tagit)) {
            promises.push(entity.unsetFlag(mod, 'tags'));
        }

        for (const entity of game.items.filter(a => a.data.flags?.tagit)) {
            promises.push(entity.unsetFlag(mod, 'tags'));
        }

        for (const pack of TagItPackCache.Index) {
            for (const index of pack.items) {
                const entity = await game.packs.get(`${pack.pack}.${pack.name}`).getDocument(index._id);
                
                promises.push(entity.unsetFlag(mod, 'tags'));
            }
        }

        for (const scene of game.scenes.filter(a => a.tokens.size > 0)) {
            for (const document of scene.tokens.filter(a => a.data.flags?.tagit?.tags?.length > 0)) {
                promises.push(document.unsetFlag(mod, 'tags'));
            }
        }

        await Promise.all(promises);
        await TagItPackCache.init();
    }
}