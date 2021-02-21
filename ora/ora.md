# 源码解读之旅|第一站（ora）

## 前言

Hello，大家好。这是我在社区的第一篇文章。之前一直思考应该写什么类型的文章，是写面试题、源码解读、新颖技术，亦或是算法解答、项目难点等，思来想去，最终选择了源码解读这个方向。  
在最开始的时候，我没有选择诸如React、Vue这些热门的库的源码进行解读，而是选择了一些我们常使用，小而精简的库。因为万事开头难，我觉的自己并不是那种有毅力一上来就挑战高难度任务的人，如果能够坚持下去，后去肯定会去解读。废话不多说，让我们起航吧。

**Tip**：无法事无巨细，只解读核心功能。

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
const chalk = require('chalk'); // 修改终端输出字符样式的npm包
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
{
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
}
```



### 解读

我们找到入口392行：

``` javascript
const oraFactory = function (options) {
	return new Ora(options);
};

module.exports = oraFactory;
module.exports.promise = (action, options) => {} // 对应api中的ora.promise(action, options)的实现，略过
```

这里使用了工厂模式。    

接着解读核心Ora类

``` javascript
class Ora {
  constructor(options){}
  get indent(){}
  set indent(indent = 0){}
  _updateInterval(interval){}
  get spinner(){}
  set spinner(spinner){}
  get text(){}
  set text(){}
  get prefixText(){}
  set prefixText(value){}
  get isSpinning(){}
  getFullPrefixText(prefixText = this[PREFIX_TEXT], postfix = ' '){}
  updateLineCount(){}
  get isEnabled(){}
  set isEnabled(value){}
  get isSilent(){}
  set isSilent(value){}
  frame(){}
  clear(){}
  render(){}
  start(text){}
  stop(){}
  succeed(text){}
  fail(text){}
  warn(text){}
  info(text){}
  stopAndPersist(options = {}){}
}
```

根据官网的使用例子，我们要走完一个简单的使用流程，只要调用实例的start方法即可。根据这个提示，我们主要探寻Ora类中的`constructor`、`start`、`stop`这几个方法及它们所关联的方法，剩余的api我们无需过多探究，有兴趣可以了解。

#### constructor

``` javascript
class Ora {
  constructor(options){
    if (!stdinDiscarder) {
      stdinDiscarder = new StdinDiscarder();
    }

    if (typeof options === 'string') { // 简化配置赋值的操作，对应api的ora(text)
      options = {
        text: options
      };
    }
    
    this.options = {
      text: '',
      color: 'cyan',
      stream: process.stderr, // 发现这里使用了process.stderr而不是process.stdout
      discardStdin: true,
      ...options
    };
    
    this.spinner = this.options.spinner;

    this.color = this.options.color;
    this.hideCursor = this.options.hideCursor !== false;
    this.interval = this.options.interval || this.spinner.interval || 100;
    this.stream = this.options.stream;
    // ... 剩余的初始化，不写了
  }
}
```

初始化了一个StdinDiscarder实例，查看官网api的`discardStdin`相关介绍：

``` text
discardStdin
Type: boolean
Default: true

Discard stdin input (except Ctrl+C) while running if it's TTY. This prevents the spinner from twitching on input, outputting broken lines on Enter key presses, and prevents buffering of input while the spinner is running.

This has no effect on Windows as there's no good way to implement discarding stdin properly there.
```

从中可以知道是一些输入流的处理。StdinDiscarder的内部实现内容还挺多的，但我们可以略过，不影响主流程。

#### start

start方法里主要关注的是render方法，发现start就是开启setInterval定时器，定时执行render方法。

``` javascript
class Ora {
  start() {
    // ... 其他内容
    this.render();
    this.id = setInterval(this.render.bind(this), this.interval);
    return this;
  }
}
```

进入render方法

``` javascript
class Ora {
  render() {
    if (this.isSilent) {
      return this;
    }

    this.clear();
    this.stream.write(this.frame());
    this.linesToClear = this.lineCount;

    return this;
  }
}
```

到这里我们基本可以理清楚基本逻辑了，在render方法里，我们先清空上一次的内容，然后写入流写入一个新的字符串，后面这句`this.linesToClear = this.lineCount;`是配合clear方法使用的。



进入clear方法

``` javascript
class Ora {
  clear(){
    if (!this.isEnabled || !this.stream.isTTY) {
      return this;
    }

    for (let i = 0; i < this.linesToClear; i++) {
      if (i > 0) {
        this.stream.moveCursor(0, -1);
      }

      this.stream.clearLine();
      this.stream.cursorTo(this.indent);
    }

    this.linesToClear = 0;

    return this;
  }
}
```

我们可以看到，清除内容的逻辑里有清空行`clearLine`和光标移动`cursorTo`这两个方法。这两个方法可以在tty模块中找到。这两个方法的调用对内容的刷新后展示挺重要的，我自己在模拟实现时，发现如果没有使用cursorTo()，每次刷新后的内容位置是叠加往后的。



进入frame方法

``` javascript
class Ora {
  frame(){
    const {frames} = this.spinner;
		let frame = frames[this.frameIndex];

		if (this.color) {
			frame = chalk[this.color](frame);
		}

		this.frameIndex = ++this.frameIndex % frames.length;
		const fullPrefixText = (typeof this.prefixText === 'string' && this.prefixText !== '') ? this.prefixText + ' ' : '';
		const fullText = typeof this.text === 'string' ? ' ' + this.text : '';

		return fullPrefixText + frame + fullText;
  }
}
```

在读`const {frames} = this.spinner`这行的时候，我很奇怪，我在初始化的时候没有看到frames相关的设置啊，那它是哪来的。仔细找，发现原来有个`set spinner()`，我们在初始化`this.spinner = this.options.spinner`时边会调用。



进入set spinner

``` javascript
class Ora {
  set spinner(spinner){
    this.frameIndex = 0;

    if (typeof spinner === 'object') {
      if (spinner.frames === undefined) {
        throw new Error('The given spinner must have a `frames` property');
      }

      this._spinner = spinner;
    } else if (!terminalSupportsUnicode()) {
      this._spinner = cliSpinners.line;
    } else if (spinner === undefined) {
      // Set default spinner
      this._spinner = cliSpinners.dots;
    } else if (cliSpinners[spinner]) {
      this._spinner = cliSpinners[spinner];
    } else {
      throw new Error(`There is no built-in spinner named '${spinner}'. See https://github.com/sindresorhus/cli-spinners/blob/main/spinners.json for a full list.`);
    }

    this._updateInterval(this._spinner.interval);
  }
}
```

这里我们可以看到，如果没有配spinner，则会帮我们配置。还记得之前说的那个配置文件的格式吗？

``` json
{
  "dots": {
		"interval": 80,
		"frames": []
	},
}
```

没错，cliSpinners.dots帮我们赋值给了this.spinner。

顺便来到第17行的函数`terminalSupportsUnicode`看一下。

``` javascript
const terminalSupportsUnicode = () => (
	process.platform !== 'win32' ||
	process.env.TERM_PROGRAM === 'vscode' ||
	Boolean(process.env.WT_SESSION)
);
```

很明显这个是判断终端是否支持unicode的方法。如果不是windows系统或者是vscode或者是在windows终端上，查了一下`process.env.WT_SESSION`可以用来检测是否为windows上的终端。

回到frame方法，可以轻松的整理出逻辑，每更新一次，便获取frames里的一个数据，然后循环获取。到这里，我们的源码解读可以说基本完成了。

#### stop

``` javascript
class Ora {
  stop(){
    if (!this.isEnabled) {
      return this;
    }

    clearInterval(this.id);
    this.id = undefined;
    this.frameIndex = 0;
    this.clear();
    if (this.hideCursor) {
      cliCursor.show(this.stream);
    }

    if (this.discardStdin && process.stdin.isTTY && this.isDiscardingStdin) {
      stdinDiscarder.stop();
      this.isDiscardingStdin = false;
    }

    return this;
  }
}
```

可以知道，stop主要就是做一些结束工作，比如清空定时器，重置配置内容等。

## 总结

ora的实现原理还挺简单的，主要使用了tty终端输出流，配合定时器来更新输入的内容。可以自己[简单实现](https://github.com/GrayFrost/source-code-learning/blob/main/ora/ora.js)一个，你会发现核心内容不过四五十行代码。  

生活无处不惊喜，代码亦如此，多驻足一下啦！我们下期再见。

## 参考

[readline](https://nodejs.org/dist/latest-v14.x/docs/api/readline.html)

[process](https://nodejs.org/dist/latest-v14.x/docs/api/process.html)

[tty](https://nodejs.org/dist/latest-v14.x/docs/api/tty.html)

[process.env.WT_SESSION](https://github.com/microsoft/terminal/issues/1040)