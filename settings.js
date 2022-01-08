import { SettingsForm } from './settingsForm.js';

export const modName = 'TagIt!';
const mod = 'tagit';

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
        game.settings.register(mod, "tags", {
            scope: "world",
            config: false,
            type: Array,
            default: []
        });

        game.settings.registerMenu(mod, 'settingsMenu', {
            name: "Cache",
            label: "Modify",
            icon: "fas fa-wrench",
            type: SettingsForm,
            restricted: true
        });
    }
}