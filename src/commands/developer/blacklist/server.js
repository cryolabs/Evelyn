const { ChatInputCommandInteraction, EmbedBuilder } = require("discord.js");
const serverBlacklist = require("../../../structures/schemas/serverBlacklist.js");

module.exports = {
  subCommand: "blacklist.server",
  /**
   * @param {ChatInputCommandInteraction} interaction,
   */
  async execute(interaction) {
    const { options } = interaction;
    const guildId = options.getString("serverid");
    const blacklist_reason = options.getString("reason");
    const data = await serverBlacklist.findOne({ serverID: guildId });

    if (!data) {
      const newBlacklist = new serverBlacklist({
        serverID: guildId,
        reason: blacklist_reason,
        time: Date.now(),
      });

      await newBlacklist.save();

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Blurple")
            .setTitle("Evelyn | Blacklist")
            .setDescription("This guild has been successfully blacklisted.")
            .addFields({ name: "🔹 | Reason", value: blacklist_reason })
            .setTimestamp(),
        ],
      });
    } else {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Blurple")
            .setTitle("Evelyn | Blacklist")
            .setDescription("This guild is already blacklisted.")
            .setTimestamp(),
        ],
      });
    }
  },
};
