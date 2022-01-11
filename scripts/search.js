import { Settings, mod } from "./settings.js";
import { TagItPackCache } from "./packcache.js";
import { TagItTagManager } from "./tagmanager.js";
import { TagItInputManager } from "./inputmanager.js";
import { TagItInput } from "./input.js";

export class TagItSearch extends FormApplication {

    tagcache = null;
    
    constructor(object, options) {
        super(object, options);
    }

    static get defaultOptions() {
        const options = super.defaultOptions;
        options.template = `modules/${mod}/templates/search.html`;
        options.width = '525';
        options.height = '500';
        options.title = game.i18n.localize('TagIt.Search.title');
        options.resizable = true;
        options.editable = true;

        return options;
    }

    async getData() {
        const _this = this;
        const data = super.getData();

        await TagItPackCache.refresh();
        _this.tagcache = await TagItTagManager.getUsedTags();

        data.tagcache = _this.tagcache;
        data.appId = this.appId;

        return data;
    }

    activateListeners(html) {
        const _this = this;
        super.activateListeners(html);

        TagItInput.calculateAutocompleteList(_this);

        const options = {
            onUpdate: () => {
                _this._renderResults();
            }
        }

        TagItInput.registerListeners(_this, options);

        $('.entity-filter', html).change(function() {
            _this._renderResults();
        });

        // Add refresh button
        $('div.tagit.tag.input', html).append(
            $('<button type="button">')
            .addClass(['tagit', 'search', 'refresh'])
            .css('flex-basis', 'content')
            .append(
                $('<i>')
                .addClass(['fas', 'fa-redo', 'center'])
            )
            .on("click", async function() {
                await TagItPackCache.refresh();
                _this.tagcache = await TagItTagManager.getUsedTags();

                _this._renderResults();
            })
        );

        $(`#taginput${_this.appId}`, html).focus();
    }
    
    async _updateObject(event, formData) {
        return;
    }

    _renderResults() {
        const _this = this;

        const collection = $('div.tagit.input div.tag.collection', _this.element);
        const items = $('span.tag', collection).map(function() {
            return $(this).text();
        }).get();

        $('.search.directory-list', _this.element).empty();

        if (items.length === 0) {
            // No need to render any objects.
            return;
        }

        var entities = [];
        $('.tagit.entity-filter input:checked', _this.element).each(function(){
            entities.push($(this).attr('name'));
        });

        const results = TagItSearch.getResults(items, entities);

        results.forEach(a => {
            let item = $('<li>')
            .attr('data-document-id', a.id)
            .attr('data-type', a.entity)
            .addClass('directory-item')
            .addClass('flexrow')
            .css({"display":"flex"});

            if (a.img) {
                $(item).append(
                    $('<img>')
                    .addClass('profile')
                    .attr('src', a.img)
                    .attr('title', a.name)
                );
            }

            $(item).append(
                $('<div>')
                .addClass('entry-name')
                .append(
                    $('<h4>')
                    .append(
                        $('<a>').text(a.name)
                    )
                )
            );

            switch(a.entity) {
                case "JournalEntry":
                    $(item).addClass('journalentry');

                    $('a', item).on("click", function () {
                        game.journal.get($(this).parent().parent().parent().attr("data-document-id")).sheet.render(true);
                    });

                    $('div.entry-name', item)
                    .append(
                        $('<div>')
                        .addClass('tag')
                        .addClass('collection')
                        .append(
                            $('<span>')
                            .addClass('tagit')
                            .addClass('tag')
                            .addClass('entity-type')
                            .text('JournalEntry')
                        )
                    );

                    break;
                case "Scene":
                        $(item).addClass('scene');
    
                        $('a', item).on("click", function () {
                            game.scenes.get($(this).parent().parent().parent().attr("data-document-id")).sheet.render(true);
                        });
    
                        $('div.entry-name', item)
                        .append(
                            $('<div>')
                            .addClass('tag')
                            .addClass('collection')
                            .append(
                                $('<span>')
                                .addClass('tagit')
                                .addClass('tag')
                                .addClass('entity-type')
                                .text('Scene')
                            )
                        );
    
                        break;
                case "Actor":
                    $(item).addClass('actor');

                    $('a', item).on("click", function () {
                        game.actors.get($(this).parent().parent().parent().attr("data-document-id")).sheet.render(true);
                    });

                    $('div.entry-name', item)
                    .append(
                        $('<div>')
                        .addClass('tag')
                        .addClass('collection')
                        .append(
                            $('<span>')
                            .addClass('tagit')
                            .addClass('tag')
                            .addClass('entity-type')
                            .text('Actor')
                        )
                    );

                    break;
                case "Item":
                    $(item).addClass('item');

                    $('a', item).on("click", function () {
                        game.items.get($(this).parent().parent().parent().attr("data-document-id")).sheet.render(true);
                    });

                    $('div.entry-name', item)
                    .append(
                        $('<div>')
                        .addClass('tag')
                        .addClass('collection')
                        .append(
                            $('<span>')
                            .addClass('tagit')
                            .addClass('tag')
                            .addClass('entity-type')
                            .text('Item')
                        )
                    );

                    break;
                case "Token":
                    $(item).addClass('token');

                    $('a', item).on("click", function () {
                        canvas.tokens.objects?.children?.find(a => a.id === $(this).parent().parent().parent().attr("data-document-id")).actor.sheet.render(true);
                    });

                    $('div.entry-name', item)
                    .append(
                        $('<div>')
                        .addClass('tag')
                        .addClass('collection')
                        .append(
                            $('<span>')
                            .addClass('tagit')
                            .addClass('tag')
                            .addClass('entity-type')
                            .text('Token')
                        )
                    );

                    break;
                case "Pack":
                    $(item).addClass('pack')
                    .attr('data-pack', a.pack);

                    $('a', item).on("click", function () {
                        game.packs.get($(this).parent().parent().parent().attr("data-pack")).getDocument($(this).parent().parent().parent().attr("data-document-id")).then(a => a.sheet.render(true));
                    });

                    $('div.entry-name', item)
                    .append(
                        $('<div>')
                        .addClass('tag')
                        .addClass('collection')
                        .append(
                            $('<span>')
                            .addClass('tagit')
                            .addClass('tag')
                            .addClass('entity-type')
                            .text(a.type)
                        )
                    )

                    $(item).append(
                        $('<div>')
                        .addClass('entity-info')
                        .append(
                            $('<p>')
                            .text(`(${a.pack})`)
                        )
                    );

                    break;
            }

            const collectionElement = $('div.tag.collection', item);

            for (const tag of a.tags) {
                $(collectionElement)
                .append(
                    $('<span>')
                    .addClass('tagit')
                    .addClass('tag')
                    .text(tag)
                );
            }

            $('.search.directory-list', _this.element).append(item);
        });
    }

    static getResults(tags, entities = []) {
        
        let result = [];

        if (entities.includes('JournalEntry')) {
            result = result.concat(
                game.journal.filter(a => tags.every(b => a.data.flags?.tagit?.tags?.includes(b)))
                .map(a => { return {entity: "JournalEntry", id: a.id, name: a.name, img: a.data.img, tags: a.data.flags.tagit.tags}})
            );
        }

        if (entities.includes('Scene')) {
            result = result.concat(
                game.scenes.filter(a => tags.every(b => a.data.flags?.tagit?.tags?.includes(b)))
                .map(a => { return {entity: "Scene", id: a.id, name: a.name, img: a.data.thumb, tags: a.data.flags.tagit.tags}})
            );
        }

        if (entities.includes('Actor')) {
            result = result.concat(
                game.actors.filter(a => tags.every(b => a.data.flags?.tagit?.tags?.includes(b)))
                .map(a => { return {entity: "Actor", id: a.id, name: a.name, img: a.data.img, tags: a.data.flags.tagit.tags}})
            );
        }
        
        if (entities.includes('Item')) {
            result = result.concat(
                game.items.filter(a => tags.every(b => a.data.flags?.tagit?.tags?.includes(b)))
                .map(a => { return {entity: "Item", id: a.id, name: a.name, img: a.data.img, tags: a.data.flags.tagit.tags}})
            );
        }

        if (entities.includes('Token')) {
            const tokenResults = canvas.tokens.getDocuments().filter(a => (a.isLinked === false) && (tags.every(b => a.data.flags?.tagit?.tags?.includes(b) || tags.every(b => a.actor?.data?.flags?.tagit?.tags?.includes(b)))));

            result = result.concat(
                canvas.tokens.getDocuments().filter(a => tags.some(b => a.data.flags?.tagit?.tags?.includes(b) || tags.some(b => a.actor?.data?.flags?.tagit?.tags?.includes(b))))
                .map(a => {
                    return {
                        entity: "Token",
                        id: a.id,
                        name: a.name,
                        img: a.data.img,
                        tags: [...new Set([].concat(a.data.flags?.tagit?.tags, a.actor?.data?.flags?.tagit?.tags))]
                              .filter(item => item !== undefined)
                              .sort()
                    };
                })
                .filter(a => tags.every(b => a.tags.includes(b)))
            )
        }

        if (entities.includes('Pack')) {

            let packtags = [];
            for (const pack of TagItPackCache.index) {
                packtags.push( pack.items.filter(a => entities.includes(pack.type) && tags.every(b => a.flags.tagit.tags.includes(b)))
                .map(a => { return { entity: "Pack", type: pack.type, id: a._id, name: a.name, img: ((pack.type === "Scene") ? a.thumb : a.img), tags: a.flags.tagit.tags, pack: pack.pack + '.' + pack.name }}));
            }

            packtags = packtags.flat();

            result = result.concat(packtags.flat());
        }

        result.sort((a,b) => {
            if (a.name < b.name) {
                return -1;
            }
            if (a.name > b.name) {
                return 1;
            }
            return 0;
         });

        return result;
    }

    static async search(items, options) {
        const promise = new Promise(async function(resolve, reject) {
            try {
                const defaultOptions = {
                    filter: {
                        entity: ['JournalEntry', 'Scene', 'Actor', 'Item', 'Token', 'Pack']
                    },
                    type: 'all',
                    limit: 50
                };
        
                options = mergeObject(defaultOptions, options);

                if (!(['all','any'].includes(options.type))) {
                    throw 'Invalid type.';
                }

                if (typeof options.limit !== 'number' || options.limit < 0) {
                    throw 'Invalid limit'
                }

                const names = [];
                const tags = [];
                const tagWithNumbers = [];

                for (const item of items) {
                    if (item.startsWith('name:')) {
                        // name item
                        names.push(item.substring(5).toLowerCase());
                    } else {
                        // tag item
                        tags.push(item);
                    }
                }

                let result = [];

                if (options.filter.entity.includes('JournalEntry')) {
                    result = result.concat(
                        game.journal.filter(a =>
                            ((options.type === 'all') && tags.every(b => a.data.flags?.tagit?.tags?.includes(b)) && names.every(b => a.name.toLowerCase().includes(b))) ||
                            ((options.type === 'any') && (tags.some(b => a.data.flags?.tagit?.tags?.includes(b)) || names.some(b => a.name.toLowerCase().includes(b))))
                        )
                    );
                }

                if (options.filter.entity.includes('Scene')) {
                    result = result.concat(
                        game.scenes.filter(a => 
                            ((options.type === 'all') && tags.every(b => a.data.flags?.tagit?.tags?.includes(b)) && names.every(b => a.name.toLowerCase().includes(b))) ||
                            ((options.type === 'any') && (tags.some(b => a.data.flags?.tagit?.tags?.includes(b)) || names.some(b => a.name.toLowerCase().includes(b))))
                        )
                    );
                }

                if (options.filter.entity.includes('Actor')) {
                    result = result.concat(
                        game.actors.filter(a => 
                            ((options.type === 'all') && tags.every(b => a.data.flags?.tagit?.tags?.includes(b)) && names.every(b => a.name.toLowerCase().includes(b))) ||
                            ((options.type === 'any') && (tags.some(b => a.data.flags?.tagit?.tags?.includes(b)) || names.some(b => a.name.toLowerCase().includes(b))))
                        )
                    );
                }
                
                if (options.filter.entity.includes('Item')) {
                    result = result.concat(
                        game.items.filter(a => 
                            ((options.type === 'all') && tags.every(b => a.data.flags?.tagit?.tags?.includes(b)) && names.every(b => a.name.toLowerCase().includes(b))) ||
                            ((options.type === 'any') && (tags.some(b => a.data.flags?.tagit?.tags?.includes(b)) || names.some(b => a.name.toLowerCase().includes(b))))
                        )
                    );
                }

                if (options.filter.entity.includes('Token')) {
                    result = result.concat(
                        canvas.tokens.getDocuments().filter(a => 
                            tags.some(b => a.data.flags?.tagit?.tags?.includes(b) || a.actor?.data?.flags?.tagit?.tags?.includes(b)) ||
                            names.some(b => a.name.toLowerCase().includes(b))
                        )
                        .map(a => {
                            return {
                                entity: a,
                                tags: [...new Set([].concat(a.data.flags?.tagit?.tags, a.actor?.data?.flags?.tagit?.tags))]
                                    .filter(item => item !== undefined)
                                    .sort()
                            };
                        })
                        .filter(a => 
                            ((options.type === 'all') && (tags.every(b => a.tags.includes(b)) && names.every(b => a.entity.name.toLowerCase().includes(b)))) || 
                            ((options.type === 'any') && (tags.some(b => a.tags.includes(b)) || names.some(b => a.entity.name.toLowerCase().includes(b))))
                        )
                        .map(a => a.entity)
                    )
                }

                if (options.filter.entity.includes('Pack')) {

                    const index = await TagItPackCache.getFullIndex();

                    let packtags = [];
                    //for (const pack of TagItPackCache.index) {
                    for (const pack of index) {
                        packtags.push({
                            pack: `${pack.pack}.${pack.name}`,
                            id: pack.items.filter(a => options.filter.entity.includes(pack.type) &&
                                    ((options.type === 'all') && (tags.every(b => a.flags?.tagit?.tags?.includes(b)) && names.every(b => a.name.toLowerCase().includes(b)))) ||
                                    ((options.type === 'any') && (tags.some(b => a.flags?.tagit?.tags?.includes(b)) || names.some(b => a.name.toLowerCase().includes(b))))
                                )
                                .map(a => a._id)
                        });
                    }

                    let packentities = [];

                    for (const index of packtags) {
                        packentities.push(game.packs.get(index.pack).getDocuments({_id: { $in: index.id }}))
                    }

                    packentities = (await Promise.all(packentities)).flat();

                    result = result.concat(packentities);
                }

                if (options.limit > 0) {
                    result.splice(0, result.length - options.limit);
                }

                resolve(result);
            } catch (e) {
                reject(e);
            }
        });
        

       return promise;
    }
}

let form = null;

Hooks.once("init", function() {
    const partials = [
        `modules/${mod}/templates/input-partial.html`
    ]

    console.log(loadTemplates(partials));
});

Hooks.once('ready', async () => {
    window.addEventListener('keypress', (e) => {
        if (e.shiftKey && e.ctrlKey && e.code === 'KeyF') {
            if (form === null) {
                form = new TagItSearch();
            }

            if (!(form.rendered)) {
                form.render(true);
            }
        }
    });
});