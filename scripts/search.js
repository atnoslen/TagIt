import { Settings, mod } from "./settings.js";
import { TagItPackCache } from "./packcache.js";
import { TagItTagManager } from "./tagmanager.js";
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

    static getSearchTerms(terms) {
        const rTag = /^(tag:)?((?<unquoted>\w([\w ']+\w)?)|((?<quote>["'])(?<quoted>[^\:]*?(?<!\\))\k<quote>))$/;
        const rName = /^name:((?<unquoted>\w([\w ']+\w)?)|((?<quote>["'])(?<quoted>.*?(?<!\\))\k<quote>))$/;
        const rNum = /^((?<unquoted>\w([\w']*\w)?):|((?<quote>["'])(?<quoted>.*?(?<!\\))\k<quote>):)(?<value>[\d]+)$/;
        
        const tags = [];
        const names = [];
        const nums = [];

        let matched = false;
        let match = null;

        for (const term of terms) {
            matched = false;

            match = term.match(rTag);
            if (match) {
                if (match.groups.unquoted) {
                    tags.push(match.groups.unquoted);
                } else if (match.groups.quoted) {
                    tags.push(match.groups.quoted);
                }

                matched = true;
            }

            match = term.match(rName);
            if (match) {
                if (match.groups.unquoted) {
                    names.push(match.groups.unquoted);
                } else if (match.groups.quoted) {
                    names.push(match.groups.quoted);
                }

                matched = true;
            }

            match = term.match(rNum);
            if (match) {
                if (match.groups.unquoted) {
                    nums.push({tag: match.groups.unquoted, value: match.groups.value});
                } else if (match.groups.quoted) {
                    nums.push({tag: match.groups.quoted, value: match.groups.value});
                }

                matched = true;
            }

            if (!matched) {
                throw `Invalid search term: ${term}`;
            }
        }

        return { tags, names, nums };
    }

    /*
     */
    static async searchv2(terms, options) {
        const promise = new Promise(async function(resolve, reject) {
            try {
                const { tags, names, nums } = TagItSearch.getSearchTerms(terms);

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

    static tokenizer(str) {
        str = str.trim();
        let index = 0;
        let length = str.length;
        const tokens = [];

        let sQuote = false;
        let dQuote = false;
        let parenDepth = 0;

        let tokenStart = 0;
        let tokenClose = 0;

        tokenClose = [];

        while (index < length) {
            switch (str[index]) {
                case "\\":
                    // Encountered an escape
                    // Look ahead
                    index++;

                    switch (str[index]) {
                        case '"':
                        case "'":
                        case '(':
                        case ')':
                            // Escaping values
                            index++;
                            break;
                    }
                    continue;
                case "'":
                    if (parenDepth > 0) {
                        // In a parenthetical
                        break;
                    } else if (dQuote) {
                        // Encountered singlequote within doublequote
                        break;
                    } else if (sQuote) {
                        // Encountered singlequote after finding one earlier
                        sQuote = false;

                        // push token
                        // start = 1
                        // end = index - 1

                        tokenClose.push({start: 1, end: index, offset: 0, recurse: false});
                    } else {
                        sQuote = true;
                    }

                    break;
                case '"':
                    if (parenDepth > 0) {
                        // In a parenthetical
                        break;
                    } else if (sQuote) {
                        // Encountered doublequote within singlequote
                        break;
                    } else if (dQuote) {
                        //In a doublequote
                        dQuote = false;

                        // push token
                        // start = 1
                        // end = index - 1

                        tokenClose.push({start: 1, end: index, offset: 0, recurse: false});
                    } else {
                        dQuote = true;
                    }

                    break;
                case '(':
                    if (sQuote || dQuote) {
                        // In the middle of a quote, do nothing
                        break;
                    }
                    parenDepth++;

                    break;
                case ')':
                    if (sQuote || dQuote) {
                        // In the middle of a quote, do nothing
                        break;
                    }
                    parenDepth--;

                    if (parenDepth == 0) {
                        // Found end of parenthetical
                        tokenClose.push({start: 0, end: index+1, offset: 0, recurse: true});
                    }
                    
                    break;
                case '<':
                case '>':
                    // numerical operators

                    if (sQuote || dQuote || parenDepth > 0) {
                        break;
                    }

                    // Look ahead to see if '<=' or '>='
                    if (str[index+1] == '=') {
                        // it is
                        if (index > 0) {
                            // push previous token
                            // start = 0
                            // current - 1
                            tokenClose.push({start: 0, end: 2, offset: 2, recurse: false})
                            tokenClose.push({start:0, end:index, offset: -1, recurse: false});
                        } else {
                            // At start of string due to quote
                            tokenClose.push({start: 0, end: 2, offset: 1, recurse: false})
                        }
                    } else {
                        if (index > 0) {
                            // push previous token
                            // start = 0
                            // current - 1
                            tokenClose.push({start: 0, end: 1, offset: 1, recurse: false})
                            tokenClose.push({start:0, end:index, offset: -1, recurse: false});
                        } else {
                            // At start of string due to quote
                            tokenClose.push({start: 0, end: 1, offset: 0, recurse: false})
                        }
                    }


                    break;
                case '=':
                case ':':
                    // Encountered a : or = operator
                    if (sQuote || dQuote || parenDepth > 0) {
                        break;
                    }

                    if (index + 1 == length) {
                        // Encountered ':' at end of string
                        throw "Invalid input - Cannot end with ':'"
                    } else if (index == 0 && tokens.length == 0) {
                        // Start of token or string is ':'
                        throw "Invalid input - Cannot start with ':'"
                    }

                    

                    if (index > 0) {
                        // push previous token
                        // start = 0
                        // current - 1
                        tokenClose.push({start: 0, end: 1, offset: 1, recurse: false})
                        tokenClose.push({start:0, end:index, offset: -1, recurse: false});
                    } else {
                        // At start of string
                        tokenClose.push({start: 0, end: 1, offset: 0, recurse: false})
                    }
                    // push :
                    // start = index - 1
                    // end = index;

                    break;
                case ' ':
                    // Encountered white space
                    if (sQuote || dQuote || parenDepth > 0) {
                        break;
                    }
                    // push token
                    // start = 0
                    // end = index - 1
                    tokenClose.push({start:0, end:index, offset: 0, recurse: false});

                    break;
                default:
                    break;
            }

            index++;
            if (index > 0 && index == length && tokenClose.length == 0) {
                // Final token push
                // start = 0
                // end = index

                tokenClose.push({start:0, end:index, offset: 0, recurse: false});
            }

            while(tokenClose.length > 0) {
                const close = tokenClose.pop();
                //tokens.push(str.substring(close.start, close.end));
                const token = str.substring(close.start, close.end);
                if (close.recurse) {
                    tokens.push(TagItSearch.tokenizer(token.substring(1, token.length -1)));
                } else {
                    tokens.push(token)
                }
                //tokens.push(str.substring(close.start, close.end));
                str = str.substring(index + close.offset).trim();
                index = 0;
                length = str.length;
            }
        }

        if (sQuote) {
            throw `Invalid input - Unclosed "'"`;
        } else if (dQuote) {
            throw `Invalid input - Unclosed '"'`;
        } else if (parenDepth < 0) {
            throw `Invalid input - Too many ')'`;
        } else if (parenDepth > 0) {
            throw `Invalid input - Not enough ')'`;
        }

        return tokens;
    }

    static async parser(items) {
        let expressions = [];

        let merge = null;

        const operators = [':','=','<','<=','>','>='];
        const boolOperators = ['&&','||'];

        while (items.length) {
            const item = items.shift();

            let expression = null;

            if (Array.isArray(item)) {
                // Recurse
                expressions.push(await TagItSearch.parser(item));
            } else if (operators.includes(items[0])) {
                // Next operand is an operator
                let op = items.shift();
                const value = items.shift();
                switch (item) {
                    case 'name':
                        // Looking for a name

                        expression = {
                            op: "filter",
                            document: function(collection) {
                                return collection
                                .filter(document => document.name.toLowerCase().includes(value.toLowerCase()))
                                .map(document => {
                                    return {
                                        id: document.id,
                                        name: document.name,
                                        type: document.documentName,
                                        tags: document.data.flags?.tagit?.tags,
                                        document: document,
                                        img: (document.documentName === "Scene") ? document.data.thumb : document.img
                                    }
                                });
                            },
                            pack: function(packIndex) {
                                const packtags = [];
                                for (const pack of packIndex) {
                                    packtags.push(
                                        pack.items
                                        .filter(index => index.name.toLowerCase().includes(value.toLowerCase()))
                                        .map(index => {
                                            return {
                                                id: index._id,
                                                name: index.name,
                                                type: pack.type,
                                                tags: index.flags.tagit.tags,
                                                pack: `${pack.pack}.${pack.name}`,
                                                img: (pack.type === "Scene") ? b.thumb : b.img
                                            }
                                        })
                                    );
                                }
        
                                return packtags.flat();
                            }
                        };
                        break;
                    case 'document-type':
                        // Filtering an entity
                        expression =  {
                            op: "doc-filter",
                            collection: function(packIndex) {
                                const documents = [];

                                if (packIndex) {
                                    documents.push(
                                        packIndex.filter(a => a.type === value)
                                        .flatMap(a=> a.items
                                            .map(b => {
                                                return {
                                                    id: b._id,
                                                    name: b.name,
                                                    type: a.type,
                                                    pack: `${a.pack}.${a.name}`,
                                                    img: (a.type === "Scene") ? b.thumb : b.img
                                                }
                                            })
                                        )
                                    );
                                }

                                switch (value.toLowerCase()) {
                                    case "journalentry":
                                        documents.push(
                                            game.journal
                                            .map(document => {
                                                return {
                                                    id: document.id,
                                                    name: document.name,
                                                    type: document.documentName,
                                                    tags: document.data.flags?.tagit?.tags,
                                                    document: document,
                                                    img: document.img
                                                }
                                            })
                                        );

                                        break;
                                    case "scene":
                                        documents.push(
                                            game.scenes
                                            .map(document => {
                                                return {
                                                    id: document.id,
                                                    name: document.name,
                                                    type: document.documentName,
                                                    tags: document.data.flags?.tagit?.tags,
                                                    document: document,
                                                    img: document.data.thumb
                                                }
                                            })
                                        );
                                        
                                        break;
                                    case "actor":
                                        documents.push(
                                            game.actors
                                            .map(document => {
                                                return {
                                                    id: document.id,
                                                    name: document.name,
                                                    type: document.documentName,
                                                    tags: document.data.flags?.tagit?.tags,
                                                    document: document,
                                                    img: document.img
                                                }
                                            })
                                        );
                                        
                                        break;
                                    case "item":
                                        documents.push(
                                            game.items
                                            .map(document => {
                                                return {
                                                    id: document.id,
                                                    name: document.name,
                                                    type: document.documentName,
                                                    tags: document.data.flags?.tagit?.tags,
                                                    document: document,
                                                    img: document.img
                                                }
                                            })
                                        );
                                        
                                        break;
                                }

                                return documents.flat();
                            }
                        }
                        break;
                    case 'tag':
                        // Looking for a name

                        expression = {
                            op: "filter",
                            document: function(collection) {
                                return collection
                                .filter(document => document.data.flags?.tagit?.tags?.some(tag => tag.tag === value))
                                .map(document => {
                                    return {
                                        id: document.id,
                                        name: document.name,
                                        type: document.documentName,
                                        tags: document.data.flags?.tagit?.tags,
                                        document: document,
                                        img: (document.documentName === "Scene") ? document.data.thumb : document.img
                                    }
                                });
                            },
                            pack: function(packIndex) {
                                const packtags = [];
                                for (const pack of packIndex) {
                                    packtags.push(
                                        pack.items
                                        .filter(index => index.flags.tagit.tags.some(tag => tag.tag === value))
                                        .map(index => {
                                            return {
                                                id: index._id,
                                                name: index.name,
                                                type: pack.type,
                                                tags: index.flags.tagit.tags,
                                                pack: `${pack.pack}.${pack.name}`,
                                                img: (pack.type === "Scene") ? index.thumb : index.img
                                            }
                                        })
                                    );
                                }
        
                                return packtags.flat();
                            }
                        };
                        break;
                    default:
                        // Tag with value

                        let valueExpr = null;

                        switch (op) {
                            case ":":
                            case "=":
                                valueExpr = function (tag) { return tag.value == value; }
                                break;
                            case ">":
                                valueExpr = function (tag) { return tag.value > value; }
                                break;
                            case ">=":
                                valueExpr = function (tag) { return tag.value >= value; }
                                break;
                            case "<":
                                valueExpr = function (tag) { return tag.value < value; }
                                break;
                            case "<=":
                                valueExpr = function (tag) { return tag.value <= value; }
                                break;
                        }

                        expression =  {
                            op: "filter",
                            document: function(collection) {
                                return collection
                                .filter(document => document.data.flags?.tagit?.tags?.some(tag => tag.tag === item && valueExpr(tag)))
                                .map(document => {
                                    return {
                                        id: document.id,
                                        name: document.name,
                                        type: document.documentName,
                                        tags: document.data.flags?.tagit?.tags,
                                        document: document,
                                        img: (document.documentName === "Scene") ? document.data.thumb : document.img
                                    }
                                });
                            },
                            pack: function(packIndex) {
                                const packtags = [];
                                for (const pack of packIndex) {
                                    packtags.push(
                                        pack.items
                                        .filter(index => index.flags.tagit.tags.some(tag => tag.tag === item && valueExpr(tag)))
                                        .map(index => {
                                            return {
                                                id: index._id,
                                                name: index.name,
                                                type: pack.type,
                                                tags: index.flags.tagit.tags,
                                                pack: `${pack.pack}.${pack.name}`,
                                                img: (pack.type === "Scene") ? index.thumb : index.img
                                            }
                                        })
                                    );
                                }
        
                                return packtags.flat();
                            }
                        }

                        break;
                }
            } else {
                // No operator
                expression = {
                    op: "filter",
                    document: function(collection) {
                        return collection
                        .filter(document => document.data.flags?.tagit?.tags?.some(tag => tag.tag === item))
                        .map(document => {
                            return {
                                id: document.id,
                                name: document.name,
                                type: document.documentName,
                                tags: document.data.flags?.tagit?.tags,
                                document: document,
                                img: (document.documentName === "Scene") ? document.data.thumb : document.img
                            }
                        });
                    },
                    pack: function(packIndex) {
                        const packtags = [];
                        for (const pack of packIndex) {
                            packtags.push(
                                pack.items
                                .filter(index => index.flags.tagit.tags.some(tag => tag.tag === item))
                                .map(index => {
                                    return {
                                        id: index._id,
                                        name: index.name,
                                        type: pack.type,
                                        tags: index.flags.tagit.tags,
                                        pack: `${pack.pack}.${pack.name}`,
                                        img: (pack.type === "Scene") ? index.thumb : index.img
                                    }
                                })
                            );
                        }

                        return packtags.flat();
                    }
                }
            }

            if (expression) {
                // Have a filter expression

                expressions.push(expression);
                expression = null;

                if (merge) {
                    expressions.push(merge);
                    merge = null;
                }
            }

            if (items.length > 0 && boolOperators.includes(items[0])) {
                // Next operand is a bool operator
                switch (items.shift()) {
                    case "&&":
                        merge = {
                            op: "merge",
                            func: function (a, b) {
                                return a.filter(A => b.some(B => A.id === B.id && A.name === B.name && A.type === B.type));
                            }
                        }
                        break;
                    case "||":
                        merge = {
                            op: "merge",
                            func: function (a, b) {
                                return [...a, ...b]
                                .filter((A, pos, arr) =>
                                  arr.findIndex(B => A.id === B.id && A.name === B.name && A.type === B.type) == pos
                                );
                            }
                        }
                        break;
                }
                
            } else if (items.length > 0) {
                // Next operator is not a bool operator
                // Assume &&
                merge = {
                    op: "merge",
                    func: function (a, b) {
                        return a.filter(A => b.some(B => A.id === B.id));
                    }
                }
            }

        }

        return expressions;
    }

    static exec(et, packIndex) {
        let a = null;
        let b = null;
        let x = null;


        while(et.length > 0) {
            const expression = et.shift();

            if (Array.isArray(expression)) {
                // Parentheticals
                x = TagItSearch.exec(expression);
            } else {
                switch (expression.op) {
                    case 'filter':
                        x = [].concat(
                            expression.document(game.journal),
                            expression.document(game.actors),
                            expression.document(game.scenes),
                            expression.document(game.items),
                            expression.pack(packIndex)
                        );
    
                        break;
                    case 'doc-filter':
                        x = expression.collection(packIndex);
                        break;
                    case 'merge':
                        a = expression.func(a, b);
                        break;
                }
            }

            if (a) {
                b = x;
            } else {
                a = x;
            }
        }
        
        return a;
    }

    static async searchByString(item, options) {
        const promise = new Promise(async function(resolve, reject) {
            try {
                const promises = TagItPackCache._getPackIndexPromises();

                const tokens = TagItSearch.tokenizer(item);
                const instructions = await TagItSearch.parser(tokens);

                const packIndex = await TagItPackCache._getPacksWithTagsIndex(promises);
                const results = TagItSearch.exec(instructions, packIndex);

                resolve(results);
            } catch (e) {
                reject(e);
            }

        });

        return promise;
    }
}

class SearchItem {
    constructor(itemString) {
        this._item = SearchItem.toDict(itemString);
    }
    
    get dict() { return this._item; }

    static toDict(searchString) {
        const rTag = /^(tag:)?((?<unquoted>\w([\w '\!\?\.]+[\w\!\?\.])?)|((?<quote>["'])(?<quoted>[^\:]*?(?<!\\))\k<quote>))$/;
        const rName = /^name:((?<unquoted>\w([\w '\!\?\.]+[\w\!\?\.])?)|((?<quote>["'])(?<quoted>.*?(?<!\\))\k<quote>))$/;
        const rNum = /^((?<unquoted>\w([\w'\!\?\.]*[\w\!\?\.])?):|((?<quote>["'])(?<quoted>.*?(?<!\\))\k<quote>)):(?<value>[\d]+)$/;

        let match = searchString.match(rTag);
        if (match) {
            return (match.groups.unquoted) ?
            {tag: match.groups.unquoted} :
            {tag: match.groups.quoted};
        }

        match = searchString.match(rName);
        if (match) {
            return (match.groups.unquoted) ?
            {name: match.groups.unquoted} :
            {name: match.groups.quoted};
        }

        match = searchString.match(rNum);
        if (match) {
            return (match.groups.unquoted) ?
            {tag: match.groups.unquoted, value: match.groups.value} :
            {tag: match.groups.quoted, value: match.groups.value};
        }

        throw `Invalid search term: ${searchString}`;
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