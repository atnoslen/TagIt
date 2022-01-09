import { Settings, mod } from './settings.js';
import { TagItPackCache } from "./packcache.js";
import { TagItTagManager } from "./tagmanager.js";
import { TagItInputManager } from "./inputmanager.js"

export class SettingsForm extends FormApplication {
    tags = [];
    
    /**
     * Default Options for this FormApplication
     *
     * @readonly
     * @static
     * @memberof SettingsForm
     */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: `${mod}-settings-form`,
            title: game.i18n.localize("TagIt.SettingTitle"),
            template: `modules/${mod}/templates/settings.html`,
            classes: ["sheet"],
            width: 500,
            height: 500,
            closeOnSubmit: true,
            submitOnClose: false,
            resizable: true
        });
    }

    /**
     * Construct an object of data to be passed to this froms HTML template.
     *
     * @return {object} The data being supplied to the template.
     * @memberof SettingsForm
     */
    async getData() {
        const data = super.getData();

        await TagItPackCache.refresh();
        this.tags = await TagItTagManager.getUsedTags();

        data.tags = this.tags;
        data.owner = game.user.id;
        data.isGM = game.user.isGM;
        data.appId = this.appId;

        return data;
    }

    activateListeners(html) {
        const _this = this;
        super.activateListeners(html);

        // if (_this.tags) {
        //     _this.tags.forEach(tag => {
        //         TagItInputManager.addtag(tag, _this, {
        //             updateAutocomplete: false
        //         });
        //     });
        // }

        // TagItInputManager.calculateAutocompleteList(_this);
    
        // $(`#taginput${_this.appId}`, html).on('input', function (event) {
        //     if(!(event.originalEvent instanceof InputEvent) || event.originalEvent.inputType === 'insertReplacementText') {
        //         // Selected a tag from dropdown
        //         TagItInputManager.addtag(this.value, _this);
        //     }
        // });
    
        // $(`#taginput${_this.appId}`, html).on('keypress', function(event) {
        //     if (event.keyCode === 13) {
        //         event.preventDefault();
    
        //         TagItInputManager.addtag($(`#taginput${_this.appId}`, html).val(), _this);
        //     }
        // });
    
        $(`#taginput${_this.appId}`, html).focus();
    }

    /**
     * Executes on form submission.
     *
     * @param {Event} event - the form submission event
     * @param {object} data - the form data
     * @memberof SettingsForm
     */
    async _updateObject(event, data) {
        if (game.user.isGM) {
            var items = $('.tagit.item', this.element).map(
                function() {
                    return $(this).text();
                }).get().sort();

            await game.settings.set(mod, 'tags', items);

            //this.render();
        } else {
            ui.notifications.error("You have to be GM to update journal tags");
        }
    }
}