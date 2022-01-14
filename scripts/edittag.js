import { Settings, mod } from './settings.js';
import { TagItPackCache } from "./packcache.js";
import { TagItTagManager } from "./tagmanager.js";

export class EditTag extends FormApplication {
    original = '';
    data = null;

    /**
     * Default Options for this FormApplication
     *
     * @readonly
     * @static
     * @memberof EditTag
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
     * @memberof EditTag
     */
    async getData() {
        const data = super.getData();

        this.original = data.object.tag;

        data.owner = game.user.id;
        data.isGM = game.user.isGM;
        data.appId = this.appId;

        this.data = data;

        return data;
    }

    /**
     * After rendering, activate event listeners which provide interactivity for the Application. This is where user-defined Application subclasses should attach their event-handling logic.
     *
     * @memberof EditTag
     * @param {String} html - The rendered HTML of this form.
     */
    activateListeners(html) {
        const _this = this;
        super.activateListeners(html);

        $('button.delete', html).on('click', function() {
            new Dialog({
                title: "Delete Tag",
                content: `<p>Deleting this tag will remove it from all entities.</p><p>Are you sure?</p>`,
                buttons: {
                    delete: {
                        icon: '<i class="fas fa-trash"></i>',
                        label: 'Delete',
                        callback: async () => {
                            await _this.modifyTags(_this.original);
                            _this.close();

                            if (_this.data.object.onsubmit) {
                                _this.data.object.onsubmit();
                            }
                        }
                    },
                    cancel: {
                        icon: '<i class="fas fa-ban"></i>',
                        label: 'Cancel'
                    }
                },
                default: 'cancel'
            })
            .render(true);
        });
    }

    /**
     * Modifies tags across the different entity collections.
     *
     * @memberof EditTag
     * @param {String} oldTag - The tag to change.
     * @param {String} newTag - The new tag name.  If null, deletes the tag.
     */
    async modifyTags(oldTag, newTag) {
        const promises = [];

        for (const entity of game.journal.filter(a => a.data.flags?.tagit?.tags?.some(a => a.tag === oldTag))) {
            promises.push(this.modifyTag(entity, oldTag, newTag));
        }

        for (const entity of game.actors.filter(a => a.data.flags?.tagit?.tags?.some(a => a.tag === oldTag))) {
            promises.push(this.modifyTag(entity, oldTag, newTag));
        }

        for (const entity of game.items.filter(a => a.data.flags?.tagit?.tags?.some(a => a.tag === oldTag))) {
            promises.push(this.modifyTag(entity, oldTag, newTag));
        }

        for (const entity of canvas.tokens.getDocuments().filter(a => a.data.flags?.tagit?.tags?.some(a => a.tag === oldTag))) {
            promises.push(this.modifyTag(entity, oldTag, newTag));
        }

        for (const pack of TagItPackCache.Index) {
            for (const index of pack.items.filter(a => a.flags.tagit.tags.some(a => a.tag === oldTag))) {
                const entity = await game.packs.get(`${pack.pack}.${pack.name}`).getDocument(index._id);
                
                promises.push(this.modifyTag(entity, oldTag, newTag));
            }
        }

        await Promise.all(promises);
        await TagItPackCache.init();
    }

    /**
     * Modifies a tag
     *
     * @memberof EditTag
     * @param {Object} entity - The entity to modify the tags upon.
     * @param {String} oldTag - The tag to change.
     * @param {String} newTag - The new tag name.  If null, deletes the tag.
     */
    modifyTag(entity, oldTag, newTag) {
        let tags = entity.getFlag(mod, 'tags');

        if (newTag) {
            for (const tag of tags.filter(a => a.tag === oldTag)) {
                tag.tag = newTag;
            }
        } else {
            tags = tags.filter(a => a.tag !== oldTag);
        }
        

        return entity.setFlag(mod, 'tags', tags);
    }

    /**
     * Executes on form submission.
     *
     * @param {Event} event - the form submission event
     * @param {object} data - the form data
     * @memberof EditTag
     */
    async _updateObject(event, data) {
        const _this = this;

        await this.modifyTags(this.original, data.tag);

        if (_this.data.object.onsubmit) {
            _this.data.object.onsubmit();
        }
    }
}