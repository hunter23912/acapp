class AcGameMenu {
  constructor(root) {
    this.root = root;
    this.$menu = $(`
      <div class="ac-game-menu">
        <div class="ac-game-menu-field">
          <div class="ac-game-menu-field-item ac-game-menu-field-item-single-mode">
            单人模式
          </div>
          <br>
          <div class="ac-game-menu-field-item ac-game-menu-field-item-multi-mode">
            多人模式
          </div>
          <br>
          <div class="ac-game-menu-field-item ac-game-menu-field-item-settings">
            退出
          </div>
          <br>
        </div>
      </div>
    `);
    this.$menu.hide();
    this.root.$ac_game.append(this.$menu);
    this.$single_mode = this.$menu.find(".ac-game-menu-field-item-single-mode");
    this.$multi_mode = this.$menu.find(".ac-game-menu-field-item-multi-mode");
    this.$settings = this.$menu.find(".ac-game-menu-field-item-settings");
    this.start();
  }

  start() {
    this.add_listening_events();
  }

  add_listening_events() {
    this.$single_mode.click(() => {
      this.hide();
      this.root.playground.show("single mode");
    });
    this.$multi_mode.click(() => {
      this.hide();
      this.root.playground.show("multi mode");
    });
    this.$settings.click(() => {
      ("click settings");
      this.root.settings.logout_on_remote();
    });
  }

  show() {
    // 显示menu界面
    this.$menu.show();
  }

  hide() {
    // 隐藏menu界面
    this.$menu.hide();
  }
}

let AC_GAME_OBJECTS = []; // 全局数组

class AcGameObject {
  constructor() {
    AC_GAME_OBJECTS.push(this);
    this.has_called_start = false; // 是否执行过start函数
    this.timedelta = 0; // 当前帧距离上一帧的时间间隔，单位毫秒
    this.uuid = this.create_uuid(); // 每个对象的唯一标识符

    this.uuid;
  }

  create_uuid() {
    // 创建一个唯一标识符
    let res = "";
    for (let i = 0; i < 8; i++) {
      let x = Math.floor(Math.random() * 10); // 返回[0,10)之间的随机整数
      res += x;
    }
    return res;
  }

  start() {
    // 只会在第一帧执行一次
  }

  update() {
    // 每一帧都会执行一次
  }

  late_update() {
    // 每一帧的最后执行一次
  }

  on_destroy() {
    // 在被销毁前执行一次
  }

  destroy() {
    // 删除当前对象、
    this.on_destroy();
    for (let i = 0; i < AC_GAME_OBJECTS.length; i++) {
      if (AC_GAME_OBJECTS[i] === this) {
        AC_GAME_OBJECTS.splice(i, 1);
        break;
      }
    }
  }
}

let last_timestamp; // 上一帧的时间戳
let AC_GAME_ANIMATION = (timestamp) => {
  for (let i = 0; i < AC_GAME_OBJECTS.length; i++) {
    let obj = AC_GAME_OBJECTS[i];
    if (!obj.has_called_start) {
      obj.start();
      obj.has_called_start = true;
    } else {
      obj.timedelta = timestamp - last_timestamp;
      obj.update();
    }
  }

  // 在每一帧的最后，所有物体创建完成后，执行late_update函数
  for (let i = 0; i < AC_GAME_OBJECTS.length; i++) {
    let obj = AC_GAME_OBJECTS[i];
    obj.late_update();
  }

  last_timestamp = timestamp;
  requestAnimationFrame(AC_GAME_ANIMATION); // 下一帧继续执行
};

requestAnimationFrame(AC_GAME_ANIMATION); // 浏览器提供的每一帧执行一次的函数

class ChatField {
  // 不需要继承AcGameObject
  constructor(playground) {
    this.playground = playground;
    this.$history = $(`<div class="ac-game-chat-field-history">历史记录</div>`);

    this.$input = $(`<input type="text" class="ac-game-chat-field-input">`);

    this.$history.hide();
    this.$input.hide();

    this.func_id = null;

    this.playground.$playground.append(this.$history);
    this.playground.$playground.append(this.$input);

    this.start();
  }

  start() {
    this.add_listening_events();
  }

  add_listening_events() {
    this.$input.keydown((e) => {
      if (e.which === 13) {
        // Enter键
        let username = this.playground.root.settings.username;
        let text = this.$input.val();
        if (text) {
          this.$input.val("");
          this.add_message(username, text);
          this.playground.mps.send_message(username, text);
        }
        this.hide_input();
        return false;
      }
    });
  }

  render_message(message) {
    return $(`<div>${message}</div>`);
  }

  add_message(username, text) {
    this.show_history();

    let msg = `[${username}]: ${text}`;
    this.$history.append(this.render_message(msg));
    this.$history.scrollTop(this.$history[0].scrollHeight);

    // 只有输入框没有打开时，才设置定时器隐藏历史记录
    if (!this.$input.is(":visible")) {
      if (this.func_id) clearTimeout(this.func_id);
      this.func_id = setTimeout(() => {
        this.$history.fadeOut();
        this.func_id = null;
      }, 3000);
    }
  }

  show_history() {
    this.$history.fadeIn();
  }

  show_input() {
    // 打开输入框，显示历史记录，并取消隐藏历史记录的定时器
    this.show_history();
    if (this.func_id) {
      clearTimeout(this.func_id);
      this.func_id = null;
    }
    this.$input.show();
    this.$input.focus();
  }

  hide_input() {
    this.$input.hide();
    // 输入框关闭时，3秒后隐藏历史记录
    this.func_id = setTimeout(() => {
      this.$history.fadeOut();
      this.func_id = null;
    }, 3000);
    this.playground.game_map.$canvas.focus();
  }
}

class GameMap extends AcGameObject {
  constructor(playground) {
    super();
    this.playground = playground;
    this.$canvas = $(`<canvas tabindex=0></canvas>`);
    this.ctx = this.$canvas[0].getContext("2d");
    this.ctx.canvas.width = this.playground.width;
    this.ctx.canvas.height = this.playground.height;
    this.playground.$playground.append(this.$canvas);
  }

  start() {
    this.$canvas.focus();
  }

  resize() {
    this.ctx.canvas.width = this.playground.width;
    this.ctx.canvas.height = this.playground.height;
    this.ctx.fillStyle = "rgba(0, 0, 0, 1)";
    this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
  }

  update() {
    this.render();
  }

  render() {
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
    this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
  }
}

class NoticeBoard extends AcGameObject {
  constructor(playground) {
    super();

    this.playground = playground;
    this.ctx = this.playground.game_map.ctx;
    this.text = "已就绪: 0人";
  }

  start() {}

  write(text) {
    this.text = text;
  }

  update() {
    this.render();
  }

  render() {
    this.ctx.font = "20px serif";
    this.ctx.fillStyle = "white";
    this.ctx.textAlign = "center";
    this.ctx.fillText(this.text, this.playground.width / 2, 20);
  }
}

class Particle extends AcGameObject {
  // 受击粒子效果
  constructor(playground, x, y, radius, vx, vy, color, speed, move_length) {
    super();
    this.playground = playground;
    this.ctx = this.playground.game_map.ctx;
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.speed = speed;
    this.move_length = move_length;
    this.friction = 0.9;
    this.eps = 0.01;
  }

  start() {}

  update() {
    if (this.move_length < this.eps || this.speed < this.eps) {
      this.destroy();
      return false;
    }

    let moved = Math.min(this.move_length, (this.speed * this.timedelta) / 1000);
    this.x += this.vx * moved;
    this.y += this.vy * moved;
    this.speed *= this.friction;
    this.move_length -= moved;
    this.render();
  }

  render() {
    let scale = this.playground.scale;
    this.ctx.beginPath();
    this.ctx.arc(this.x * scale, this.y * scale, this.radius * scale, 0, Math.PI * 2, false);
    this.ctx.fillStyle = this.color;
    this.ctx.fill();
  }
}

class Player extends AcGameObject {
  static FLASH_CD = 5;
  static FIREBALL_CD = 2;
  constructor(playground, x, y, radius, color, speed, character, username, photo) {
    character, username, photo; // 输出角色信息
    super();
    this.playground = playground;
    this.ctx = this.playground.game_map.ctx;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.damage_x = 0;
    this.damage_y = 0;
    this.damage_speed = 0;
    this.move_length = 0;
    this.radius = radius;
    this.color = color;
    this.speed = speed;
    this.character = character;
    this.username = username;
    this.photo = photo;
    this.eps = 0.01;
    this.friction = 0.9;
    this.spent_time = 0;
    this.fireballs = [];

    this.cur_skill = null;

    if (this.character !== "robot") {
      this.img = new Image();
      this.img.src = this.photo;
    }

    if (this.character === "me") {
      this.fireball_coldtime = Player.FIREBALL_CD; // 火球技能冷却时间，单位秒
      this.fireball_img = new Image();
      this.fireball_img.src = "/static/image/playground/fireball.webp";

      this.flash_coldtime = Player.FLASH_CD; // 闪现技能冷却时间，单位秒

      this.flash_img = new Image();
      this.flash_img.src = "/static/image/playground/flash.webp";
    }
  }

  start() {
    this.playground.player_count++;
    this.playground.notice_board.write("已就绪: " + this.playground.player_count + "人");

    if (this.playground.player_count >= 3) {
      this.playground.state = "fighting";
      this.playground.notice_board.write("游戏开始!");
    }

    if (this.character === "me") {
      this.add_listening_events();
    } else if (this.character === "robot") {
      // 创建电脑玩家随机移动
      let tx = (Math.random() * this.playground.width) / this.playground.scale;
      let ty = (Math.random() * this.playground.height) / this.playground.scale;
      this.move_to(tx, ty);
    }
  }

  add_listening_events() {
    this.playground.game_map.$canvas.on("contextmenu", (e) => {
      e.preventDefault();
    });
    this.playground.game_map.$canvas.mousedown((e) => {
      // 通过jquery注册鼠标按下事件
      if (this.playground.state !== "fighting") return true;
      const rect = this.ctx.canvas.getBoundingClientRect(); // 获取canvas的边界信息
      if (e.which === 3) {
        // 右键鼠标，移动位置
        let tx = (e.clientX - rect.left) / this.playground.scale;
        let ty = (e.clientY - rect.top) / this.playground.scale;
        this.move_to(tx, ty); // 本窗口的玩家移动

        if (this.playground.mode === "multi mode") {
          this.playground.mps.send_move_to(tx, ty); // 发送给服务器，同步其他玩家窗口中的移动
        }
      } else if (e.which === 1) {
        // 左键鼠标，释放技能
        let tx = (e.clientX - rect.left) / this.playground.scale;
        let ty = (e.clientY - rect.top) / this.playground.scale;
        if (this.cur_skill === "fireball") {
          if (this.fireball_coldtime > this.eps) return false;
          let fireball = this.shoot_fireball(tx, ty);
          if (this.playground.mode === "multi mode") {
            this.playground.mps.send_shoot_fireball(tx, ty, fireball.uuid);
          }
        } else if (this.cur_skill === "flash") {
          if (this.flash_coldtime > this.eps) return false;
          this.flash(tx, ty);
          if (this.playground.mode === "multi mode") {
            this.playground.mps.send_flash(tx, ty);
          }
        }

        this.cur_skill = null;
      }
    });
    this.playground.game_map.$canvas.keydown((e) => {
      if (e.which === 13) {
        // enter键
        if (this.playground.mode === "multi mode") {
          // 多人模式下打开聊天输入框
          this.playground.chat_field.show_input();
          return false;
        }
      } else if (e.which === 27) {
        // esc键
        if (this.playground.mode === "multi mode") {
          this.playground.chat_field.hide_input();
          return false;
        }
      }
      if (this.playground.state !== "fighting") return true;

      if (e.which === 81) {
        if (this.fireball_coldtime > this.eps) return true;

        // Q键
        this.cur_skill = "fireball";
        return false;
      } else if (e.which === 70) {
        if (this.flash_coldtime > this.eps) return true;
        // F键
        this.cur_skill = "flash";
        return false;
      }
    });
  }

  shoot_fireball(tx, ty) {
    let x = this.x,
      y = this.y;
    let radius = 0.01;
    let angle = Math.atan2(ty - this.y, tx - this.x);
    let vx = Math.cos(angle),
      vy = Math.sin(angle);
    let color = "orange";
    let speed = 0.5;
    let move_length = 1;
    let fireball = new FireBall(this.playground, this, x, y, radius, vx, vy, color, speed, move_length, 0.01);
    this.fireballs.push(fireball);

    this.fireball_coldtime = Player.FIREBALL_CD; // 重置冷却时间

    return fireball; // 返回这个火球对象
  }

  destroy_fireball(uuid) {
    for (let i = 0; i < this.fireballs.length; i++) {
      let fireball = this.fireballs[i];
      if (fireball.uuid === uuid) {
        fireball.destroy();
        break;
      }
    }
  }

  flash(tx, ty) {
    let d = this.get_dist(this.x, this.y, tx, ty);
    d = Math.min(d, 0.4); // 最多闪现0.8个单位距离
    let angle = Math.atan2(ty - this.y, tx - this.x);
    this.x += d * Math.cos(angle);
    this.y += d * Math.sin(angle);
    this.flash_coldtime = Player.FLASH_CD; // 重置冷却时间

    this.move_length = 0; // 闪现后停止移动
  }

  get_dist(x1, y1, x2, y2) {
    let dx = x1 - x2;
    let dy = y1 - y2;
    return Math.sqrt(dx * dx + dy * dy);
  }

  move_to(tx, ty) {
    this.move_length = this.get_dist(this.x, this.y, tx, ty);
    let angle = Math.atan2(ty - this.y, tx - this.x);
    this.vx = Math.cos(angle);
    this.vy = Math.sin(angle);
  }

  is_attacked(angle, damage) {
    for (let i = 0; i < 20 + Math.random() * 10; i++) {
      let x = this.x,
        y = this.y;
      let radius = this.radius * Math.random() * 0.1;
      let angle = Math.PI * 2 * Math.random();
      let vx = Math.cos(angle),
        vy = Math.sin(angle);
      let color = this.color;
      let speed = this.speed * 10;
      let move_length = this.radius * Math.random() * 5;
      new Particle(this.playground, x, y, radius, vx, vy, color, speed, move_length);
    }
    this.radius -= damage;
    if (this.radius < this.eps) {
      this.destroy();
      return false;
    }
    this.damage_x = Math.cos(angle);
    this.damage_y = Math.sin(angle);
    this.damage_speed = damage * 100;
    this.speed *= 0.8;
  }

  receive_attack(x, y, angle, damage, ball_uuid, attacker) {
    // 其他窗口中的玩家被动同步坐标
    attacker.destroy_fireball(ball_uuid);
    this.x = x;
    this.y = y;
    this.is_attacked(angle, damage);
  }

  update() {
    this.spent_time += this.timedelta / 1000;

    this.update_win();

    if (this.character === "me" && this.playground.state === "fighting") {
      this.update_coldtime();
    }

    this.update_move();

    this.render();
  }

  update_win() {
    if (this.playground.state === "fighting" && this.character == "me" && this.playground.players.length === 1) {
      this.playground.state = "over";
      this.playground.score_board.win();
    }
  }

  update_coldtime() {
    this.fireball_coldtime -= this.timedelta / 1000;
    this.fireball_coldtime = Math.max(this.fireball_coldtime, 0);

    this.flash_coldtime -= this.timedelta / 1000;
    this.flash_coldtime = Math.max(this.flash_coldtime, 0);
  }

  update_move() {
    // 更新玩家移动
    // 3秒后互相攻击
    if (this.character === "robot" && this.spent_time > 3 && Math.random() < 1 / 200.0) {
      let players = this.playground.players.filter((player) => player !== this);
      if (players.length > 0) {
        let player = players[Math.floor(Math.random() * players.length)];
        let tx = player.x + ((player.speed * this.vx * this.timedelta) / 1000) * 0.3;
        let ty = player.y + ((player.speed * this.vy * this.timedelta) / 1000) * 0.3;
        this.shoot_fireball(tx, ty);
      }
    }
    if (this.damage_speed > this.eps) {
      this.vx = this.vy = 0;
      this.move_length = 0;
      this.x += (this.damage_x * this.damage_speed * this.timedelta) / 1000;
      this.y += (this.damage_y * this.damage_speed * this.timedelta) / 1000;
      this.damage_speed *= this.friction;
    }
    if (this.move_length < this.eps) {
      this.move_length = 0;
      this.vx = this.vy = 0;
      if (this.character === "robot") {
        let tx = (Math.random() * this.playground.width) / this.playground.scale;
        let ty = (Math.random() * this.playground.height) / this.playground.scale;
        this.move_to(tx, ty);
      }
    } else {
      let moved = Math.min(this.move_length, (this.speed * this.timedelta) / 1000);
      this.x += this.vx * moved;
      this.y += this.vy * moved;
      this.move_length -= moved;
    }
  }

  render() {
    let scale = this.playground.scale;

    if (this.character !== "robot") {
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(this.x * scale, this.y * scale, this.radius * scale, 0, Math.PI * 2, false);
      this.ctx.stroke(); // 对当前路径描边
      this.ctx.clip(); // 将当前路径剪切掉
      this.ctx.drawImage(
        this.img,
        (this.x - this.radius) * scale,
        (this.y - this.radius) * scale,
        this.radius * 2 * scale,
        this.radius * 2 * scale
      );
      this.ctx.restore();
    } else {
      this.ctx.beginPath();
      this.ctx.arc(this.x * scale, this.y * scale, this.radius * scale, 0, Math.PI * 2, false);
      this.ctx.fillStyle = this.color;
      this.ctx.fill();
    }

    if (this.character === "me" && this.playground.state === "fighting") {
      this.render_skill_coldtime();
    }
  }

  // 绘制技能图标及其冷却时间
  render_skill_icon(x, y, r, img, coldtime, CD) {
    const scale = this.playground.scale;
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.arc(x * scale, y * scale, r * scale, 0, Math.PI * 2, false);
    this.ctx.stroke();
    this.ctx.clip();
    this.ctx.drawImage(img, (x - r) * scale, (y - r) * scale, r * 2 * scale, r * 2 * scale);
    this.ctx.restore();

    if (coldtime > 0) {
      this.ctx.beginPath();
      this.ctx.moveTo(x * scale, y * scale); // 画笔移动到圆心
      this.ctx.arc(
        x * scale,
        y * scale,
        r * scale,
        0 - Math.PI / 2,
        Math.PI * 2 * (1 - coldtime / CD) - Math.PI / 2,
        true
      );
      this.ctx.lineTo(x * scale, y * scale);
      this.ctx.fillStyle = "rgba(2, 69, 115, 0.8)";
      this.ctx.fill();
    }
  }

  render_skill_coldtime() {
    // 火球技能
    this.render_skill_icon(1.5, 0.9, 0.04, this.fireball_img, this.fireball_coldtime, Player.FIREBALL_CD);
    // 闪现技能
    this.render_skill_icon(1.62, 0.9, 0.04, this.flash_img, this.flash_coldtime, Player.FLASH_CD);
  }

  on_destroy() {
    if (this.character === "me") {
      if (this.playground.state === "fighting") {
        this.playground.state = "over";
        this.playground.score_board.lose();
      }
    }
    for (let i = 0; i < this.playground.players.length; i++) {
      if (this.playground.players[i] === this) {
        this.playground.players.splice(i, 1);
        break;
      }
    }
  }
}

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

class FireBall extends AcGameObject {
  constructor(playground, player, x, y, radius, vx, vy, color, speed, move_length, damage) {
    super();
    this.playground = playground;
    this.player = player;
    this.ctx = this.playground.game_map.ctx;
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.speed = speed;
    this.move_length = move_length;
    this.damage = damage;
    this.eps = 0.01;
  }

  start() {}

  update() {
    if (this.move_length < this.eps) {
      this.destroy();
      return false;
    }

    this.update_move();

    if (this.player.character != "enemy") {
      // 只在本地检测自己攻击别人的碰撞，不检测别人攻击自己的碰撞
      this.update_attack();
    }

    this.render();
  }

  update_move() {
    let moved = Math.min(this.move_length, (this.speed * this.timedelta) / 1000);
    this.x += this.vx * moved;
    this.y += this.vy * moved;
    this.move_length -= moved;
  }

  update_attack() {
    for (let i = 0; i < this.playground.players.length; i++) {
      let player = this.playground.players[i];
      if (this.player !== player && this.is_collision(player)) {
        this.attack(player);
        break; // 只攻击一名玩家
      }
    }
  }

  get_dist(x1, y1, x2, y2) {
    let dx = x1 - x2;
    let dy = y1 - y2;
    return Math.sqrt(dx * dx + dy * dy);
  }

  is_collision(obj) {
    let distance = this.get_dist(this.x, this.y, obj.x, obj.y);
    if (distance < this.radius + obj.radius) {
      return true;
    }
    return false;
  }

  attack(player) {
    let angle = Math.atan2(player.y - this.y, player.x - this.x);
    player.is_attacked(angle, this.damage);

    if (this.playground.mode === "multi mode") {
      this.playground.mps.send_attack(player.uuid, player.x, player.y, angle, this.damage, this.uuid);
    }

    this.destroy();
  }

  render() {
    let scale = this.playground.scale;
    this.ctx.beginPath();
    this.ctx.arc(this.x * scale, this.y * scale, this.radius * scale, 0, Math.PI * 2, false);
    this.ctx.fillStyle = this.color;
    this.ctx.fill();
  }

  on_destroy() {
    let fireballs = this.player.fireballs;
    for (let i = 0; i < fireballs.length; i++) {
      if (fireballs[i] === this) {
        fireballs.splice(i, 1);
        break;
      }
    }
  }
}

class MultiPlayerSocket {
  constructor(playground) {
    this.playground = playground;

    this.ws = new WebSocket("ws://localhost:8081/wss/multiplayer/?token=" + playground.root.access);

    this.start();
  }
  start() {
    this.receive();
  }

  receive() {
    // 前端接收后端消息
    this.ws.onmessage = (e) => {
      let data = JSON.parse(e.data); // 将字符串转换为json对象
      let uuid = data.uuid;
      if (uuid === this.uuid) return false; // 消息是自己发的，忽略

      let event = data.event;
      if (event === "create_player") {
        this.receive_create_player(uuid, data.username, data.photo);
      } else if (event === "move_to") {
        this.receive_move_to(uuid, data.tx, data.ty);
      } else if (event === "shoot_fireball") {
        this.receive_shoot_fireball(uuid, data.tx, data.ty, data.ball_uuid);
      } else if (event === "attack") {
        this.receive_attack(uuid, data.attackee_uuid, data.x, data.y, data.angle, data.damage, data.ball_uuid);
      } else if (event === "flash") {
        this.receive_flash(uuid, data.tx, data.ty);
      } else if (event === "message") {
        this.receive_message(uuid, data.username, data.text);
      }
    };
  }

  send_create_player(username, photo) {
    const now = new Date();
    const time_str = now.toLocaleTimeString("zh-CN", { hour12: false }); // 只获取本地时间24小时制的时分秒
    this.ws.send(
      JSON.stringify({
        event: "create_player",
        uuid: this.uuid,
        username: username,
        photo: photo,
        created_at: time_str,
      })
    );
  }

  get_player(uuid) {
    let players = this.playground.players;
    for (let i = 0; i < players.length; i++) {
      let player = players[i];
      if (player.uuid === uuid) return player;
    }
    return null;
  }

  receive_create_player(uuid, username, photo) {
    // 防止重复创建
    for (let player of this.playground.players) {
      if (player.uuid === uuid) return false;
    }
    let player = new Player(
      this.playground,
      this.playground.width / 2 / this.playground.scale,
      0.5,
      0.05,
      "white",
      0.15,
      "enemy",
      username,
      photo
    );
    player.uuid = uuid;
    this.playground.players.push(player);
  }

  send_move_to(tx, ty) {
    this.ws.send(
      JSON.stringify({
        event: "move_to",
        uuid: this.uuid,
        tx: tx,
        ty: ty,
      })
    );
  }

  receive_move_to(uuid, tx, ty) {
    let player = this.get_player(uuid);
    if (player) {
      player.move_to(tx, ty);
    }
  }

  send_shoot_fireball(tx, ty, ball_uuid) {
    this.ws.send(
      JSON.stringify({
        event: "shoot_fireball",
        uuid: this.uuid,
        tx: tx,
        ty: ty,
        ball_uuid: ball_uuid,
      })
    );
  }

  receive_shoot_fireball(uuid, tx, ty, ball_uuid) {
    let player = this.get_player(uuid);
    if (player) {
      let fireball = player.shoot_fireball(tx, ty);
      fireball.uuid = ball_uuid;
    }
  }

  send_attack(attackee_uuid, x, y, angle, damage, ball_uuid) {
    // 只在攻击者窗口计算有效攻击，并同步玩家坐标，避免随着计算延迟，玩家坐标误差增大
    this.ws.send(
      JSON.stringify({
        event: "attack",
        uuid: this.uuid,
        attackee_uuid: attackee_uuid,
        x: x,
        y: y,
        angle: angle,
        damage: damage,
        ball_uuid: ball_uuid,
      })
    );
  }

  receive_attack(attacker_uuid, attackee_uuid, x, y, angle, damage, ball_uuid) {
    let attacker = this.get_player(attacker_uuid);
    let attackee = this.get_player(attackee_uuid);
    if (attacker && attackee) {
      // 本次攻击玩家未死亡
      attackee.receive_attack(x, y, angle, damage, ball_uuid, attacker);
    }
  }

  send_flash(tx, ty) {
    this.ws.send(
      JSON.stringify({
        event: "flash",
        uuid: this.uuid,
        tx: tx,
        ty: ty,
      })
    );
  }

  receive_flash(uuid, tx, ty) {
    let player = this.get_player(uuid);
    if (player) {
      player.flash(tx, ty);
    }
  }

  send_message(username, text) {
    this.ws.send(
      JSON.stringify({
        event: "message",
        uuid: this.uuid,
        username: username,
        text: text,
      })
    );
  }

  receive_message(uuid, username, text) {
    this.playground.chat_field.add_message(username, text);
  }
}

class AcGamePlayground {
  constructor(root) {
    this.root = root;
    this.$playground = $(`<div class="ac-game-playground"></div>`);

    this.hide();
    this.root.$ac_game.append(this.$playground);

    this.start();
  }

  get_random_color() {
    let colors = ["blue", "red", "pink", "green", "purple", "yellow"];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  start() {
    let uuid = this.create_uuid();

    $(window).on(`resize.${uuid}`, () => {
      this.resize();
    });

    if (this.root.AcOS) {
      this.root.AcOS.api.window.one_close(() => {
        $(window).off(`resize.${uuid}`);
      });
    }
  }

  create_uuid() {
    let res = "";
    for (let i = 0; i < 8; i++) {
      let x = parseInt(Math.floor(Math.random() * 10)); // 0-9
      res += x;
    }
    return res;
  }

  resize() {
    // 调整地图大小
    this.width = this.$playground.width();
    this.height = this.$playground.height();
    let unit = Math.min(this.width / 16, this.height / 9);
    this.width = unit * 16;
    this.height = unit * 9;
    this.scale = this.height;

    if (this.game_map) this.game_map.resize();
  }

  show(mode) {
    // 打开playground界面
    this.$playground.show();
    this.game_map = new GameMap(this);
    this.mode = mode;
    this.state = "waiting"; // 状态机：waiting -> fighting -> over 每个地图的三个状态
    this.notice_board = new NoticeBoard(this);
    this.score_board = new ScoreBoard(this);
    this.player_count = 0;

    this.resize();

    this.players = [];
    this.players.push(
      new Player(
        this,
        this.width / 2 / this.scale,
        0.5,
        0.05,
        "white",
        0.15,
        "me",
        this.root.settings.username,
        this.root.settings.photo
      )
    );

    if (mode === "single mode") {
      for (let i = 0; i < 5; i++) {
        this.players.push(
          new Player(this, this.width / 2 / this.scale, 0.5, 0.05, this.get_random_color(), 0.15, "robot")
        );
      }
    } else if (mode === "multi mode") {
      this.chat_field = new ChatField(this);
      // 如果是多人模式，则创建多人连接
      this.mps = new MultiPlayerSocket(this);
      this.mps.uuid = this.players[0].uuid;

      this.mps.ws.onopen = () => {
        this.mps.send_create_player(this.root.settings.username, this.root.settings.photo); // 最外层接口，发送给websocket服务器
      };
    }
  }

  hide() {
    // 关闭playground界面
    while (this.players && this.players.length > 0) {
      this.players[0].destroy();
    }

    if (this.game_map) {
      this.game_map.destroy();
      this.game_map = null;
    }

    if (this.notice_board) {
      this.notice_board.destroy();
      this.notice_board = null;
    }

    if (this.score_board) {
      this.score_board.destroy();
      this.score_board = null;
    }

    this.$playground.empty();

    this.$playground.hide();
  }
}

class Settings {
  constructor(root) {
    this.root = root;
    this.platform = "WEB";
    if (this.root.AcOS) this.platform = "ACAPP";
    this.username = "";
    this.photo = "";

    this.$settings = $(`
      <div class="ac-game-settings">
        <div class="ac-game-settings-login">
          <div class="ac-game-settings-title">
            登录
          </div>
          <div class="ac-game-settings-username">
            <div class="ac-game-settings-item">
              <input type="text" placeholder="用户名">
            </div>
          </div>
          <div class="ac-game-settings-password">
            <div class="ac-game-settings-item">
              <input type="password" placeholder="密码">
            </div>
          </div>
          <div class="ac-game-settings-submit">
            <div class="ac-game-settings-item">
              <button>登录</button>
            </div>
          </div>
          <div class="ac-game-settings-error-message">
          </div>
          <div class="ac-game-settings-option">
            注册
          </div>
          <br>
          <div class="ac-game-settings-acwing">
            <img width="30" src="https://app165.acapp.acwing.com.cn/static/image/settings/acwing_logo.png">
            <br>
            <div>
              AcWing一键登录
            </div>
          </div>
        </div>
        <div class="ac-game-settings-register">
          <div class="ac-game-settings-title">
            注册
          </div>
          <div class="ac-game-settings-username">
            <div class="ac-game-settings-item">
              <input type="text" placeholder="用户名">
            </div>
          </div>
          <div class="ac-game-settings-password ac-game-settings-password-first">
            <div class="ac-game-settings-item">
              <input type="password" placeholder="密码">
            </div>
          </div>
          <div class="ac-game-settings-password ac-game-settings-password-second">
            <div class="ac-game-settings-item">
              <input type="password" placeholder="确认密码">
            </div>
          </div>
          <div class="ac-game-settings-submit">
            <div class="ac-game-settings-item">
              <button>注册</button>
            </div>
          </div>
          <div class="ac-game-settings-error-message">
          </div>
          <div class="ac-game-settings-option">
            登录
          </div>
          <br>
          <div class="ac-game-settings-acwing">
            <img width="30" src="https://app165.acapp.acwing.com.cn/static/image/settings/acwing_logo.png">
            <br>
            <div>
              AcWing一键登录
            </div>
        </div>
      </div>
    `);
    this.$login = this.$settings.find(".ac-game-settings-login");
    this.$login_username = this.$login.find(".ac-game-settings-username input");
    this.$login_password = this.$login.find(".ac-game-settings-password input");
    this.$login_submit = this.$login.find(".ac-game-settings-submit button");
    this.$login_error_message = this.$login.find(".ac-game-settings-error-message");
    this.$login_register = this.$login.find(".ac-game-settings-option");

    this.$login.hide();

    this.$register = this.$settings.find(".ac-game-settings-register");
    this.$register_username = this.$register.find(".ac-game-settings-username input");
    this.$register_password = this.$register.find(".ac-game-settings-password-first input");
    this.$register_password_confirm = this.$register.find(".ac-game-settings-password-second input");
    this.$register_submit = this.$register.find(".ac-game-settings-submit button");
    this.$register_error_message = this.$register.find(".ac-game-settings-error-message");
    this.$register_login = this.$register.find(".ac-game-settings-option");

    this.$register.hide();

    this.$acwing_login = this.$settings.find(".ac-game-settings-acwing img");

    this.root.$ac_game.append(this.$settings);

    this.start();
  }

  start() {
    if (this.platform === "ACAPP") {
      this.getinfo_acapp();
    } else {
      if (this.root.access) {
        this.getinfo_web();
        this.refresh_jwt_token();
      } else {
        this.login();
      }
      this.add_listening_events();
    }
  }

  refresh_jwt_token() {
    setInterval(() => {
      $.ajax({
        url: "http://localhost:8000/settings/token/refresh/",
        type: "POST",
        data: {
          refresh: this.root.refresh,
        },
        success: (resp) => {
          this.root.access = resp.access;
        },
      });
    }, 270000); // 4.5分钟刷新一次token

    setTimeout(() => {
      $.ajax({
        url: "http://localhost:8000/settings/ranklist",
        type: "GET",
        headers: {
          Authorization: "Bearer " + this.root.access,
        },
        success: (resp) => {
          console.log(resp);
        },
      });
    }, 5000);
  }

  acwing_login() {
    ("click acwing login");
    $.ajax({
      url: "http://localhost:8000/settings/acwing/web/apply_code/",
      type: "GET",
      success: (resp) => {
        if (resp.result === "success") {
          window.location.replace(resp.apply_code_url);
        }
      },
    });
  }

  add_listening_events() {
    this.add_listening_events_login();
    this.add_listening_events_register();

    this.$acwing_login.click(() => {
      this.acwing_login();
    });
  }

  add_listening_events_login() {
    this.$login_register.click(() => {
      this.register();
    });
    this.$login_submit.click(() => {
      this.login_on_remote();
    });
  }

  add_listening_events_register() {
    this.$register_login.click(() => {
      this.login();
    });
    this.$register_submit.click(() => {
      this.register_on_remote();
    });
  }

  login_on_remote(username, password) {
    // 在远程服务器上登录
    username = username || this.$login_username.val(); // 对传入的形参进行短路赋值
    password = password || this.$login_password.val();
    this.$login_error_message.empty();

    $.ajax({
      url: "http://localhost:8000/settings/token/",
      type: "POST",
      data: {
        username,
        password,
      },
      success: (resp) => {
        this.root.access = resp.access;
        this.root.refresh = resp.refresh;
        this.refresh_jwt_token();
        this.getinfo_web();
      },
      error: () => {
        this.$login_error_message.html("用户名或密码错误");
      },
    });
  }

  register_on_remote() {
    // 在远程服务器上注册
    let username = this.$register_username.val();
    let password = this.$register_password.val();
    let password_confirm = this.$register_password_confirm.val();
    this.$register_error_message.empty();
    $.ajax({
      url: "http://localhost:8000/settings/register/",
      type: "POST",
      data: {
        // JS当k-v一样时候，可以只写一个
        username,
        password,
        password_confirm,
      },
      success: (resp) => {
        if (resp.result === "success") {
          this.login_on_remote(username, password);
        } else {
          this.$register_error_message.html(resp.result);
        }
      },
    });
  }

  logout_on_remote() {
    // 在远程服务器上登出
    if (this.platform == "ACAPP") {
      this.root.AcOS.api.window.close();
    } else {
      this.root.access = "";
      this.root.refresh = "";
      location.href = "/";
    }
  }

  register() {
    // 打开注册界面
    this.$login.hide();
    this.$register.show();
  }

  login() {
    // 打开登录界面
    this.$register.hide();
    this.$login.show();
  }

  acapp_login(appid, redirect_uri, scope, state) {
    this.root.AcOS.api.oatuh2.authorize({
      appid,
      redirect_uri,
      scope,
      state,
      success: (resp) => {
        resp;
        if (resp.result === "success") {
          this.username = resp.username;
          this.photo = resp.photo;
          this.hide();
          this.root.menu.show();
          console.log(resp);
          this.root.access = resp.access;
          this.root.refresh = resp.refresh;

          this.refresh_jwt_token();
        }
      },
    });
  }

  getinfo_acapp() {
    $.ajax({
      url: "http://localhost:8000/settings/acwing/acapp/apply_code/",
      type: "GET",
      success: (resp) => {
        if (resp.result === "success") {
          this.acapp_login(resp.appid, resp.redirect_uri, resp.scope, resp.state);
        }
      },
    });
  }

  getinfo_web() {
    $.ajax({
      url: "http://localhost:8000/settings/getinfo/",
      type: "GET",
      data: { platform: this.platform },
      headers: {
        Authorization: "Bearer " + this.root.access,
      },
      success: (resp) => {
        resp;
        if (resp.result === "success") {
          this.username = resp.username;
          this.photo = resp.photo;
          this.hide();
          this.root.menu.show();
        } else {
          this.login();
          // this.register();
        }
      },
    });
  }

  hide() {
    this.$settings.hide();
  }

  show() {
    this.$settings.show();
  }
}

export class AcGame {
  constructor(id, AcOS, access, refresh) {
    this.id = id;
    this.$ac_game = $("#" + id);
    this.AcOS = AcOS;
    this.access = access;
    this.refresh = refresh;
    this.settings = new Settings(this);
    this.menu = new AcGameMenu(this);
    this.playground = new AcGamePlayground(this);

    this.start();
  }

  start() {}
}

// ajax 表单

