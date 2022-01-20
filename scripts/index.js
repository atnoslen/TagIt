

export class TagItIndex {
    static _index = new Array();
    
    static get DocumentTypes() {
        return [
            "JournalEntry",
            "Actor",
            "Item",
            "Scene"
        ];
    }

    static async init() {
        const promise = new Promise(async function(resolve, reject) {
            const t0 = performance.now();

            TagItIndex._index = new Array();
            const index = TagItIndex._index;

            const compendiums = game.packs
            .filter(compendium => TagItIndex.DocumentTypes.includes(compendium.documentName))
            .map(compendium => {
                return {
                    package: compendium.metadata.package,
                    name: compendium.metadata.name,
                    documentName: compendium.documentName,
                    index: compendium.getIndex({fields: ["flags","img","thumb"]})
                }
            });

            index.push(
                ...game.journal.map(document => {
                    return {
                        id: document.id,
                        name: document.name,
                        type: document.documentName,
                        tags: (document.data.flags?.tagit?.tags?.length > 0) ?
                            document.data.flags.tagit.tags :
                            [],
                        document: document,
                        img: document.img
                    };
                })
            );

            index.push(
                ...game.scenes.map(document => {
                    return {
                        id: document.id,
                        name: document.name,
                        type: document.documentName,
                        tags: (document.data.flags?.tagit?.tags?.length > 0) ?
                            document.data.flags.tagit.tags :
                            [],
                        document: document,
                        img: document.data.thumb
                    };
                })
            );

            index.push(
                ...game.actors.map(document => {
                    return {
                        id: document.id,
                        name: document.name,
                        type: document.documentName,
                        tags: (document.data.flags?.tagit?.tags?.length > 0) ?
                            document.data.flags.tagit.tags :
                            [],
                        document: document,
                        img: document.img
                    };
                })
            );

            index.push(
                ...game.items.map(document => {
                    return {
                        id: document.id,
                        name: document.name,
                        type: document.documentName,
                        tags: (document.data.flags?.tagit?.tags?.length > 0) ?
                            document.data.flags.tagit.tags :
                            [],
                        document: document,
                        img: document.img
                    };
                })
            );

            await Promise.all(compendiums.flatMap(a => a.index));

            for (const compendium of compendiums) {
                const compendiumIndex = await compendium.index;

                index.push(
                    ...compendiumIndex.contents.map(document => {
                        return {
                            id: document._id,
                            name: document.name,
                            type: compendium.documentName,
                            tags: (document.flags?.tagit?.tags?.length > 0) ?
                                document.flags.tagit.tags :
                                [],
                            get document() {
                                return (async () => {
                                    return await game.packs.get(`${compendium.package}.${compendium.name}`).getDocument(document._id);
                                })();
                            },
                            img: (compendium.documentName === "Scene") ? document.thumb : document.img,
                            compendium: `${compendium.package}.${compendium.name}`
                        }
                    })
                );
            }

            const t1 = performance.now();

            console.log(`Cache build took ${t1 - t0} milliseconds for ${TagItIndex._index.length} documents.`);

            resolve();
        });

        return promise;
    }
}