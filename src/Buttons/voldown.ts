import { ButtonInteraction } from 'discord.js';
import { Evelyn } from '../structures/Evelyn.js';
import { Buttons } from '../Interfaces/interfaces.js';
import { MusicUtils } from '../Modules/Utils/musicUtils.js';

const button: Buttons = {
	id: 'voldown',
	async execute(interaction: ButtonInteraction, client: Evelyn) {
		const { guildId } = interaction;

		const player = client.manager.players.get(guildId);
		const musicUtils = new MusicUtils(interaction, player);
		const volume = player.volume - 10;

		await interaction.deferReply();

		if (musicUtils.check(['voiceCheck'])) return;

		return musicUtils.setVolume(volume);
	},
};

export default button;