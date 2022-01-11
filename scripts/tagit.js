import { Settings, mod } from "./settings.js";
import { TagItSearch } from "./search.js";
import { TagItPackCache } from "./packcache.js";
import { TagItTagManager } from "./tagmanager.js";
import { TagItInputManager } from "./inputmanager.js"
import { TagItInput } from "./input.js";

class TagIt extends FormApplication {

    tagcache = null;
    tags = [];

    // Such as from a non-linked token's actor
    readOnlyTags = [];

    constructor(object, options) {
        super(object, options);

        this.entity.apps[this.appId] = this;
    }

    get entity() {
        return this.object;
    }

    static get defaultOptions() {
        const options = super.defaultOptions;
        options.template = `modules/${mod}/templates/template.html`;
        options.width = '400';
        options.height = '250';
        options.classes = ['tagit', 'sheet'];
        options.title = game.i18n.localize('TagIt.label');
        options.resizable = true;
        options.editable = true;
        return options;
    }

    async getData() {
        const data = super.getData();

        await TagItPackCache.refresh();

        this.tags = this.entity.getFlag(mod, 'tags');

        if (this.entity.documentName === 'Actor' && this.entity.isToken) {
            this.tags = this.entity.token.getFlag(mod, 'tags');
            this.readOnlyTags = this.entity.getFlag(mod, 'tags');
        }

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

        

        //TagItInputManager.calculateAutocompleteList(_this);
        

        if (_this.readOnlyTags) {
            // Render read only version for tags.
            _this.readOnlyTags.forEach(tag => {
                TagItInput.addtag(tag, _this, {
                    updateAutocomplete: false,
                    readonly: true
                });
            });
        }

        if (_this.tags) {
            _this.tags.forEach(tag => {
                TagItInput.addtag(tag, _this, {
                    updateAutocomplete: false
                });
            });
        }

        TagItInput.calculateAutocompleteList(_this);
        TagItInput.registerListeners(_this);
    
        // $(`#taginput${_this.appId}`, html).on('input', function (event) {
        //     if(!(event.originalEvent instanceof InputEvent) || event.originalEvent.inputType === 'insertReplacementText') {
        //         // Selected a tag from dropdown
        //         TagItInput.addtag(this.value, _this);
        //     }
        // });
    
        // $(`#taginput${_this.appId}`, html).on('keypress', function(event) {
        //     if (event.keyCode === 13) {
        //         event.preventDefault();
    
        //         TagItInput.addtag($(`#taginput${_this.appId}`, html).val(), _this);
        //     }
        // });
    
        // $(`#taginput${_this.appId}`, html).focus();
    }
    
    async _updateObject(event, formData) {
        if (game.user.isGM) {
            const collection = $('div.tag.collection', this.element);

            const items = $('span.tag', collection)
            .map(function() {
                if ($('i.fa-times-circle', this).length > 0) {
                    return $(this).text();
                }
            }).get().sort();

            let entity = this.entity;

            if (this.entity.documentName === "Actor" && this.entity.isToken) {
                entity = this.entity.token;
            }

            if (items.length > 0) {
                await entity.setFlag(mod, 'tags', items);
            } else {
                await entity.unsetFlag(mod, 'tags');
            }

            this.render();
        } else {
            ui.notifications.error("You have to be GM to update tags");
        }
    }

    static _initEntityHook(app, html, data) {
        if (game.user.isGM) {
            let title = game.i18n.localize('TagIt.label'); 
            let labelTxt = `${title}`;

            let openBtn = $(`<a class="open-${mod}" title="${title}"><i class="fas fa-clipboard"></i>${labelTxt}</a>`);
            openBtn.click(ev => {
                let _app = null;
                for (let key in app.document.apps) {
                    let obj = app.document.apps[key];
                    if (obj instanceof TagIt) {
                        _app = obj;
                        break;
                    }
                }
                if (!_app) _app = new TagIt(app.document, { submitOnClose: true, closeOnSubmit: false, submitOnUnfocus: true });
                _app.render(true);
            });
            html.closest('.app').find(`.open-${mod}`).remove();
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

Hooks.on('renderSceneConfig', (app, html, data) => {
    console.log('test');
    TagIt._initEntityHook(app, html, data);
    console.log('test');
});

Hooks.once('ready', async () => {
    Settings.registerSettings();

    game.modules.get(mod).api = {
        search: TagItSearch.getResults,
        packCache: TagItPackCache
    };
});
