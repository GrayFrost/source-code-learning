# 源码解读之旅|第一站（ora）

## 前言
Hello，大家好。这是我在社区的第一篇文章。之前一直思考应该写什么类型的文章，是写面试题、源码解读、新颖技术，亦或是算法解答、项目难点等，思来想去，最终选择了源码解读这个方向。
在最开始的时候，我没有选择诸如React、Vue这些热门的库的源码进行解读，而是选择了一些我们常使用，小而精简的库。因为万事开头难，我觉的自己并不是那种有毅力一上来就挑战高难度任务的人，如果能够坚持下去，后去肯定会去解读。废话不多说，让我们起航吧。

## WHAT

[ora](https://github.com/sindresorhus/ora)是一款优雅的终端加载动画效果。

如果你是Vue的拥趸，那在使用vue-cli来创建项目时，一定注意到了这个spin动画效果。没错，vue-cli便是引用了ora。

### 安装

``` shell
npm install ora
```

### 使用

``` javascript
const ora = require('ora');

const spinner = ora('Loading unicorns').start();

setTimeout(() => {
	spinner.color = 'yellow';
	spinner.text = 'Loading rainbows';
}, 1000);
```

安装和使用的例子均出自官网，更多Api详情也请查阅[官网](https://github.com/sindresorhus/ora)，教人使用并不是本篇文章的目的，就此略过。

## WHY

**Tip**:文章核心在此，节省时间的同学可以忽略其他部分。

本次解读版本：5.3.0。

### 目录结构

```
.
├── example.js
├── index.d.ts
├── index.js
├── index.test-d.ts
├── license
├── package.json
├── readme.md
├── screenshot-2.gif
├── screenshot-spinner.gif
├── screenshot.json
├── screenshot.svg
└── test.js
```

我们直接进入`index.js`。只有一个文件，我们的旅程轻松了不少。把主要函数缩起，可以看到整体结构如下：

``` javascript
'use strict';
const readline = require('readline');
const chalk = require('chalk');
const cliCursor = require('cli-cursor');
const cliSpinners = require('cli-spinners');
const logSymbols = require('log-symbols');
const stripAnsi = require('strip-ansi');
const wcwidth = require('wcwidth');
const isInteractive = require('is-interactive');
const {BufferListStream} = require('bl');

const TEXT = Symbol('text');
const PREFIX_TEXT = Symbol('prefixText');

const ASCII_ETX_CODE = 0x03; // Ctrl+C emits this code

const terminalSupportsUnicode = () => {}

class StdinDiscarder {}

let stdinDiscarder;

class Ora {}

const oraFactory = function (options) {
	return new Ora(options);
};

module.exports = oraFactory;
module.exports.promise = (action, options) => {}
```



### 引用包

首先我们先简单了解下引用的各个包的作用。

``` javascript
const readline = require('readline'); // node的内置模块，逐行读取
const chalk = require('chalk'); // 
const cliCursor = require('cli-cursor'); // ora作者提供的工具，终端光标相关，可以不关注
const cliSpinners = require('cli-spinners'); // ora作者提供的工具，spinner显示内容的配置，下文会列出配置的格式
const logSymbols = require('log-symbols'); // // info|success|warning|error配合chalk组成的颜色字体集合，做了系统间的兼容
const stripAnsi = require('strip-ansi'); // 移除字符串中的ansi编码字符
const wcwidth = require('wcwidth'); // 处理宽字节
const isInteractive = require('is-interactive'); // 检查输出流是否是可交互终端生成
const {BufferListStream} = require('bl'); // buffer收集器
```



cliCursor会读取写好的配置，我们看看配置中的格式是怎么样的。记住这个格式，因为我们似乎掌握核心了。

``` json
"dots": {
		"interval": 80,
		"frames": [
			"⠋",
			"⠙",
			"⠹",
			"⠸",
			"⠼",
			"⠴",
			"⠦",
			"⠧",
			"⠇",
			"⠏"
		]
	},
```



### 解读

来到第17行的函数`terminalSupportsUnicode`。

``` javascript
const terminalSupportsUnicode = () => (
	process.platform !== 'win32' ||
	process.env.TERM_PROGRAM === 'vscode' ||
	Boolean(process.env.WT_SESSION)
);
```

很明显是判断终端是否支持unicode的方法。



## 总结

生活无处不惊喜，代码亦如此，多驻足一下啦！我们下期再见。

## 参考