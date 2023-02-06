/** @typedef { import("wechaty").Wechaty } Wechaty */
/** @typedef { import("wechaty").Room } Room */
/** @typedef { import("wechaty").Message } Message */
/** @typedef { import("wechaty-puppet").RoomQueryFilter } RoomQueryFilter */
var { MessageType, FileBox } = require("wechaty-puppet");

/**
 * @param {Object} config
 * @param {RoomQueryFilter[]} [config.filter] the filter of rooms to enable this plugin
 * @param {() => Promise<{ title: string, preview: FileBox }>} config.fetch song fetcher
 * @param {number} config.voteMin min vote to start the game
 * @param {number} config.voteTimeout vote timeout in milliseconds
 * @param {number} config.answerTimeout answer timeout in milliseconds
 */
module.exports = function WechatyGuessSongPlugin(config) {
	return function (/** @type {Wechaty} */bot) {
		bot.on("message", listener);
		return () => {
			bot.off("message", listener);
		};
		async function listener(/** @type {Message} */message) {
			var room = message.room();
			if (
				room
				&&
				message.text() == "猜歌曲" && (
					!config.filter || (
						await Promise.all(
							config.filter.map(
								async filter => bot.puppet.roomQueryFilterFactory(filter)(
									await bot.puppet.roomPayload(room.id)
								)
							)
						)
					).some(Boolean)
				)
			)
				play(room);
		}
	};
	async function play(/** @type {Room} */room) {
		/** @type {Set<Contact["id"]>} */
		var vote = new Set();
		await room.say(`猜歌曲比赛即将进行，${config.voteTimeout / 1000}秒内回复\".\"人数>=${config.voteMin}时比赛开始。比赛奖励：红包5元。`);
		room.on('message', voteCounter);
		function voteCounter(/** @type {Message} */message) {
			if (message.text() == '.') {
				vote.add(message.talker().id);
				if (vote.size >= config.voteMin) {
					room.off('message', voteCounter);
					clearTimeout(timer);
					start();
				}
			}
		}
		var timer = setTimeout(async () => {
			room.off('message', voteCounter);
			await room.say("人数不足，我们下次比赛再见。");
		}, config.voteTimeout);
		async function start() {
			await room.say(`人数足够，即将开始比赛，请作好准备，抢答时间只有${config.answerTimeout / 1000}秒。`);
			setTimeout(async () => {
				try {
					var song = await config.fetch();
					await room.say(song.preview);
				}
				catch (/** @type {string} */error) {
					await room.say(error);
					return;
				}
				room.on('message', answerListener);
				var timer = setTimeout(async () => {
					room.off('message', answerListener);
					await room.say("时间到，没有人答对，本次比赛结束。");
					await room.say(`我们下次比赛再见。`);
				}, config.answerTimeout);
				async function answerListener(/** @type {Message} */message) {
					if (message.type() == MessageType.Unknown) return;
					if (message.text() == song.title) {
						room.off('message', answerListener);
						clearTimeout(timer);
						await room.say("回答正确。");
						await room.say(`恭喜${message.talker().name()}赢得了本次比赛。`);
						await room.say(`我们下次比赛再见。`);
					} else
						await message.say("回答错误。");
				}
			}, 5 * 1000);
		}
	}
};
