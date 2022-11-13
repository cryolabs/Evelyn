const { ChatInputCommandInteraction, EmbedBuilder } = require("discord.js");
const userBlacklist = require("../../../structures/schemas/userBlacklist.js");

module.exports = {
  subCommand: "blacklist.user",
  /**
   * @param {ChatInputCommandInteraction} interaction,
   */
  async execute(interaction) {
    const { options } = interaction;
    const userId = options.getString("userid");
    const blacklist_reason = options.getString("reason");
    const data = await userBlacklist.findOne({ userID: userId });

    if (!data) {
      const newBlacklist = new userBlacklist({
        userID: userId,
        reason: blacklist_reason,
        time: Date.now(),
      });

      await newBlacklist.save();

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Blurple")
            .setTitle("Evelyn | Blacklist")
            .setDescription("This user has been successfully blacklisted.")
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
            .setDescription("🔹 | This user is already blacklisted.")
            .setTimestamp(),
        ],
      });
    }
  },
};
