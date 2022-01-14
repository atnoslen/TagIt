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

        _this.tagcache = await TagItTagManager.getUsedTags();

        data.tagcache = _this.tagcache;
        data.appId = this.appId;

        return data;
    }

    activateListeners(html) {
        const _this = this;
        super.activateListeners(html);

        $('.entity-filter', html).change(function() {
            _this._renderResults();
        });
    
        $(`#taginput${_this.appId}`, html).on('keypress', async function(event) {
            if (event.keyCode === 13) {
                event.preventDefault();

                const searchString = $(this).val();

                console.log(`TagIt: Search initiated '${searchString}'`);

                const results = await TagItSearch.search(searchString);

                console.log(results);

                _this._renderResults(results.sort((a,b) => a.name.localeCompare(b.name)));
            }
        });

        $(`#taginput${_this.appId}`, html).focus();
    }
    
    async _updateObject(event, formData) {
        return;
    }

    _renderResults(results) {
        const _this = this;

        $('.search.directory-list', _this.element).empty();

        if (results.length === 0) {
            // No need to render any objects.
            return;
        }

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
            );

            switch(a.type) {
                case "JournalEntry":
                    $(item).addClass('journalentry');

                    $('a', item).on("click", function () {
                        game.journal.get($(this).parent().parent().parent().attr("data-document-id")).sheet.render(true);
                    });

                    break;
                case "Scene":
                    $(item).addClass('scene');

                    $('a', item).on("click", function () {
                        game.scenes.get($(this).parent().parent().parent().attr("data-document-id")).sheet.render(true);
                    });

                    break;
                case "Actor":
                    $(item).addClass('actor');

                    $('a', item).on("click", function () {
                        game.actors.get($(this).parent().parent().parent().attr("data-document-id")).sheet.render(true);
                    });

                    break;
                case "Item":
                    $(item).addClass('item');

                    $('a', item).on("click", function () {
                        game.items.get($(this).parent().parent().parent().attr("data-document-id")).sheet.render(true);
                    });

                    break;
                case "Token":
                    $(item).addClass('token');

                    $('a', item).on("click", function () {
                        canvas.tokens.objects?.children?.find(a => a.id === $(this).parent().parent().parent().attr("data-document-id")).actor.sheet.render(true);
                    });

                    break;
            }

            if (a.pack) {
                // Reset click event
                $('a', item)
                .off("click")
                .on("click", function () {
                    game.packs.get($(this).parent().parent().parent().attr("data-pack")).getDocument($(this).parent().parent().parent().attr("data-document-id")).then(a => a.sheet.render(true));
                });

                $(item).addClass('pack')
                .attr('data-pack', a.pack);

                $(item).append(
                    $('<div>')
                    .addClass('entity-info')
                    .append(
                        $('<p>')
                        .text(`(${a.pack})`)
                    )
                );
            }

            const collectionElement = $('div.tag.collection', item);

            if (a.tags) {
                for (const tag of a.tags) {
                    $(collectionElement)
                    .append(
                        $('<span>')
                        .addClass('tagit')
                        .addClass('tag')
                        .text((tag.value)? `${tag.tag}:${tag.value}`:`${tag.tag}`)
                    );
                }
            }

            $('.search.directory-list', _this.element).append(item);
        });
    }

    static reservedTokens = [
        'n',
        'name',
        't',
        'type',
        'document-type',
        'tag'
    ]

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

    static async parser(tokens) {
        let expressions = [];

        let merge = null;

        const operators = [':','=','<','<=','>','>='];
        const boolOperators = ['&&','||'];

        const documentMap = function(document) {
            return {
                id: document.id,
                name: document.name,
                type: document.documentName,
                tags: document.data.flags?.tagit?.tags,
                document: document,
                img: (document.documentName === "Scene") ? document.data.thumb : document.img
            }
        }

        const compendiumMap = function(pack, index) {
            return {
                id: index._id,
                name: index.name,
                type: pack.type,
                tags: index.flags.tagit.tags,
                pack: `${pack.pack}.${pack.name}`,
                img: (pack.type === "Scene") ? index.thumb : index.img
            }
        }

        const tokenMap = function(document) {
            return {
                id: document.id,
                name: document.name,
                type: document.documentName,
                tags: [...new Set([].concat(document.data.flags?.tagit?.tags, document.actor?.data?.flags?.tagit?.tags))]
                .filter(item => item !== undefined)
                .sort(),
                document: document,
                img: document.data.img
            }
        }

        while (tokens.length) {
            const item = tokens.shift();

            let expression = null;
            let filter = null;
            let tokenFilter = null;

            if (Array.isArray(item)) {
                // Recurse
                expressions.push(await TagItSearch.parser(item));
            } else if (operators.includes(tokens[0])) {
                // Next token is an operator
                let op = tokens.shift();
                const value = tokens.shift();
                switch (item) {
                    case 'n':
                    case 'name':
                        // Looking for a name
                        filter = function (document) {
                            return document.name.toLowerCase().includes(value.toLowerCase())
                        }

                        tokenFilter = filter;

                        expression = {
                            op: "filter"
                        };
                        break;
                    case 't':
                    case 'type':
                    case 'document-type':
                        // Filtering an entity
                        expression =  {
                            op: "doc-filter",
                            collection: function(packIndex) {
                                const documents = [];

                                let doc = value.toLowerCase();

                                // Provide some shortcuts
                                switch(doc) {
                                    case "journal":
                                    case "j":
                                        doc = "journalentry";
                                        break;
                                    case "a":
                                        doc = "actor";
                                        break;
                                    case "i":
                                        doc = "item";
                                        break;
                                    case "s":
                                        doc = "scene";
                                        break;
                                    case "t":
                                        doc = "token";
                                        break;
                                }

                                if (packIndex) {
                                    documents.push(
                                        packIndex.filter(a => a.type.toLowerCase() === doc.toLowerCase())
                                        .flatMap(pack => pack.items
                                            .map(index => compendiumMap(pack, index))
                                        )
                                    );
                                }


                                switch (doc) {
                                    case "journalentry":
                                        documents.push(
                                            game.journal
                                            .map(document => documentMap(document))
                                        )
                                        break;
                                    case "scene":
                                        documents.push(
                                            game.scenes
                                            .map(document => documentMap(document))
                                        )
                                        break;
                                    case "actor":
                                        documents.push(
                                            game.actors
                                            .map(document => documentMap(document))
                                        )
                                        break;
                                    case "item":
                                        documents.push(
                                            game.items
                                            .map(document => documentMap(document))
                                        )                                      
                                        break;
                                    case "token":
                                        documents.push(
                                            canvas.tokens.getDocuments()
                                            .map(document => tokenMap(document))
                                        ) 
                                        break;
                                }

                                return documents.flat();
                            }
                        }
                        break;
                    case 'tag':
                        // Looking for a tag

                        filter = function(document) {
                            return document.flags?.tagit?.tags?.some(tag => tag.tag === value);
                        }

                        tokenFilter = function(document) {
                            return document.data.flags?.tagit?.tags?.some(tag => tag.tag === value) ||
                            document.actor?.data?.flags?.tagit?.tags?.some(tag => tag.tag === value);
                        }

                        expression = {
                            op: "filter"
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

                        filter = function (document) {
                            return document.flags?.tagit?.tags?.some(tag => tag.tag === item && valueExpr(tag))
                        }

                        tokenFilter = function(document) {
                            return document.data.flags?.tagit?.tags?.some(tag => tag.tag === item && valueExpr(tag)) ||
                            document.actor?.data?.flags?.tagit?.tags?.some(tag => tag.tag === item && valueExpr(tag));
                        }

                        expression =  {
                            op: "filter"
                        }

                        break;
                }
            } else {
                // No operator
                filter = function(document) {
                    return document.flags?.tagit?.tags?.some(tag => tag.tag === item);
                }

                tokenFilter = function(document) {
                    return document.data.flags?.tagit?.tags?.some(tag => tag.tag === item) ||
                    document.actor?.data?.flags?.tagit?.tags?.some(tag => tag.tag === item);
                }


                expression = {
                    op: "filter"
                }
            }

            if (expression && filter) {
                expression.document = function(collection) {
                    return collection
                    .filter(document => filter(document.data))
                    .map(document => documentMap(document));
                };

                expression.pack = function (compendiums) {
                    const indexes = [];
                    for (const compendium of compendiums) {
                        indexes.push(
                            compendium.items
                            .filter(index => filter(index))
                            .map(index => compendiumMap(compendium, index))
                        );
                    }

                    return indexes.flat();
                }

                expression.token = function(collection) {
                    return collection
                    .filter(document => tokenFilter(document))
                    .map(document => tokenMap(document));
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

            if (tokens.length > 0 && boolOperators.includes(tokens[0])) {
                // Next operand is a bool operator
                switch (tokens.shift()) {
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
                
            } else if (tokens.length > 0) {
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
                            expression.pack(packIndex),
                            expression.token(canvas.tokens.getDocuments())
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

    static async search(item, options) {
        const promise = new Promise(async function(resolve, reject) {
            try {
                const tokens = TagItSearch.tokenizer(item);
                const instructions = await TagItSearch.parser(tokens);
                const results = TagItSearch.exec(instructions, TagItPackCache.Index);

                resolve(results);
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