import { Settings } from "./settings.js";
import { TagItSearch } from "./search.js";
import { TagItPackCache } from "./packcache.js";
import { TagItTagManager } from "./tagmanager.js";
import { TagItInputManager } from "./inputmanager.js"

class TagIt extends FormApplication {

    tagcache = null;
    tags = [];

    constructor(object, options) {
        super(object, options);

        this.entity.apps[this.appId] = this;
    }

    get entity() {
        return this.object;
    }

    static get defaultOptions() {
        const options = super.defaultOptions;
        options.template = "modules/tagit/templates/template.html";
        options.width = '600';
        options.height = '700';
        options.classes = ['tagit', 'sheet'];
        options.title = game.i18n.localize('TagIt.label');
        options.resizable = true;
        options.editable = true;
        return options;
    }

    async getData() {
        const data = super.getData();

        await TagItPackCache.refresh();

        this.tags = this.entity.getFlag('tagit', 'tags');
        this.tagcache = await TagItTagManager.getUsedTags();
        
        data.tags = this.tags
        data.tagcache = this.tagcache;
        data.flags = this.entity.data.flags;
        data.owner = game.user.id;
        data.isGM = game.user.isGM;
        data.appId = this.appId;

        return data;
    }

    activateListeners(html) {
        const _this = this;
        super.activateListeners(html);

        if (_this.tags) {
            _this.tags.forEach(tag => {
                TagItInputManager.addtag(tag, _this, {
                    updateAutocomplete: false
                });
            });
        }

        TagItInputManager.calculateAutocompleteList(_this);
    
        $('#taginput' + _this.appId, html).on('input', function (event) {
            if(!(event.originalEvent instanceof InputEvent) || event.originalEvent.inputType === 'insertReplacementText') {
                // Selected a tag from dropdown
                TagItInputManager.addtag(this.value, _this);
            }
        });
    
        $('#taginput' + _this.appId, html).on('keypress', function(event) {
            if (event.keyCode === 13) {
                event.preventDefault();
    
                TagItInputManager.addtag($('#taginput' + _this.appId, html).val(), _this);
            }
        });
    
        $('#taginput' + _this.appId, html).focus();
    }
    
    async _updateObject(event, formData) {
        if (game.user.isGM) {
            var items = $('.tagit.item', this.element).map(
                function() {
                    return $(this).text();
                }).get().sort();

            await this.entity.setFlag('tagit', 'tags', items);

            var cache = game.settings.get('tagit', 'tags');

            cache = [...new Set([...items,...cache])].sort();

            await game.settings.set('tagit', 'tags', cache);

            this.render();
        } else {
            ui.notifications.error("You have to be GM to update tags");
        }
    }

    static _initEntityHook(app, html, data) {
        if (game.user.isGM) {
            let labelTxt = '';
            let labelStyle= "";
            let title = game.i18n.localize('TagIt.label'); 
            let notes = app.document.getFlag('tagit', 'tags');

            labelTxt = ' ' + title

            let openBtn = $(`<a class="open-tagit" title="${title}" ${labelStyle} ><i class="fas fa-clipboard${notes ? '-check':''}"></i>${labelTxt}</a>`);
            openBtn.click(ev => {
                let noteApp = null;
                for (let key in app.document.apps) {
                    let obj = app.document.apps[key];
                    if (obj instanceof TagIt) {
                        noteApp = obj;
                        break;
                    }
                }
                if (!noteApp) noteApp = new TagIt(app.document, { submitOnClose: true, closeOnSubmit: false, submitOnUnfocus: true });
                noteApp.render(true);
            });
            html.closest('.app').find('.open-tagit').remove();
            let titleElement = html.closest('.app').find('.window-title');
            openBtn.insertAfter(titleElement);
        }
    }
}

Hooks.on('renderJournalSheet', (app, html, data) => {
    TagIt._initEntityHook(app, html, data);
});

Hooks.on('renderActorSheet', (app, html, data) => {
    TagIt._initEntityHook(app, html, data);
});
Hooks.on('renderItemSheet', (app, html, data) => {
    TagIt._initEntityHook(app, html, data);
});

Hooks.once('ready', async () => {
    Settings.registerSettings();

    game.modules.get('tagit').api = {
        search: TagItSearch.getResults,
        packCache: TagItPackCache
    };
});
