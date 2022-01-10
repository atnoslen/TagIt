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
        
        const text = $(`#taginput${_this.appId}`, _this.element)
        .val()
        .toLowerCase()
        .trim();

        let tags = _this.tags;

        if (text.length > 0) {
            // Has filter in place
            tags = tags.filter(a => a.toLowerCase().includes(text));
        }

        _this.loadContainer(tags);
    }

    loadContainer(tags) {
        const _this = this;
        const container = $('div.tag.collection', _this.element).empty();

        for (const tag of tags) {
            container.append(
                $('<span>')
                .addClass('tagit')
                .addClass('tag')
                .css('cursor','pointer')
                .css('margin','0.2em')
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
        }
    }

    activateListeners(html) {
        const _this = this;
        super.activateListeners(html);

        $('div.tag.collection', html)
        .css('flex','auto');

        _this.loadTags();

        $(`#taginput${_this.appId}`, html)
        .on('keyup', function(event) {
            const text = $(this)
            .val()
            .toLowerCase()
            .trim();

            let tags = _this.tags;

            if (text.length > 0) {
                tags = tags.filter(a => a.toLowerCase().includes(text));
            }

            _this.loadContainer(tags);

        })
        .on('keypress', function(event) {
            if (event.keyCode === 13) {
                event.preventDefault();
            }
        })
        .focus();
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