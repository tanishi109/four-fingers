import React from "react";
import Head from "next/head";

const MathTool = {
  posFrom(distance, degree) {
    const radian = degree * Math.PI / 180;
    const y2 = Math.sin(radian) * distance;
    const x2 = Math.cos(radian) * distance;

    return [x2, y2];
  }
};

class Stage {
  constructor(width, height, ctx, entities = []) {
    this.width = width;
    this.height = height;
    this.ctx = ctx;
    this.entities = entities;
  }

  update() {
    const {width, height, ctx, entities} = this;
    ctx.clearRect(0, 0, width, height);

    inputHandler.handle();

    entities.forEach((ent) => {
      ent.update(ctx);
    });
  }
}

class Judge {
  constructor(hands) {
    this.hands = hands;
    this.offenceIdMap_ = {
      "rock": 0,
      "scissors": 1,
      "paper": 2,
    };
  }

  getLoserIndice(weapons) {
    const offenceKinds = weapons.filter((w, i) => {
      return weapons.indexOf(w) === i && w !== "other";
    });

    if (offenceKinds.length === 3 || offenceKinds.length === 1) {
      return []; // drawn game
    }

    if (offenceKinds.length !== 2) {
      new Error("???");
      // console.log(offenceKinds);
    }

    const offenceIds = offenceKinds.map((o) => {
      return this.offenceIdMap_[o];
    });
    const loseFirst = (offenceIds[0] - offenceIds[1] + 3) % 3 === 1;
    const loseWeapon = loseFirst ? offenceKinds[0] : offenceKinds[1];

    return weapons.map((w, i) => {
      if (w === loseWeapon) {
        return i;
      } 
      return null;
    }).filter((i) => i !== null);
  }

  penalty(weapons) {
    const indice = weapons.map((w, i) => {
      if (w === "other") {
        return i;
      } 
      return null;
    }).filter((i) => i !== null);

    const penaltyHands = indice.map((i) => this.hands[i]);

    penaltyHands.forEach((h) => {
      h.addHp(-0.25);
    });
  }

  update(ctx) {
    const weapons = this.hands.map((h) => h.getWeapon());
    const loserIndice = this.getLoserIndice(weapons);
    const loserHands = loserIndice.map((i) => this.hands[i]);

    this.penalty(weapons);

    loserHands.forEach((h) => {
      h.addHp(-1);
    });

    const winners = this.hands.filter((h) => {
      return h.hp > 0;
    });
    const isGameSet = winners.length <= 1;

    if (isGameSet) {
      ctx.font = "30px Arial";
      ctx.fillText("YOU WIN!!", winners[0].x, winners[0].y);

      setTimeout(() => {
        location.reload();
      }, 3000);
    }
  }
};

class Hand {
  constructor(x, y, fingersKey) {
    this.x = x;
    this.y = y;
    this.fingersKey = fingersKey;
    this.charge = {
      "rock": 0,
      "paper": 0,
      "scissors": 0,
    };

    this.r_ = 10;
    this.hp = 200;
    this.fingers_ = fingersKey.map((key, i) => {
      return new Finger(this, key, i * 30);
    });
  }

  addHp(n) {
    this.hp += n;
  }

  getWeapon() {
    const [f1, f2, f3] = this.fingersKey;
    const inputsForFingers = [
      inputHandler.keyMap[f1],
      inputHandler.keyMap[f2],
      inputHandler.keyMap[f3],
    ];
    const isRock = inputsForFingers.every((inp) => inp !== true);
    if (isRock) {
      this.charge.rock += 9;
      this.charge.paper = 0;
      this.charge.scissors = 0;
      if (this.charge.rock > 60) {
        return "rock";
      }
    }
    const isPaper = inputsForFingers.every((inp) => inp === true);
    if (isPaper) {
      this.charge.rock = 0;
      this.charge.paper += 9;
      this.charge.scissors = 0;
      if (this.charge.paper > 60) {
        return "paper";
      }
    }
    const isScissors = inputsForFingers.filter((inp) => inp === true).length == 2;
    if (isScissors) {
      this.charge.rock = 0;
      this.charge.paper = 0;
      this.charge.scissors += 9;
      if (this.charge.scissors > 60) {
        return "scissors";
      }
    }

    return "other";
  }

  update(ctx) {
    // render
    ctx.beginPath();
    const {x, y, r_} = this;
    ctx.arc(x, y, r_, 0, 360 * Math.PI / 180);
    ctx.stroke();

    // finger
    this.fingers_.forEach((f) => {
      f.update(ctx);
    });
  }
};

class Finger {
  constructor(hand, key, degree) {
    this.hand = hand;
    this.key = key;
    this.degree = degree;
    this.height = 10;

    inputHandler.addHandler((input) => {
      if (input === key && this.height <= 40) {
        this.height += 9;
      }
    });
  }

  update(ctx) {
    if (inputHandler.keyMap[this.key] !== true) {
      if (this.height > 10) {
        this.height -= 9;
      }
    }

    ctx.beginPath();

    const {x, y} = this.hand;
    ctx.moveTo(x, y);

    const {height, degree} = this;
    const [x2, y2] = MathTool.posFrom(height, degree);
    ctx.lineTo(x + x2, y + y2);

    ctx.stroke();
  }
}

class Hp {
  constructor(hand) {
    this.hand = hand;
  }

  update(ctx) {
    ctx.beginPath();

    const {x, y, hp} = this.hand;
    ctx.rect(x, y + 80, hp, 20);

    ctx.stroke();
  }
}

const inputHandler = {
  handlers: [],
  keyMap: {},
  setMap(key, bool) {
    this.keyMap[key] = bool;
  },
  handle() {
    Object.keys(this.keyMap).forEach((key) => {
      if (this.keyMap[key] === true) {
        this.handlers.forEach((handler) => {
          handler(key);
        });
      }
    });
  },
  addHandler(func) {
    this.handlers.push(func);
  },
};

const initStage = () => {
  const canvas = document.getElementById("stage");
  const ctx = canvas.getContext("2d");
  const width = document.getElementById("wrapper").clientWidth;
  const height = document.getElementById("wrapper").clientHeight;

  canvas.setAttribute("width", width);
  canvas.setAttribute("height", height);

  const hand1 = new Hand(80, 80, ["a", "s", "d"]);
  const hand2 = new Hand(300, 80, ["j", "k", "l"]);
  const judge = new Judge([hand1, hand2]);
  const hp1 = new Hp(hand1);
  const hp2 = new Hp(hand2);
  const entities = [hand1, hand2, judge, hp1, hp2];

  return new Stage(width, height, ctx, entities);
};

const updateStage = (stage) => {

  stage.update();

  requestAnimationFrame(() => {
    updateStage(stage);
  });
};

export default class extends React.Component {
  componentDidMount() {
    const stage = initStage();
    updateStage(stage);

    window.addEventListener("keydown", (e) => {
      const keyName = event.key;

      inputHandler.setMap(keyName, true);
    });
    window.addEventListener("keyup", (e) => {
      const keyName = event.key;

      inputHandler.setMap(keyName, false);
    });
  }

  render() {
    return (
      <div id="wrapper" className="wrapper">
        {this.head()}
        <canvas id="stage" className="stage" />
        <style jsx>{`
          div {
            width: calc(100vw - 50px);
            height: 100vh;
            margin: 25px;
          }
          canvas {
            width: calc(100vw - 25px - 25px);
            height: calc(100vh - 25px - 25px);
            border: 1px solid #000;
            border-radius: 2px;
          }
        `}</style>
        <style jsx global>{`
          html,
          body {
            margin: 0;
            padding: 0;
          }
        `}</style>
      </div>
    );
  }

  head() {
    return (
      <Head>
        <script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/dat-gui/0.6.5/dat.gui.min.js"></script>
      </Head>
    );
  }
}