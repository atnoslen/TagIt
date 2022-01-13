import { Settings, mod } from "./settings.js";

export class TagItInput {
    /**
     * Adds a tag to the current FormApplication
     *
     * @param {String} tag - The tag to be added
     * @param {Object.<string, Object>} [options={updateAutocomplete=true}] - Options
     */
     static addtag(tag, form, options) {
        const defaults = {
            updateAutocomplete: true,
            readonly: false,
            onUpdate: null,
            onAddTag: null,
            onRemoveTag: null
        };
        options = $.extend({}, defaults, options || {});

        if (!tag) {
            tag = { tag: $.trim($(`#taginput${form.appId}`, form.element).val()) };
        }
    
        if (tag) {
            const collection = $('div.tagit.input div.tag.collection', form.element);

            if ($('span.tagit.tag', collection).filter(function () {
                const span = TagItInput.spanToTagLowerCase($(this));
                return span.tag === tag.tag.toLowerCase() && span.value === tag.value;
            }).length > 0) {
                // Tag already exists.
                console.log(`TagIt: Tag '${TagItInput.tagToText(tag)}' already exists on document.`)
                return;
            }
            
            // Add to collection
            collection.append(TagItInput.tagToSpan(tag, form, options));

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

    static spanToTag(span) {
        return TagItInput.textToTag($(span).text());
    }

    static spanToTagLowerCase(span) {
        return TagItInput.textToTagLowerCase($(span).text());
    }

    static spanToTextLowerCase(span) {
        return TagItInput.textToTagLowerCase($(span).text()).tag;
    }

    static textToTag(text) {
        const num = text.split(':');
        if (num.length > 2) { throw "Invalid tag." };

        return (num.length == 2) ? { tag: num[0], value: num[1] } : { tag: num[0] };
    }

    static textToTagLowerCase(text) {
        const num = text.split(':');

        return (num.length > 1) ? { tag: num[0].toLowerCase(), value: num[1] } : { tag: num[0].toLowerCase() };
    }

    static tagToSpan(tag, form, options) {
        const text = (tag.value) ? `${tag.tag}:${tag.value}` : `${tag.tag}`;

        const ele = $('<span>')
        .addClass('tagit')
        .addClass('tag')
        .text(text);

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

        return ele;
    }

    static tagToText(tag) {
        return (tag.value) ? `${tag.tag}:${tag.value}` : `${tag.tag}`;
    }

    /**
     * Updates the autocomplete to only include unused tags.
     * 
     */
    static calculateAutocompleteList(form) {
        const collection = $('div.tagit.input div.tag.collection', form.element);

        const tags = $('span.tag', collection).map(function() {
            return TagItInput.spanToTextLowerCase(this);
        }).get();
    
        const dataList = $(`datalist#tagcache${form.appId}`, form.element);
        dataList.empty();
    
        $.each(form.tagcache.filter(a => !tags.includes(a.toLowerCase())), function (index, value) {
            dataList.append($('<option>').val(value));
        });
    }

    static registerListeners(form, options) {
        const defaults = {
            updateAutocomplete: true,
            readonly: false,
            onUpdate: null,
            onAddTag: null,
            onRemoveTag: null
        };
        options = $.extend({}, defaults, options || {});

        $(`#taginput${form.appId}`, form.element).on('input', function (event) {
            if(!(event.originalEvent instanceof InputEvent) || event.originalEvent.inputType === 'insertReplacementText') {
                // Selected a tag from dropdown

                TagItInput.addtag(TagItInput.textToTag(this.value), form, {
                    onUpdate: options.onUpdate,
                    onAddTag: options.onAddTag
                });
            }
        });
    
        $(`#taginput${form.appId}`, form.element).on('keypress', function(event) {
            if (event.keyCode === 13) {
                event.preventDefault();

                TagItInput.addtag(TagItInput.textToTag($(`#taginput${form.appId}`, form.element).val()), form, {
                    onUpdate: options.onUpdate,
                    onAddTag: options.onAddTag
                });
            }
        });
    }
}