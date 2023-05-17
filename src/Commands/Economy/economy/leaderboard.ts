import { EcoUtils } from '../../../Modules/Utils/economyUtils';
import { Subcommand } from '../../../interfaces/interfaces';
import { ChatInputCommandInteraction } from 'discord.js';
import { Evelyn } from '../../../structures/Evelyn';

const subCommand: Subcommand = {
	subCommand: 'economy.leaderboard',
	async execute(interaction: ChatInputCommandInteraction, client: Evelyn) {
		const utils = new EcoUtils(interaction, client);
		await interaction.deferReply();
		return utils.leaderboard();
	},
};

export default subCommand;