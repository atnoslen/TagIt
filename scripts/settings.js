import { RemoveForm } from './remove.js';
import { SettingsForm } from './settingsForm.js';

export const modName = 'TagIt!';
export const mod = 'tagit';

/**
 * Provides functionality for interaction with module settings
 *
 * @export
 * @class Settings
 */
export class Settings {

    /**
     * Registers all of the necessary game settings for the module
     *
     * @static
     * @memberof Settings
     */
    static registerSettings() {
        game.settings.register(mod, 'defaultColor', {
            name: "Default Tag Color",
            scope: "world",
            config: false,
            default: {tag: "#8c0000", text: "#ffffff"},
            type: Object
        })
        game.settings.registerMenu(mod, 'settingsMenu', {
            name: "Update Tags",
            label: "Modify",
            hint: "Allow modifying and removing tags throughout system.",
            icon: "fas fa-wrench",
            type: SettingsForm,
            restricted: true
        });

        game.settings.registerMenu(mod, 'removeButton', {
            name: "Remove all tags",
            label: "Remove All",
            hint: "[WARNING] This removes all tags from every entity!",
            icon: "fas fa-trash",
            type: RemoveForm,
            restricted: true
        });
    }
}