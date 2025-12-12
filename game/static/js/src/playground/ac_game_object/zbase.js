let AC_GAME_OBJECTS = []; // 全局数组

class AcGameObject {
  constructor() {
    AC_GAME_OBJECTS.push(this);
    this.has_called_start = false; // 是否执行过start函数
    this.timedelta = 0; // 当前帧距离上一帧的时间间隔，单位毫秒
  }

  start() {
    // 只会在第一帧执行一次
  }

  update() {
    // 每一帧都会执行一次
  }

  on_destroyed() {
    // 在被销毁前执行一次
  }

  destroy() {
    // 删除当前对象、
    this.on_destroyed();
    for (let i = 0; i < AC_GAME_OBJECTS.length; i++) {
      if (AC_GAME_OBJECTS[i] === this) {
        AC_GAME_OBJECTS.splice(i, 1);
        break;
      }
    }
  }
}

let last_timestamp; // 上一帧的时间戳
let AC_GAME_ANIMATION = function (timestamp) {
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
  last_timestamp = timestamp;
  requestAnimationFrame(AC_GAME_ANIMATION); // 下一帧继续执行
};

requestAnimationFrame(AC_GAME_ANIMATION); // 浏览器提供的每一帧执行一次的函数
