class ScoreBoard extends AcGameObject {
  constructor(playground) {
    super();
    this.playground = playground;
    this.ctx = this.playground.game_map.ctx;

    this.state = null; // win, lose

    this.win_img = new Image();
    this.win_img.src = "/static/image/playground/win.svg";

    this.lose_img = new Image();

    this.lose_img.src = "/static/image/playground/lose.svg";
  }

  start() {}

  add_listening_events() {
    let $canvas = this.playground.game_map.$canvas;

    $canvas.on(`click.${this.uuid}`, () => {
      this.playground.hide();
      this.playground.root.menu.show();
    });
  }

  win() {
    this.state = "win";

    setTimeout(() => {
      this.add_listening_events();
    }, 1000);
  }

  lose() {
    this.state = "lose";
    setTimeout(() => {
      this.add_listening_events();
    }, 1000);
  }

  late_update() {
    this.render();
  }

  render() {
    let max_len = this.playground.height; // 最大边长限制
    let img = null;
    if (this.state === "win") img = this.win_img;
    else if (this.state === "lose") img = this.lose_img;
    if (!img || !img.complete) return; // 不加的话会导致第一秒执行时报错

    // 获取原始宽高
    let w = img.naturalWidth || img.width;
    let h = img.naturalHeight || img.height;

    // min(w,h)的0.8倍作为缩放因子
    let max_w = this.playground.width * 0.8;
    let max_h = this.playground.height * 0.8;
    let scale = Math.min(max_w / w, max_h / h);
    let draw_w = w * scale;
    let draw_h = h * scale;

    // params: 图片，xy坐标，宽高
    this.ctx.drawImage(
      img,
      this.playground.width / 2 - draw_w / 2,
      this.playground.height / 2 - draw_h / 2,
      draw_w,
      draw_h
    );
  }
}
