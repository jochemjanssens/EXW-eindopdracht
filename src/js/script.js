import setupMenu from '../js/menu.js';

let scoretext, centertext, speedtext, highscoretext, deathElement;

let count = 5;
let timer;

let dead = false;
let analyser, frequencyArray;
let isShooting = false;
let score = 0;
let scorePerHit = 1;

let state = `pregame`;

const PLANETSPAWNSPEED = 5;
const STARTPLANETS = 40;
const WORLDSIZE = 200;
const MAXSPEED = 3;
const MAXNUMBERSOFPLANETS = 150;

let currentPlanets = STARTPLANETS;
const STARTSPEED = 0.5;
let planespeed = STARTSPEED;

const init = () => {
  for (let i = 0;i < STARTPLANETS;i ++) {
    generateNewPlanet();
  }

  scoretext = document.querySelector(`.score`);
  centertext = document.querySelector(`.centertext`);
  speedtext = document.querySelector(`.speed`);
  highscoretext = document.querySelector(`.highscore`);
  deathElement = document.querySelector(`.deadoverlay`);

  setupMenu();

  checkHighscore();

  checkAudio();

  const waitForAframe = setInterval(function() {
    const vrbutton = document.querySelector(`.a-enter-vr-button`);
    if (vrbutton) {
      vrbutton.addEventListener(`mousedown`, startgame);
      clearInterval(waitForAframe);
    }
  }, 500);
};

const restart = () => {
  dead = false;
  currentPlanets = STARTPLANETS;
  score = 0;
  planespeed = STARTSPEED;

  deathElement.setAttribute(`material`, `opacity: 0`);

  document.querySelectorAll(`.bullet`).forEach(bullet => {
    bullet.parentNode.removeChild(bullet);
  });

  startgame();
};

const startgame = () => {
  count = 3;

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

  monitorAudio();
};

const soundNotAllowed = error => {
  console.log(error);
};

const handleTimer = () => {
  if (count === - 1) {
    clearInterval(timer);
    centertext.setAttribute(`value`, ``);

    const spawnPlanets = setInterval(function() {
      currentPlanets ++;
      if (MAXNUMBERSOFPLANETS < currentPlanets) {
        clearInterval(spawnPlanets);
      }
    }, PLANETSPAWNSPEED);
    state = `play`;
    update();
  } else if (count === 0) {
    centertext.setAttribute(`value`, `GO`);
  } else {
    centertext.setAttribute(`value`, count);
  }
  count --;
};


let totalVolume = 0;
let volumeElements = 0;

const monitorAudio = () => {
  if (state === `pregame`) {
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

      requestAnimationFrame(monitorAudio);
    }
  } else if (state === `play`) {
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

      return volume;
    }
  }
};


const checkShooting = (changes, volume) => {
  const averageVolume = totalVolume / volumeElements;

  if (volume > averageVolume + 8 && isShooting === false) {
    shoot(changes);
    isShooting = true;
  } else if (volume < averageVolume + 6 && isShooting === true) {
    isShooting = false;
  }
};

const update = () => {
  const cameraPosition = document.querySelector(`a-camera`).components.rotation.data;
  const cameraPositionY = Math.floor(Math.abs(cameraPosition.y % 360));
  const cameraPositionX = Math.floor(cameraPosition.x % 360);

  const changes = calculateMovement(cameraPositionX, cameraPositionY);

  const numberOfPlanets = document.querySelectorAll(`.planet`).length;
  if (numberOfPlanets < currentPlanets) {
    generateNewPlanet(cameraPositionY);
  }

  const volume = monitorAudio();

  checkShooting(changes, volume);

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

      if (position.x < 5 && position.x > - 5 && position.z < 5 && position.z > - 5 && position.y < 5 && position.y > - 5) {
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
          if (bulletposition.x < position.x + 5 &&  bulletposition.x > position.x - 5  && bulletposition.y < position.y + 5 &&  bulletposition.y > position.y - 5 && bulletposition.z < position.z + 5 &&  bulletposition.z > position.z - 5) {
            score += scorePerHit;
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
  centertext.setAttribute(`value`, `YOU DIED`);
  dead = true;

  animateDead();
};

let counter  = 0;

const animateDead = () => {
  if (counter > 60) {
    restart();
  } else {
    const newOpacity = deathElement.getAttribute(`material`).opacity + 0.01;
    deathElement.setAttribute(`material`, `opacity: ${newOpacity}`);
    counter ++;
    requestAnimationFrame(animateDead);
  }
};

const shoot = direction => {
  const bullet = document.createElement(`a-box`);
  bullet.setAttribute(`color`, `#ECF838`);

  bullet.setAttribute(`width`, `0.3`);
  bullet.setAttribute(`height`, `0.3`);
  bullet.setAttribute(`depth`, `0.3`);

  bullet.classList.add(`bullet`);
  bullet.dataset.xChange = direction.xChange;
  bullet.dataset.yChange = direction.yChange;
  bullet.dataset.zChange = direction.zChange;
  document.querySelector(`a-scene`).appendChild(bullet);
};

const generateNewPlanet = cameraPositionY => {
  const planet = document.createElement(`a-box`);

  planet.setAttribute(`src`, `#texture`);
  planet.setAttribute(`width`, 5);
  planet.setAttribute(`height`, 5);
  planet.setAttribute(`depth`, 5);
  planet.setAttribute(`scale`, `0 0 0`);

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
    planet.setAttribute(`position`, `${horizontal} ${vertical} ${WORLDSIZE}`);
    const value = Math.floor(Math.random() * 180);
    direction = (value < 90) ? 270 + value : value - 90;
  } else if (position === 1) {
    planet.setAttribute(`position`, `${WORLDSIZE} ${vertical} ${horizontal}`);
    direction = Math.floor(Math.random() * 180);
  } else if (position === 2) {
    planet.setAttribute(`position`, `${horizontal} ${vertical} -${WORLDSIZE}`);
    direction = Math.floor(Math.random() * 180) + 90;
  } else {
    planet.setAttribute(`position`, `-${WORLDSIZE} ${vertical} ${horizontal}`);
    direction = Math.floor(Math.random() * 180) + 180;
  }

  planet.classList.add(direction);
  planet.classList.add(`planet`);

  document.querySelector(`.parent`).appendChild(planet);
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
    planespeed += 0.003;
    speedtext.setAttribute(`value`, `${Math.round(((planespeed - STARTSPEED) / (MAXSPEED - STARTSPEED)) * 1000)}`);
    if (planespeed >= MAXSPEED) {
      scorePerHit = 2;
    }
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
