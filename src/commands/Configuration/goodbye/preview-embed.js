const { ChatInputCommandInteraction, EmbedBuilder } = require("discord.js");
const { replacePlaceholders } = require("../../../functions/replacePlaceholders.js");
const GDB = require('../../../structures/schemas/guild.js');

module.exports = {
    subCommand: "goodbye.preview-embed",
    /**
     * @param {ChatInputCommandInteraction} interaction 
     */
    async execute(interaction) {
        const { options, guildId, member } = interaction;
        const channel = options.getChannel("channel");
        const data = await GDB.findOne({ id: guildId });

        const nEmbed = new EmbedBuilder().setColor("Blurple");

        const embed = data.goodbye.embed;
        const welcomeEmbed = new EmbedBuilder();
        const content = data.goodbye.embed.messagecontent;
        const welcomeMessage = replacePlaceholders(content, member);

        if (embed.color) {
            const hexCodeRegex = /^#[0-9A-Fa-f]{6}$/;
            if (hexCodeRegex.test(embed.color)) welcomeEmbed.setColor(embed.color);
        };

        if (embed.title) welcomeEmbed.setTitle(embed.title);

        if (embed.description) {
            const textEmbed = replacePlaceholders(embed.description, member);
            welcomeEmbed.setDescription(textEmbed || "Undefined");
        };

        if (embed.author) {
            welcomeEmbed.setAuthor({
                name: authorName || "Undefined",
                iconURL: embed.author.icon_url
            });
        };

        if (embed.footer)
            welcomeEmbed.setFooter({
                text: embed.footer.text || "Undefined",
                iconURL: embed.footer.icon_url,
            });

        if (embed.image?.url) welcomeEmbed.setImage(embed.image?.url);
        if (embed.thumbnail?.url) welcomeEmbed.setThumbnail(embed.thumbnail.url);

        if (content) {
            channel.send({
                content: welcomeMessage,
                embeds: [welcomeEmbed],
            });
        } else {
            channel.send({
                embeds: [welcomeEmbed],
            });
        }

        return interaction.reply({
            embeds: [nEmbed.setDescription(`🔹 | Preview has been sent to <#${channel.id}>.`)],
            ephemeral: true
        });
    },
};