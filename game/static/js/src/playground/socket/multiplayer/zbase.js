class MultiPlayerSocket {
  constructor(playground) {
    this.playground = playground;

    this.ws = new WebSocket("ws://localhost:5015/wss/multiplayer/");

    this.start();
  }
  start() {
    this.receive();
  }

  receive() {
    // 前端接收后端消息
    let outer = this;
    this.ws.onmessage = function (e) {
      let data = JSON.parse(e.data); // 将字符串转换为json对象
      let uuid = data.uuid;
      if (uuid === outer.uuid) return false; // 消息是自己发的，忽略

      let event = data.event;
      if (event === "create_player") {
        outer.receive_create_player(uuid, data.username, data.photo);
      }
    };
  }

  send_create_player(username, photo) {
    let outer = this;
    this.ws.send(
      JSON.stringify({
        event: "create_player",
        uuid: outer.uuid,
        username: username,
        photo: photo,
      })
    );
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
}
