let scoretext;
let centertext;
let speedtext;
let highscoretext;

let count = 7;
let timer;

let dead = false;
let analyser, frequencyArray;
let isShooting = false;
let score = 0;

const PLANETSPAWNSPEED = 100;
const STARTPLANETS = 50;
const WORLDSIZE = 200;
const MAXSPEED = 3;

let maxPlanets = STARTPLANETS;
let planespeed = 0.5;

const rightArrow = document.querySelector(`.arrow-right`);
const leftArrow = document.querySelector(`.arrow-left`);

const titel = document.querySelector(`.titel`);
const rules = document.querySelector(`.rules`);
const instructionsRight = document.querySelector(`.instructions-right`);
const instructionsLeft = document.querySelector(`.instructions-left`);
const arrowRight = document.querySelector(`.arrow-right`);

const arrowLeft = document.querySelector(`.arrow-left`);
const playTitle = document.querySelector(`.playTitle`);

const vrButton = document.querySelector(`.a-enter-vr-button`);


const restart = () => {
  count = 3;
  dead = false;
  maxPlanets = STARTPLANETS;
  score = 0;
  planespeed = 0.1;

  document.querySelectorAll(`.bullet`).forEach(bullet => {
    bullet.parentNode.removeChild(bullet);
  });

  startgame();
};

const init = () => {
  for (let i = 0;i < STARTPLANETS;i ++) {
    generateNewBox();
  }

  setInterval(function() {
    maxPlanets ++;
  }, PLANETSPAWNSPEED);

  scoretext = document.querySelector(`.score`);
  centertext = document.querySelector(`.centertext`);
  speedtext = document.querySelector(`.speed`);
  highscoretext = document.querySelector(`.highscore`);

  checkHighscore();

  //vrButton.classList.add(`invisible`);

  rightArrow.addEventListener(`click`, rightArrowClicked);
  leftArrow.addEventListener(`click`, leftArrowClicked);

  checkAudio();

  setTimeout(() => {
    const vrbutton = document.querySelector(`.a-enter-vr-button`);
    vrbutton.addEventListener(`mousedown`, startgame);
  }, 1000);
};

const rightArrowClicked = () => {

  // const vrButton = document.querySelector(`a-enter-vr-button`);

  titel.classList.add(`invisible`);
  rules.classList.add(`invisible`);
  instructionsRight.classList.add(`invisible`);
  instructionsLeft.classList.add(`invisible`);
  arrowRight.classList.add(`invisible`);

  arrowLeft.classList.remove(`invisible`);
  playTitle.classList.remove(`invisible`);
  vrButton.classList.remove(`invisible`);
  // vrButton.classList.remove(`invisible`);

};

const leftArrowClicked = () => {
  // const vrButton = document.querySelector(`a-enter-vr-button`);

  titel.classList.remove(`invisible`);
  rules.classList.remove(`invisible`);
  instructionsRight.classList.remove(`invisible`);
  instructionsLeft.classList.remove(`invisible`);
  arrowRight.classList.remove(`invisible`);

  arrowLeft.classList.add(`invisible`);
  playTitle.classList.add(`invisible`);
  vrButton.classList.add(`invisible`);
  // vrButton.classList.remove(`invisible`);

  //}, 100);
};

const startgame = () => {
  timer = setInterval(function() {
    handleTimer(count);
  }, 1000);

};

const checkAudio = () => {
  navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
  navigator.getUserMedia({audio: true}, soundAllowed, soundNotAllowed);
};

const soundAllowed = stream => {
  window.persistAudioStream = stream;
  const audioContent = new AudioContext();
  const audioStream = audioContent.createMediaStreamSource(stream);
  analyser = audioContent.createAnalyser();
  audioStream.connect(analyser);
  analyser.fftSize = 1024;
  frequencyArray = new Uint8Array(analyser.frequencyBinCount);
};

const soundNotAllowed = error => {
  console.log(error);
};

const handleTimer = () => {
  if (count === - 1) {
    clearInterval(timer);
    centertext.setAttribute(`value`, ``);
    console.log(`start`);
    update();
  } else if (count === 0) {
    centertext.setAttribute(`value`, `go`);
  } else {
    centertext.setAttribute(`value`, count);
  }
  count --;
};

let totalVolume = 0;
let volumeElements = 0;

const checkShooting = changes => {
  if (analyser) {
    analyser.getByteFrequencyData(frequencyArray);

    let values = 0;
    const length = frequencyArray.length;
    for (let i = 0;i < length;i ++) {
      values += frequencyArray[i];
    }

    const volume = values / length;
    totalVolume += volume;
    volumeElements ++;

    const averageVolume = totalVolume / volumeElements;

    if (volume > averageVolume + 10 && isShooting === false) {
      shoot(changes);
      isShooting = true;
    } else if (volume < averageVolume + 10 && isShooting === true) {
      isShooting = false;
    }
  }
};

const update = () => {
  const cameraPosition = document.querySelector(`a-camera`).components.rotation.data;
  const cameraPositionY = Math.floor(Math.abs(cameraPosition.y % 360));
  const cameraPositionX = Math.floor(cameraPosition.x % 360);

  const changes = calculateMovement(cameraPositionX, cameraPositionY);

  const numberOfPlanets = document.querySelectorAll(`.planet`).length;
  if (numberOfPlanets < maxPlanets) {
    generateNewBox(cameraPositionY);
  }

  checkShooting(changes);

  let firstrun = true;

  document.querySelectorAll(`.planet`).forEach(box => {

    const scale = box.getAttribute(`scale`);
    if (scale) {
      //Planet rustig afbreken
      if (box.classList.contains(`hit`)) {
        if (scale.x > 0) {
          const newScale = scale.x - 0.2;
          box.setAttribute(`scale`, `${newScale} ${newScale} ${newScale}`);
        } else {
          resetBox(box, cameraPositionY);
        }
      //Planeet spawnen
      } else if (scale.x <= 1) {
        const newScale = scale.x + 0.1;
        box.setAttribute(`scale`, `${newScale} ${newScale} ${newScale}`);
      }
    }

    const position = box.getAttribute(`position`);
    if (position) {
      const boxChange = calculateBoxChange(box.classList[0]);
      box.setAttribute(`position`, `${position.x + boxChange.xChange + changes.xChange} ${position.y - changes.yChange} ${position.z + boxChange.zChange + changes.zChange}`);

      if (position.x > WORLDSIZE || position.z > WORLDSIZE || position.x < - WORLDSIZE || position.z < - WORLDSIZE || position.y > WORLDSIZE || position.y < - WORLDSIZE) {
        resetBox(box, cameraPositionY);
      }

      if (position.x < 3 && position.x > - 3 && position.z < 3 && position.z > - 3 && position.y < 3 && position.y > - 3) {
        box.parentNode.removeChild(box);
        deadHandler();

        saveScore();
      }

      document.querySelectorAll(`.bullet`).forEach(bullet => {
        const bulletposition = bullet.getAttribute(`position`);
        if (bulletposition) {
          if (firstrun) {
            bullet.setAttribute(`position`, `${bulletposition.x - (bullet.dataset.xChange * 8)} ${bulletposition.y + (bullet.dataset.yChange * 8)} ${bulletposition.z - (bullet.dataset.zChange * 8)}`);
          }

          if (bulletposition.x > WORLDSIZE || bulletposition.z > WORLDSIZE || bulletposition.x < - WORLDSIZE || bulletposition.z < - WORLDSIZE || bulletposition.y > WORLDSIZE || bulletposition.y < - WORLDSIZE) {
            bullet.parentNode.removeChild(bullet);
          }

          //Collision Detection
          if (bulletposition.x < position.x + 3 &&  bulletposition.x > position.x - 3  && bulletposition.y < position.y + 3 &&  bulletposition.y > position.y - 3 && bulletposition.z < position.z + 3 &&  bulletposition.z > position.z - 3) {
            console.log(`raak`);
            score += 1;
            scoretext.setAttribute(`value`, score);
            box.classList.add(`hit`);
            bullet.parentNode.removeChild(bullet);
          }
        }
      });
      firstrun = false;
    }
  });

  if (dead === false) {
    requestAnimationFrame(update);
  }
};

const deadHandler = () => {
  centertext.setAttribute(`value`, `dood`);
  dead = true;

  animateDead();
};

let counter  = 0;

const animateDead = () => {

  if (counter > 60) {
    restart();
  } else {
    counter ++;
    requestAnimationFrame(animateDead);
  }
};

const shoot = direction => {
  const bullet = document.createElement(`a-sphere`);
  bullet.setAttribute(`color`, `#FF3300`);
  bullet.setAttribute(`radius`, `0.3`);

  bullet.classList.add(`bullet`);
  bullet.dataset.xChange = direction.xChange;
  bullet.dataset.yChange = direction.yChange;
  bullet.dataset.zChange = direction.zChange;
  document.querySelector(`a-scene`).appendChild(bullet);
};

const generateNewBox = cameraPositionY => {
  const box = document.createElement(`a-sphere`);

  const texture = Math.floor(Math.random() * 3) + 1;

  box.setAttribute(`src`, `#texture${texture}`);

  box.setAttribute(`radius`, 3);

  box.setAttribute(`scale`, `0 0 0`);

  const vertical = Math.floor(Math.random() * (WORLDSIZE * 2)) - WORLDSIZE;
  const horizontal = Math.floor(Math.random() * (WORLDSIZE * 2)) - WORLDSIZE;

  let position;

  if (cameraPositionY === 0) {
    // 1 2 3
    position = Math.floor(Math.random() * 3) + 1;
  } else if (cameraPositionY <= 90) {
    // 2 3
    position = Math.floor(Math.random() * 2) + 2;
  } else if (cameraPositionY <= 180) {
    // 0 3
    if (Math.floor(Math.random() * 2) === 0) {
      position = 0;
    } else {
      position = 3;
    }
  } else if (cameraPositionY <= 270) {
    // 01
    position = Math.floor(Math.random() * 2) + 1;
  } else if (cameraPositionY < 360) {
    // 1 2
    position = Math.floor(Math.random() * 2) + 1;
  }

  let direction;

  if (position === 0) {
    box.setAttribute(`position`, `${horizontal} ${vertical} ${WORLDSIZE}`);
    const value = Math.floor(Math.random() * 180);
    direction = (value < 90) ? 270 + value : value - 90;
  } else if (position === 1) {
    box.setAttribute(`position`, `${WORLDSIZE} ${vertical} ${horizontal}`);
    direction = Math.floor(Math.random() * 180);
  } else if (position === 2) {
    box.setAttribute(`position`, `${horizontal} ${vertical} -${WORLDSIZE}`);
    direction = Math.floor(Math.random() * 180) + 90;
  } else {
    box.setAttribute(`position`, `-${WORLDSIZE} ${vertical} ${horizontal}`);
    direction = Math.floor(Math.random() * 180) + 180;
  }

  box.classList.add(direction);
  box.classList.add(`planet`);

  document.querySelector(`.parent`).appendChild(box);
};

const resetBox = (box, cameraPositionY) => {
  box.setAttribute(`scale`, `0 0 0`);

  const vertical = Math.floor(Math.random() * (WORLDSIZE * 2)) - WORLDSIZE;
  const horizontal = Math.floor(Math.random() * (WORLDSIZE * 2)) - WORLDSIZE;

  let position;

  if (cameraPositionY === 0) {
    // 1 2 3
    position = Math.floor(Math.random() * 3) + 1;
  } else if (cameraPositionY <= 90) {
    // 2 3
    position = Math.floor(Math.random() * 2) + 2;
  } else if (cameraPositionY <= 180) {
    // 0 3
    if (Math.floor(Math.random() * 2) === 0) {
      position = 0;
    } else {
      position = 3;
    }
  } else if (cameraPositionY <= 270) {
    // 01
    position = Math.floor(Math.random() * 2) + 1;
  } else if (cameraPositionY < 360) {
    // 1 2
    position = Math.floor(Math.random() * 2) + 1;
  }

  let direction;

  if (position === 0) {
    box.setAttribute(`position`, `${horizontal} ${vertical} ${WORLDSIZE}`);
    const value = Math.floor(Math.random() * 180);
    direction = (value < 90) ? 270 + value : value - 90;
  } else if (position === 1) {
    box.setAttribute(`position`, `${WORLDSIZE} ${vertical} ${horizontal}`);
    direction = Math.floor(Math.random() * 180);
  } else if (position === 2) {
    box.setAttribute(`position`, `${horizontal} ${vertical} -${WORLDSIZE}`);
    direction = Math.floor(Math.random() * 180) + 90;
  } else {
    box.setAttribute(`position`, `-${WORLDSIZE} ${vertical} ${horizontal}`);
    direction = Math.floor(Math.random() * 180) + 180;
  }

  box.className = ``;
  box.classList.add(direction);
  box.classList.add(`planet`);
};

const calculateBoxChange = direction => {
  const speed = 0.3;

  let xChange = 0;
  let zChange = 0;

  if (direction === 0) {
    //Z++
    zChange = speed;
    //X0
  } else if (direction <= 90) {
    //Z++
    zChange = (90 - direction) / 90 * speed;
    //X++
    xChange = direction / 90 * speed;
  } else if (direction <= 180) {
    //Z--
    zChange = - ((direction - 90) / 90 * speed);
    //X++
    xChange = (Math.abs(direction - 180)) / 90 * speed;
  } else if (direction <= 270) {
    //Z--
    zChange = - ((270 - direction) / 90 * speed);
    //X--
    xChange = - ((direction - 180) / 90 * speed);
  } else if (direction < 360) {
    //Z++
    zChange = (direction - 270) / 90 * speed;
    //X--
    xChange = - ((360 - direction) / 90 * speed);
  }

  return {
    xChange: xChange,
    zChange: zChange
  };
};

const calculateMovement = (cameraPositionX, cameraPositionY) => {
  if (planespeed < MAXSPEED) {
    planespeed += 0.001;
    speedtext.setAttribute(`value`, `${Math.round((planespeed / MAXSPEED) * 100)}%`);
  }

  let xChange = 0;
  let zChange = 0;

  if (cameraPositionY === 0) {
    //Z++
    zChange = planespeed;
    //X0
  } else if (cameraPositionY <= 90) {
    //Z++
    zChange = (90 - cameraPositionY) / 90 * planespeed;
    //X++
    xChange = cameraPositionY / 90 * planespeed;
  } else if (cameraPositionY <= 180) {
    //Z--
    zChange = - ((cameraPositionY - 90) / 90 * planespeed);
    //X++
    xChange = (Math.abs(cameraPositionY - 180)) / 90 * planespeed;
  } else if (cameraPositionY <= 270) {
    //Z--
    zChange = - ((270 - cameraPositionY) / 90 * planespeed);
    //X--
    xChange = - ((cameraPositionY - 180) / 90 * planespeed);
  } else if (cameraPositionY < 360) {
    //Z++
    zChange = (cameraPositionY - 270) / 90 * planespeed;
    //X--
    xChange = - ((360 - cameraPositionY) / 90 * planespeed);
  }

  const yChange = (cameraPositionX / 90);

  return {
    xChange: xChange,
    zChange: zChange,
    yChange: yChange
  };
};

const saveScore = () => {
  if (localStorage.score) {
    if (localStorage.score < score) {
      localStorage.setItem(`score`, score);
      highscoretext.setAttribute(`value`, `HIGHSCORE: ${score}`);
    }
  } else {
    localStorage.setItem(`score`, score);
    highscoretext.setAttribute(`value`, `HIGHSCORE: ${score}`);
  }
};

const checkHighscore = () => {
  if (localStorage.score) {
    highscoretext.setAttribute(`value`, `HIGHSCORE: ${localStorage.score}`);
  }
};

init();
