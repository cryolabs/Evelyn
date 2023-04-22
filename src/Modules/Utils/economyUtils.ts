import Economy from 'discord-economy-super/mongodb';
import { Evelyn } from '../../structures/Evelyn.js';
import { ChatInputCommandInteraction, EmbedBuilder, User } from 'discord.js';

export class EcoUtils {
	private client: Evelyn;
	private interaction: ChatInputCommandInteraction;
	private embed: EmbedBuilder;
	private economy: Economy<boolean>;

	private userId: string;

	/** Creates a new instance of the Economy Engine class. */
	constructor(interaction: ChatInputCommandInteraction, client: Evelyn) {
		/** The client object. */
		this.client = client;
		/** The interaction object. */
		this.interaction = interaction;
		/** The base embed used for keeping away from repeated code. */
		this.embed = new EmbedBuilder().setColor('Blurple').setTimestamp();
		/** The economy object. */
		this.economy = this.client.economy;

		/** The user's id. */
		this.userId = this.interaction.user.id;
	}

	/** Fetches the user. */
	private fetchUser() {
		const user = this.economy.cache.users.get({
			memberID: this.userId,
			guildID: 'global',
		});

		return user;
	}

	/** Fetches the provided user. */
	fetchTarget(target: User) {
		const { id } = target;

		const fetchedTarget = this.economy.cache.users.get({
			memberID: id,
			guildID: 'global',
		});

		return fetchedTarget;
	}

	/** Fetches the user cache from the Discord.js Client. */
	private getUser(userID: string): User {
		const getUser = this.client.users.cache.get(userID) as User;
		return getUser;
	}

	/** Fetches the guild cache. */
	private getGuild() {
		const fetchGuild = this.economy.cache.guilds.get({
			guildID: 'global',
		});

		return fetchGuild;
	}

	/** Fetches your purchase history. */
	private getHistory() {
		const ecoHistory =
			this.economy.cache.history.get({
				memberID: this.userId,
				guildID: 'global',
			}) || [];

		return ecoHistory;
	}

	/** Fetches the global shop. */
	private getShop() {
		const ecoHistory =
			this.economy.cache.shop.get({
				guildID: 'global',
			}) || [];

		return ecoHistory;
	}

	/** Fetches your inventory. */
	private getInventory() {
		const ecoHistory =
			this.economy.cache.inventory.get({
				memberID: this.userId,
				guildID: 'global',
			}) || [];

		return ecoHistory;
	}

	/** Collects the daily reward. */
	public async collectDaily() {
		const ecoUser = this.fetchUser();
		const dailyResult = await ecoUser.rewards.getDaily<false>();

		if (!dailyResult.claimed) {
			const cooldownTime = dailyResult.cooldown.time;

			const cooldownTimeString =
				`${cooldownTime.days ? `**${cooldownTime.days}** days, ` : ''}` +
				`${
					cooldownTime.days || cooldownTime.hours
						? `**${cooldownTime.hours}** hours, `
						: ''
				}` +
				`${
					cooldownTime.hours || cooldownTime.minutes
						? `**${cooldownTime.minutes}** minutes, `
						: ''
				}` +
				`**${cooldownTime.seconds}** seconds`;

			return this.interaction.editReply({
				embeds: [
					this.embed.setDescription(
						`🔹 | ${ecoUser}, you can claim your daily reward in ${cooldownTimeString}!`,
					),
				],
			});
		}

		return this.interaction.editReply({
			embeds: [
				this.embed.setDescription(
					`🔹 | ${dailyResult.reward} SC have been added to your account!`,
				),
			],
		});
	}

	/** Pulls the balance and shows it to the user in an embed. */
	public async balance(target: User) {
		console.log(target);
		const fetchTarget = this.fetchTarget(target);
		const member = target || this.getUser(target.id);
		const economyUser = member ? fetchTarget : null;

		const [balance, bank] = [
			await fetchTarget.balance.get(),
			await fetchTarget.bank.get(),
		];

		const userName = this.getUser(economyUser.id);

		return this.interaction.editReply({
			embeds: [
				this.embed.setDescription(
					`**${userName}'s Wallet**\n
            **Runner Coins:** ${balance || 0}\n**Stored Runner Coins:** ${
	bank || 0
}`,
				),
			],
		});
	}

	/** Deposits coins to your EdgeBank account. */
	public async deposit(amount: number) {
		const ecoUser = this.fetchUser();
		const userBalance = await ecoUser.balance.get();

		if (userBalance < amount ?? !userBalance) {
			return this.interaction.editReply({
				embeds: [
					this.embed.setDescription(
						'🔹 | The amount you provided exceeds or is below the amount of coins you have.',
					),
				],
			});
		}

		await ecoUser.balance.subtract(amount, `deposited ${amount} SC.`);
		await ecoUser.bank.add(amount, `deposited ${amount} SC.`);

		return this.interaction.editReply({
			embeds: [
				this.embed.setDescription(
					`🔹 | ${amount} SC has been deposited to your EdgeBank account!`,
				),
			],
		});
	}

	/** Shows your purchase history. */
	public history() {
		const ecoHistory = this.getHistory();
		const userHistory = ecoHistory.filter((item) => !item.custom.hidden);

		if (!userHistory.length) {
			return this.interaction.editReply({
				embeds: [
					this.embed.setDescription('🔹 | You haven\'t purchased any items.'),
				],
			});
		}

		return this.interaction.editReply({
			embeds: [
				this.embed
					.setTitle(`${this.interaction.user.username}'s Purchase History`)
					.setDescription(
						userHistory
							.map(
								(item) =>
									`**x${item.quantity} ${item.custom.emoji} ${item.name}** - ` +
									`**${item.price}** coins (**${item.date}**)`,
							)
							.join('\n'),
					),
			],
		});
	}

	/** Shows the richest users of a specific server. */
	public async leaderboard() {
		const ecoGuild = this.getGuild();
		const rawLB = await ecoGuild.leaderboards.money();
		const leaderboard = rawLB
			.filter((lb) => !this.getUser(lb.userID)?.bot)
			.filter((lb) => !!lb.money);

		if (!leaderboard.length) {
			return this.interaction.editReply({
				embeds: [
					this.embed.setDescription(
						'🔹 | There are no users on the leaderboard.',
					),
				],
			});
		}

		return this.interaction.editReply({
			embeds: [
				this.embed
					.setTitle(`${this.interaction.guild.name} | Money Leaderboard`)
					.setDescription(
						`${leaderboard
							.map(
								(lb, index) =>
									`${index + 1} - <@${lb.userID}> - **${lb.money}** RC`,
							)
							.join('\n')}`,
					),
			],
		});
	}

	/** Shows your inventory. */
	public inventory() {
		const userInventory = this.getInventory();
		const filterInventory = userInventory.filter((item) => !item.custom.hidden);
		const globalShop = this.getShop();

		if (filterInventory.length)
			return this.interaction.editReply({
				embeds: [this.embed.setDescription('🔹 | You don\'t have any items.')],
			});

		const cleanInventory = [
			...new Set(filterInventory.map((item) => item.name)),
		]
			.map((itemName) =>
				globalShop.find((shopItem) => shopItem.name == itemName),
			)
			.map((item) => {
				const quantity = filterInventory.filter(
					(invItem) => invItem.name == item.name,
				).length;

				return {
					quantity,
					totalPrice: item.price * quantity,
					item,
				};
			});

		console.log(cleanInventory);

		return this.interaction.editReply({
			embeds: [
				this.embed
					.setTitle(`${this.interaction.user.username}'s Inventory`)
					.setDescription(
						`${cleanInventory.map(
							(data, index) =>
								`${index + 1} - **x${data.quantity} ${
									data.item.custom.emoji
								} ` +
								`${data.item.name}** (ID: **${data.item.name}**) ` +
								`for **${data.totalPrice}** coins`,
						)}`,
					),
			],
		});
	}

	/** Adds the weekly amount to your account. */
	public async weekly() {
		const ecoUser = this.fetchUser();
		const weeklyResult = await ecoUser.rewards.getWeekly();

		if (weeklyResult.cooldown) {
			const cooldownTime = weeklyResult.cooldown.time;
			let cooldownTimeString = '';

			if (cooldownTime.days) {
				cooldownTimeString += `**${cooldownTime.days}** days,`;
			}
			if (cooldownTime.days || cooldownTime.hours) {
				cooldownTimeString += `**${cooldownTime.hours}** hours, `;
			}

			if (cooldownTime.hours || cooldownTime.minutes) {
				cooldownTimeString += `**${cooldownTime.minutes}** minutes, `;
			}

			cooldownTimeString += `**${cooldownTime.seconds}** seconds`;

			return this.interaction.editReply({
				embeds: [
					this.embed.setDescription(
						`🔹 | ${this.interaction.user}, you can claim your daily reward in ${cooldownTimeString}!`,
					),
				],
			});
		}

		return this.interaction.editReply({
			embeds: [
				this.embed.setDescription(
					`🔹 | ${weeklyResult.reward} RC has been added to your account!`,
				),
			],
		});
	}

	/** Transfers money to another user. */
	public async transfer(target: User, amount: number) {
		const ecoUser = this.fetchUser();
		const providedTarget = this.fetchTarget(target);

		const senderBalance = await ecoUser.balance.get();

		if (senderBalance < amount) {
			return this.interaction.editReply({
				embeds: [
					this.embed.setDescription(
						'🔹 | The amount you provided exceeds the amount of coins you have.',
					),
				],
			});
		}

		const transferringResult = await providedTarget.balance.transfer({
			amount: amount,
			senderMemberID: this.interaction.user.id,
			sendingReason: `Transfered ${amount} RC to ${
				this.getUser(providedTarget.id).tag
			}.`,
			receivingReason: `Received ${amount} RC from ${this.interaction.user.tag}.`,
		});

		return this.interaction.editReply({
			embeds: [
				this.embed.setDescription(
					`🔹 | Transaction completed. You have successfully transferred **${
						transferringResult.amount
					}** RC to ${await this.getUser(providedTarget.id)}.`,
				),
			],
		});
	}

	/** Withdraws an amount of money from your ShadowBank Virtual CC. */
	public async withdraw(amount: number) {
		const ecoUser = this.fetchUser();
		const userBalance = await ecoUser.bank.get();

		if (userBalance < amount || !userBalance) {
			return this.interaction.editReply({
				embeds: [
					this.embed.setDescription(
						'🔹 | The amount you provided exceeds or is below the amount of coins you have.',
					),
				],
			});
		}

		await ecoUser.balance.subtract(amount, `deposited ${amount} RC.`);
		await ecoUser.bank.add(amount, `deposited ${amount} RC.`);

		return this.interaction.editReply({
			embeds: [
				this.embed.setDescription(
					`🔹 | ${amount} RC has been withdrawn from your EdgeBank account!`,
				),
			],
		});
	}

	/** Works and puts a nice amount of SC into your wallet. */
	public async work() {
		const ecoUser = this.fetchUser();
		const workResult = await ecoUser.rewards.getWork();

		if (workResult.cooldown) {
			const cooldownTime = workResult.cooldown.time;
			let cooldownTimeString = '';

			if (cooldownTime.days) {
				cooldownTimeString += `**${cooldownTime.days}** days,`;
			}
			if (cooldownTime.days || cooldownTime.hours) {
				cooldownTimeString += `**${cooldownTime.hours}** hours, `;
			}

			if (cooldownTime.hours || cooldownTime.minutes) {
				cooldownTimeString += `**${cooldownTime.minutes}** minutes, `;
			}

			cooldownTimeString += `**${cooldownTime.seconds}** seconds`;

			return this.interaction.editReply({
				embeds: [
					this.embed.setDescription(
						`🔹 | ${this.interaction.user}, you can work again in ${cooldownTimeString}!`,
					),
				],
			});
		}

		return this.interaction.editReply({
			embeds: [
				this.embed.setDescription(
					`🔹 | You ran a Time Trial in Edge City and not only did you get 1st place but you also got paid ${workResult.reward} RC for your amazing performance.`,
				),
			],
		});
	}
}
