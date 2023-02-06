# wechaty-guess-song

A Wechaty plugin to play guess song game in a room.

## Usage

```js
var { Wechaty, FileBox } = require('wechaty');
var WechatyGuessSongPlugin = require('wechaty-guess-song');
var fs = require('fs');
var bot = new Wechaty();
bot.use(
	WechatyGuessSongPlugin({
		filter: [{ topic: "干饭群" }, { topic: /^都是老师/ }],
		fetch: () => {
			if (!fs.existsSync('/home/ubuntu/song/夜空中最亮的星.slk')) throw "没有歌曲";
			var fileBox = FileBox.fromFile('/home/ubuntu/song/夜空中最亮的星.slk');
			fileBox.mimeType = "audio/silk";
			fileBox.metadata = { voiceLength: 3000 };
			return { title: "夜空中最亮的星", preview: fileBox  };
		},
		voteMin: 4,
		voteTimeout: 60 * 1000,
		answerTimeout: 60 * 1000
	})
);
```
