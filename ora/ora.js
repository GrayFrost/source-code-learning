/** 
 * ora源码的简单实现
*/
class MyOra {
    constructor(options) {
        this.options = {
            text: "",
            interval: 100,
            stream: process.stderr,
            ...options,
        };
        this.text = this.options.text;
        this.id = undefined;
        this.interval = this.options.interval;
        this.stream = this.options.stream;

        this.dots = {
            frames: ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"],
        };
        this.frameIndex = 0;
        this.spinner = this.dots;

        this.linesToClear = 1;
    }
    clear() {
        for (let i = 0; i < this.linesToClear; i++) {
            this.stream.clearLine();
            this.stream.cursorTo(0);
        }
        return this;
    }
    frame() {
        const { frames } = this.spinner;
        let frame = frames[this.frameIndex];
        this.frameIndex = ++this.frameIndex % frames.length;
        const fullText = frame + " " + this.text;
        return fullText;
    }
    render() {
        this.clear();
        this.stream.write(this.frame());
        return this;
    }

    start() {
        this.render();
        this.id = setInterval(this.render.bind(this), this.interval);
        return this;
    }

    stop() {
        clearInterval(this.id);
        this.id = undefined;
        this.frameIndex = 0;
        this.clear();
        return this;
    }
}

module.exports = function(options){
  return new MyOra(options);
}

// 如果不想写例子，可以放开注释，直接运行该文件
// const ora = new MyOra({
//     text: "你好",
// });

// ora.start();
// setTimeout(() => {
//     ora.stop();
// }, 10000);
