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
