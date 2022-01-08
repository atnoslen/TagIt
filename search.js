import { Settings } from "./settings.js";
import { TagItPackCache } from "./packcache.js";
import { TagItTagManager } from "./tagmanager.js";
import { TagItInputManager } from "./inputmanager.js";

export class TagItSearch extends FormApplication {

    tagcache = null;
    
    constructor(object, options) {
        super(object, options);
    }

    static get defaultOptions() {
        const options = super.defaultOptions;
        options.template = "modules/tagit/templates/search.html";
        options.width = '450';
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

        TagItInputManager.calculateAutocompleteList(_this);

        $('#taginput' + _this.appId, html).on('input', function (event) {
            if(!(event.originalEvent instanceof InputEvent) || event.originalEvent.inputType === 'insertReplacementText') {
                // Selected a tag from dropdown

                TagItInputManager.addtag(this.value, _this, {
                    onUpdate: () => {
                        _this._renderResults();
                    }
                });
            }
        });
    
        $('#taginput' + _this.appId, html).on('keypress', function(event) {
            if (event.keyCode === 13) {
                event.preventDefault();

                TagItInputManager.addtag($('#taginput' + _this.appId, html).val(), _this, {
                    onUpdate: () => {
                        _this._renderResults();
                    }
                });
            }
        });

        $('.entity-filter', html).change(function() {
            _this._renderResults();
        });

        $('button.search.refresh', html).on("click", async function() {

            await TagItPackCache.refresh();
            _this.tagcache = await TagItTagManager.getUsedTags();

            _this._renderResults();
        });

        $('#taginput' + _this.appId, html).focus();
    }
    
    async _updateObject(event, formData) {
        return;
    }

    _renderResults() {
        const _this = this;

        const items = $('.tagit.item', _this.element).map(function() {
            return $(this).text();
        }).get();

        $('.search.directory-list', _this.element).empty();

        if (items.length > 0) {
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
                    $('<h4>')
                    .addClass('entry-name')
                    .append(
                        $('<a>').text(a.name)
                    )
                );

                switch(a.entity) {
                    case "JournalEntry":
                        $(item).addClass('journalentry');

                        $('a', item).on("click", function () {
                            game.journal.get($(this).parent().parent().attr("data-document-id")).sheet.render(true);
                        });

                        $('h4', item).append($('<span>').text('(Journal Entry)'));
                        break;
                    case "Actor":
                        $(item).addClass('actor');

                        $('a', item).on("click", function () {
                            game.actors.get($(this).parent().parent().attr("data-document-id")).sheet.render(true);
                        });

                        $('h4', item).append($('<span>').text('(Actor)'));

                        break;
                    case "Item":
                        $(item).addClass('item');

                        $('a', item).on("click", function () {
                            game.items.get($(this).parent().parent().attr("data-document-id")).sheet.render(true);
                        });

                        $('h4', item).append($('<span>').text('(Item)'));

                        break;
                    case "Token":
                        $(item).addClass('token');

                        $('a', item).on("click", function () {
                            canvas.tokens.objects?.children?.find(a => a.id === $(this).parent().parent().attr("data-document-id")).actor.sheet.render(true);
                        });

                        $('h4', item).append($('<span>').text('(Token)'));

                        break;
                    case "Pack":
                        $(item).addClass('pack')
                        .attr('data-pack', a.pack);

                        $('a', item).on("click", function () {
                            game.packs.get($(this).parent().parent().attr("data-pack")).getDocument($(this).parent().parent().attr("data-document-id")).then(a => a.sheet.render(true));
                        });

                        $('h4', item).append($('<span>').text('(' + a.pack + ')'));

                        break;

                }

                $('.search.directory-list', _this.element).append(item);
            });
        }
    }

    static getResults(tags, entities = []) {
        
        let result = [];

        if (entities.includes('journalentries')) {
            result = result.concat(
                game.journal.filter(a => tags.every(b => a.data.flags?.tagit?.tags?.includes(b)))
                .map(a => { return {entity: "JournalEntry", id: a.id, name: a.name, img: a.data.img}})
            );
        }

        if (entities.includes('actors')) {
            result = result.concat(
                game.actors.filter(a => tags.every(b => a.data.flags?.tagit?.tags?.includes(b)))
                .map(a => { return {entity: "Actor", id: a.id, name: a.name, img: a.data.img}})
            );
        }
        
        if (entities.includes('items')) {
            result = result.concat(
                game.items.filter(a => tags.every(b => a.data.flags?.tagit?.tags?.includes(b)))
                .map(a => { return {entity: "Item", id: a.id, name: a.name, img: a.data.img}})
            );
        }

        if (entities.includes('tokens')) {
            result = result.concat(
                canvas.tokens.objects?.children?.filter(a => tags.every(b => a.data.actorData?.flags?.tagit?.tags?.includes(b)))
                .map(a => { return {entity: "Token", id: a.id, name: a.name, img: a.icon.src}})
            );

            result = result.concat(
                canvas.tokens.objects?.children?.filter(a => tags.every(b => a.actor?.data?.flags?.tagit?.tags?.includes(b)))
                .map(a => { return {entity: "Token", id: a.id, name: a.name, img: a.icon.src}})
            );
        }

        if (entities.includes('packs')) {

            let packtags = [];
            for (const pack of TagItPackCache.index) {
                packtags.push( pack.items.filter(a => tags.every(b => a.flags.tagit.tags.includes(b)))
                .map(a => { return { entity: "Pack", id: a._id, name: a.name, img: a.img, pack: pack.pack + '.' + pack.name }}));
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
}

let form = null;

Hooks.once('ready', async () => {
    window.addEventListener('keypress', (e) => {
        if (e.shiftKey && e.ctrlKey && e.code === 'KeyF') {
            if (form === null) {
                form = new TagItSearch(); // data, options
            }

            if (!(form.rendered)) {
                form.render(true);
            }
        }
    });
});