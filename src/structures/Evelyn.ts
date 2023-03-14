import { Client, Collection, GatewayIntentBits, Partials } from 'discord.js';
import Statcord from 'statcord.js';
import Economy from 'discord-economy-super/mongodb';
import { Manager } from '@shadowrunners/automata';

import { botConfig, Command, Subcommand, Event, Buttons, Modals } from "../interfaces/interfaces"

import { loadEco } from './handlers/economy.js';
import { loadEvents } from './handlers/events.js';
import { loadStats } from './handlers/statcord.js';
import { loadButtons } from './handlers/buttons.js';
import { loadMusic } from './handlers/automata.js';
import { loadModals } from './handlers/modals.js';
//import { crashReporter } from '../functions/crashReport';

const {
	Guilds,
	GuildMessages,
	GuildBans,
	GuildMembers,
	GuildEmojisAndStickers,
	GuildMessageReactions,
	GuildInvites,
	GuildVoiceStates,
	MessageContent,
} = GatewayIntentBits;
const { User, Message, Channel, GuildMember, ThreadMember } = Partials;

export class Evelyn extends Client {
	public config: botConfig;
	public commands: Collection<string, Command>;
	public subCommands: Collection<string, Subcommand>;
	public events: Map<string, Event>;
	public buttons: Collection<string, Buttons>;
	public modals: Collection<string, Modals>;
	public economy: Economy<boolean>;
	public statcord: Statcord.Client;
	public manager: Manager;
	public client: any;

	constructor() {
		super({
			intents: [
				Guilds,
				GuildBans,
				GuildInvites,
				GuildMembers,
				GuildMessages,
				GuildVoiceStates,
				GuildMessageReactions,
				GuildEmojisAndStickers,
				MessageContent,
			],
			partials: [User, Message, Channel, GuildMember, ThreadMember],
		});

		this.config = require('./config.json');
		this.commands = new Collection();
		this.subCommands = new Collection();
		this.events = new Collection();
		this.buttons = new Collection();
		this.modals = new Collection();
		this.economy = new Economy({
			connection: {
				connectionURI: this.config.database,
				collectionName: 'economy',
				dbName: 'test',
			},
			dailyAmount: 80,
			workAmount: [60, 100],
			weeklyAmount: 300,
		});

		this.statcord = new Statcord.Client({
			client: this,
			key: this.config.debug.statKey,
			postCpuStatistics: true,
			postMemStatistics: true,
			postNetworkStatistics: true,
		});

		this.manager = new Manager(this, this.config.music.nodes, {
			reconnectTimeout: 10000,
			resumeKey: 'youshallresume',
			resumeTimeout: 5000,
			defaultPlatform: 'dzsearch',
		});

		this.client = this;

		loadEco(this);
		loadStats(this);
		loadEvents(this);
		loadModals(this);
		loadButtons(this);
		loadMusic(this);

		// process.on('unhandledRejection', (err) => crashReporter(client, err));
		process.on('unhandledRejection', (err) => console.log(err));
		process.on('unhandledException', (err) => console.log(err));
	}
}