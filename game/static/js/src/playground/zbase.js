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
    $(window).resize(() => {
      this.resize();
    });
  }

  resize() {
    ("resize");
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
    this.$playground.hide();
  }
}
