import { Settings, mod } from "./settings.js";

export class TagItInput {
    /**
     * Adds a tag to the current FormApplication
     *
     * @param {String} tag - The tag to be added
     * @param {Object.<string, Object>} [options={updateAutocomplete=true}] - Options
     */
     static addtag(form, options) {
        const defaults = {
            updateAutocomplete: true,
            readonly: false,
            onUpdate: null,
            onAddTag: null,
            onRemoveTag: null
        };
        options = $.extend({}, defaults, options || {});

        const tag = $.trim($(`#taginput${form.appId}`, form.element).val());
    
        if (tag) {
            const collection = $('div.tagit.input div.tag.collection', form.element);
            const tags = $('span.tagit.tag', collection).filter(function() {
                return $(this).text().toLocaleLowerCase() === tag.toLocaleLowerCase();
            });

            if (tags.length > 0) {
                // Tag already exists.
                return;
            }
    
            const ele = $('<span>')
            .addClass('tagit')
            .addClass('tag')
            .text(tag);

            if (options.readonly === false) {
                $(ele).append(
                    $('<i>')
                    .addClass('fas')
                    .addClass('fa-times-circle')
                    .on('click', function(e) {
                        $(this).parent().remove();
                        TagItInput.calculateAutocompleteList(form);
                        if (options.onRemoveTag) {
                            options.onRemoveTag();
                        }
                        if (options.onUpdate) {
                            options.onUpdate();
                        }
                    })
                );
            }
            
            // Add to collection
            collection.append(ele);

            // Clear the input
            $(`#taginput${form.appId}`, form.element).val('');

            // Run update Autocomplete?
            if (options.updateAutocomplete) {
                TagItInput.calculateAutocompleteList(form);
            }

            if (options.onAddTag) {
                options.onAddTag();
            }
            if (options.onUpdate) {
                options.onUpdate();
            }
        }
    }

    /**
     * Updates the autocomplete to only include unused tags.
     * 
     */
    static calculateAutocompleteList(form) {
        const collection = $('div.tagit.input div.tag.collection', form.element);

        const tags = $('span.tag', collection).map(function() {
            return $(this).text();
        }).get();
    
        const dataList = $(`datalist#tagcache${form.appId}`, form.element);
        dataList.empty();
    
        $.each(form.tagcache.filter(a => !tags.includes(a)), function (index, value) {
            dataList.append($('<option>').val(value));
        });
    }

    static registerListeners(form, options) {
        $(`#taginput${form.appId}`, form.element).on('input', function (event) {
            if(!(event.originalEvent instanceof InputEvent) || event.originalEvent.inputType === 'insertReplacementText') {
                // Selected a tag from dropdown

                TagItInput.addtag(form, {
                    onUpdate: options.onUpdate,
                    onAddTag: options.onAddTag
                });
            }
        });
    
        $(`#taginput${form.appId}`, form.element).on('keypress', function(event) {
            if (event.keyCode === 13) {
                event.preventDefault();

                TagItInput.addtag(form, {
                    onUpdate: options.onUpdate,
                    onAddTag: options.onAddTag
                });
            }
        });
    }
}