import {
	ApplicationCommandOptionType,
	ChatInputCommandInteraction,
	StringSelectMenuBuilder,
	PermissionFlagsBits,
	ActionRowBuilder,
	EmbedBuilder,
	TextChannel,
	ChannelType,
	Emoji,
	Role,
} from 'discord.js';
import { Discord, On, Slash, SlashGroup, SlashOption } from 'discordx';
import { RRoles as DB } from '../../Schemas/roles.js';

const { Administrator } = PermissionFlagsBits;
const { GuildText } = ChannelType;

@Discord()
@SlashGroup({
	name: 'roles',
	description: 'Manage and configure roles.',
})
@SlashGroup('roles')
export class Roles {
	@Slash({
		name: 'addrole',
		description: 'Adds a role to the dropdown menu of the roles panel.',
		defaultMemberPermissions: Administrator,
	})
	async addrole(
		@SlashOption({
			name: 'panel',
			description: 'Provide the name of the panel this role belongs to.',
			type: ApplicationCommandOptionType.String,
			required: true,
		})
		@SlashOption({
			name: 'role',
			description: 'Provide a role.',
			type: ApplicationCommandOptionType.Role,
			required: true,
		})
		@SlashOption({
			name: 'description',
			description: 'Provide a description for the role.',
			type: ApplicationCommandOptionType.String,
			required: true,
		})
		@SlashOption({
			name: 'emoji',
			description: 'Provide an emoji for the role.',
			type: ApplicationCommandOptionType.String,
			required: true,
		})
			panel: string,
			role: Role,
			description: string,
			emoji: Emoji,
			interaction: ChatInputCommandInteraction,
	) {
		const { guildId, guild } = interaction;
		const embed = new EmbedBuilder().setColor('Blurple');

		const rData = await DB.findOne({ id: guildId, panelName: panel });
		const { roleArray } = rData;

		if (role.position >= guild.members.me.roles.highest.position)
			return interaction.reply({
				embeds: [
					embed.setDescription(
						'🔹 | I can\'t assign a role that\'s higher or equal than mine.',
					),
				],
				ephemeral: true,
			});

		if (roleArray.some((r) => r.roleId === role.id))
			return interaction.reply({
				embeds: [
					embed.setDescription(
						'🔹 | This role has already been added to the panel.',
					),
				],
			});

		if (rData.roleArray.length >= 10)
			return interaction.reply({
				embeds: [embed.setDescription('🔹 | A panel can only have 10 roles.')],
				ephemeral: true,
			});

		await DB.findOneAndUpdate(
			{
				id: guildId,
				panelName: panel,
			},
			{
				$push: {
					roleArray: {
						roleId: role.id,
						description,
						emoji,
					},
				},
			},
		);

		return interaction.reply({
			embeds: [
				embed.setDescription(
					`🔹 | ${role.name} has been added to the roles panel. If you have already sent out the panel, you will need to re-send it in order for it to update.`,
				),
			],
			ephemeral: true,
		});
	}

	@Slash({
		name: 'removerole',
		description: 'Removes a role from the dropdown menu of the roles panel.',
	})
	async removerole(
		@SlashOption({
			name: 'role',
			description: 'Provide a role.',
			type: ApplicationCommandOptionType.Role,
			required: true,
		})
			role: Role,
			interaction: ChatInputCommandInteraction,
	) {
		const { guildId } = interaction;
		const embed = new EmbedBuilder().setColor('Blurple');
		const data = await DB.findOne({ id: guildId });

		const findRole = data.roleArray.find((r) => r.roleId === role.id);

		if (!findRole)
			return interaction.reply({
				embeds: [
					embed.setDescription(
						'🔹 | This role hasn\'t been added to the roles panel.',
					),
				],
				ephemeral: true,
			});

		await DB.findOneAndUpdate(
			{
				id: guildId,
			},
			{
				$pull: {
					roleArray: {
						roleId: role.id,
					},
				},
			},
		);

		return interaction.reply({
			embeds: [
				embed.setDescription(
					`🔹 | ${role.name} has been removed from the roles panel.`,
				),
			],
			ephemeral: true,
		});
	}

	@Slash({
		name: 'newpanel',
		description: 'Creates a new role panel.',
	})
	async newpanel(
		@SlashOption({
			name: 'name',
			description: 'Provide the name of the panel.',
			type: ApplicationCommandOptionType.String,
			required: true,
		})
			name: string,
			interaction: ChatInputCommandInteraction,
	) {
		const { guildId } = interaction;
		const embed = new EmbedBuilder().setColor('Blurple');

		const rData = await DB.findOne({ id: guildId, panelName: name });
		const numberOfPanels = await DB.find({ id: guildId });

		if (rData)
			return interaction.reply({
				embeds: [
					embed.setDescription('🔹 | A panel with this name already exists.'),
				],
				ephemeral: true,
			});

		if (numberOfPanels.length >= 10)
			return interaction.reply({
				embeds: [
					embed.setDescription(
						'🔹 | You can only have 10 reaction role panels.',
					),
				],
				ephemeral: true,
			});

		await DB.create({
			panelName: name,
			id: guildId,
		});

		return interaction.reply({
			embeds: [
				embed.setDescription(
					`🔹 | Your panel ${name} has been created. You can add roles to it via /roles add-role.`,
				),
			],
			ephemeral: true,
		});
	}

	@Slash({
		name: 'sendpanel',
		description: 'Sends the specified Roles panel.',
	})
	async sendpanel(
		@SlashOption({
			name: 'panel',
			description: 'Provide the name of the panel you\'d like to send.',
			type: ApplicationCommandOptionType.String,
			required: true,
		})
		@SlashOption({
			name: 'channel',
			description: 'Provide a channel.',
			type: ApplicationCommandOptionType.Channel,
			channelTypes: [GuildText],
			required: true,
		})
			panel: string,
			channel: TextChannel,
			interaction: ChatInputCommandInteraction,
	) {
		const { guildId, guild } = interaction;
		const embed = new EmbedBuilder().setColor('Blurple').setTimestamp();

		const data = await DB.findOne({ id: guildId, panelName: panel });

		if (panel !== data.panelName || data.roleArray.length > 0)
			return interaction.reply({
				embeds: [
					embed.setDescription('🔹 | The panel you specified does not exist.'),
				],
				ephemeral: true,
			});

		const panelEmbed = new EmbedBuilder()
			.setTitle(`${data.panelName}`)
			.setColor('Blurple');

		const opts = data.roleArray.map((x) => {
			const role = guild.roles.cache.get(x.roleId);

			return {
				label: role.name,
				value: role.id,
				description: x.description,
				emoji: x.emoji || undefined,
			};
		});

		const menuComponents =
			new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
				new StringSelectMenuBuilder()
					.setCustomId('reaction')
					.setPlaceholder(data.panelName)
					.setMinValues(0)
					.setMaxValues(opts.length)
					.addOptions(opts),
			);

		await channel.send({ embeds: [panelEmbed], components: [menuComponents] });
		return interaction.reply({
			content: '🔹 | Succesfully sent your panel.',
			ephemeral: true,
		});
	}

	@Slash({
		name: 'listpanels',
		description: 'Lists all of the panels and their roles.',
	})
	async listpanels(interaction: ChatInputCommandInteraction) {
		const { guildId } = interaction;
		const embed = new EmbedBuilder().setColor('Blurple');
		const data = await DB.find({ id: guildId });

		await interaction.deferReply();

		if (!data) return;

		data.forEach((docs) => {
			const roleArray = docs.roleArray
				.map((role) => {
					return `<@&${role.roleId}>`;
				})
				.join('\n');

			embed.addFields({ name: docs.panelName, value: roleArray });
			return interaction.editReply({ embeds: [embed] });
		});
	}

	// Reaction Panel Handling
	@On({
		event: 'interactionCreate',
	})
	reactionPanels() {
		console.log('Debug fire. It fired.');
	}
}
