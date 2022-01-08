import { TagItPackCache } from "./packcache.js";

export class TagItTagManager {
    static async getUsedTags() {
        let tags = [];
    
        const journaltags = game.journal.filter(a => a.data.flags?.tagit?.tags?.length > 0)
        .map(e => {
            return e.data.flags["tagit"]["tags"];
        })
        .flat();
    
        const actortags = game.actors.filter(a => a.data.flags?.tagit?.tags?.length > 0)
        .map(e => {
            return e.data.flags["tagit"]["tags"];
        })
        .flat();
    
        const itemtags = game.items.filter(a => a.data.flags?.tagit?.tags?.length > 0)
        .map(e => {
            return e.data.flags["tagit"]["tags"];
        })
        .flat();
    
        const tokentags = canvas.tokens.objects?.children?.filter(a => a.data.actorData?.flags?.tagit?.tags?.length > 0)
        .map(e => {
            return e.data.actorData.flags["tagit"]["tags"];
        })
        .flat();
    
        const packtags = TagItPackCache.index.flatMap(a => a.items)
        .map(a => a.flags.tagit.tags)
        .flat();
    
        return [...new Set([].concat(journaltags, actortags, itemtags, tokentags, packtags))];
    }
}