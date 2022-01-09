import { Settings, mod } from './settings.js';
//import { getUsedTags } from './tagit.js';
import { TagItPackCache } from "./packcache.js";
import { TagItTagManager } from "./tagmanager.js";

export class SettingsForm extends FormApplication {
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

        data.tagcache = await TagItTagManager.getUsedTags();
        data.owner = game.user.id;
        data.isGM = game.user.isGM;

        return data;
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