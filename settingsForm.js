import { Settings, mod } from './settings.js';
import { TagItPackCache } from "./packcache.js";
import { TagItTagManager } from "./tagmanager.js";
import { TagItInputManager } from "./inputmanager.js"
import { EditTag } from "./edittag.js"

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

    /**
     * Load the tag into the form.
     *
     * @readonly
     * @static
     * @memberof SettingsForm
     */
    async loadTags() {
        const _this = this;
        await TagItPackCache.refresh();
        _this.tags = await TagItTagManager.getUsedTags();

        const container = $('ol.tagit.search.directory-list', this.element).empty();

        for (const tag of _this.tags) {
            container.append(
                $('<li>')
                .addClass('directory-item')
                .addClass('flexrow')
                .css('display', 'flex')
                .css('line-height', '32px')
                .append(
                    $('<h4>')
                    .addClass('entry-name')
                    .append(
                        $('<a>')
                        .text(tag)
                        .on('click', function() {
                            const data = {
                                tag: $(this).text(),
                                onsubmit: function () {
                                    _this.loadTags();
                                }
                            }
                            const editApp = new EditTag(data).render(true);
                        })
                    )
                )
            );
        }
    }

    activateListeners(html) {
        const _this = this;
        super.activateListeners(html);

        _this.loadTags();
    
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
    }
}