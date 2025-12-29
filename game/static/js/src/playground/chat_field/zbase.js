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
