import { Settings, mod } from "./settings.js";
import { TagItSearch } from './search.js';

export class TagItInput {
    /**
     * Adds a tag to the current FormApplication
     *
     * @param {String} tag - The tag to be added
     * @param {Object.<string, Object>} [options={updateAutocomplete=true}] - Options
     */
     static async addtag(tag, form, options) {
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

        if (TagItSearch.reservedTokens.includes(tag.tag.toLowerCase())) {
            throw "Invalid tag - Reserved Token"
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
            collection.append(await TagItInput.tagToSpan(tag, form, options));

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
        const tag = TagItInput.textToTag($(span).text());

        function rgb2hex(orig){
            var rgb = orig.replace(/\s/g,'').match(/^rgba?\((\d+),(\d+),(\d+)/i);
            return (rgb && rgb.length === 4) ? "#" +
                ("0" + parseInt(rgb[1],10).toString(16)).slice(-2) +
                ("0" + parseInt(rgb[2],10).toString(16)).slice(-2) +
                ("0" + parseInt(rgb[3],10).toString(16)).slice(-2) : orig;
        }

        if ($(span).attr('style')) {
            tag.color = {
                tag: rgb2hex($(span).css('background-color')),
                text: rgb2hex($(span).css('color'))
            }
        }
        return tag;
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

    static async tagToSpan(tag, form, options) {
        const text = (tag.value) ? `${tag.tag}:${tag.value}` : `${tag.tag}`;

        let otherTag = null;
        const otherItems = await TagItSearch.search(tag.tag, {limit:1});
        
        if (otherItems.length > 0) {
            otherTag = otherItems[0].tags.filter(a => a.tag === tag.tag)[0];
        }
        

        const ele = $('<span>')
        .addClass('tagit')
        .addClass('tag')
        .text(text);

        if (otherTag && otherTag.color) {
            $(ele)
            .css({
                'background-color':otherTag.color.tag,
                'border-color':otherTag.color.tag,
                'color':otherTag.color.text
            });
        }

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

        $(`#taginput${form.appId}`, form.element).on('input', async function (event) {
            if(!(event.originalEvent instanceof InputEvent) || event.originalEvent.inputType === 'insertReplacementText') {
                // Selected a tag from dropdown

                TagItInput.addtag(TagItInput.textToTag(this.value), form, {
                    onUpdate: options.onUpdate,
                    onAddTag: options.onAddTag
                });
            }
        });
    
        $(`#taginput${form.appId}`, form.element).on('keypress', async function(event) {
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