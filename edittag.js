import { Settings, mod } from './settings.js';
import { TagItPackCache } from "./packcache.js";
import { TagItTagManager } from "./tagmanager.js";

export class EditTag extends FormApplication {
    /**
     * Default Options for this FormApplication
     *
     * @readonly
     * @static
     * @memberof SettingsForm
     */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: `${mod}-edit-tag-form`,
            title: game.i18n.localize("TagIt.EditTag.title"),
            template: `modules/${mod}/templates/edittag.html`,
            classes: ["sheet"],
            width: 400,
            height: 124,
            closeOnSubmit: true,
            submitOnClose: false,
            resizable: false
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

        console.log(data.object);

        data.owner = game.user.id;
        data.isGM = game.user.isGM;
        data.appId = this.appId;

        return data;
    }

    activateListeners(html) {
        const _this = this;
        super.activateListeners(html);
    }

    /**
     * Executes on form submission.
     *
     * @param {Event} event - the form submission event
     * @param {object} data - the form data
     * @memberof SettingsForm
     */
    async _updateObject(event, data) {
        
    }
}