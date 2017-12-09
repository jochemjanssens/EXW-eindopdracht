let textElement;
let centertext;
let speedtext;

let count = 7;
let timer;

let dead = false;
let analyser, frequencyArray;
let isShooting = false;
let score = 0;


let planespeed = 0.1;

const restart = () => {
  count = 3;
  dead = false;
  score = 0;
  planespeed = 0.1;

  document.querySelectorAll(`.bullet`).forEach(bullet => {
    bullet.parentNode.removeChild(bullet);
  });

  startgame();
};

const init = () => {
  for (let i = 0;i < 50;i ++) {
    generateNewBox();
  }

  textElement = document.querySelector(`.score`);
  centertext = document.querySelector(`.centertext`);
  speedtext = document.querySelector(`.speedtext`);

  checkAudio();

  setTimeout(() => {
    const vrbutton = document.querySelector(`.a-enter-vr-button`);
    console.log(vrbutton);
    vrbutton.addEventListener(`mousedown`, startgame);
  }, 0);
};

const startgame = () => {
  console.log(`start`);
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

function handleTimer() {
  if (count === - 1) {
    clearInterval(timer);
    centertext.setAttribute(`value`, ``);
    update();
  } else if (count === 0) {
    centertext.setAttribute(`value`, `go`);
  } else {
    centertext.setAttribute(`value`, count);
  }
  count --;
}

const update = () => {
  generateNewBox();

  const changes = calculateMovement();
  if (analyser) {
    analyser.getByteFrequencyData(frequencyArray);
    if (frequencyArray[0] > 50 && isShooting === false) {
      shoot(changes);
      console.log(`schiet`);
      isShooting = true;
    } else if (frequencyArray[0] < 50 && isShooting === true) {
      isShooting = false;
    }
  }

  document.querySelectorAll(`.bullet`).forEach(bullet => {
    const position = bullet.getAttribute(`position`);
    if (position) {
      bullet.setAttribute(`position`, `${position.x - (bullet.dataset.xChange * 8)} ${position.y + (bullet.dataset.yChange * 8)} ${position.z - (bullet.dataset.zChange * 8)}`);

      if (position.x > 100 || position.z > 100 || position.x < - 100 || position.z < - 100 || position.y > 100 || position.y < - 100) {
        bullet.parentNode.removeChild(bullet);
      }

      //😰 collision detection
      document.querySelectorAll(`.planet`).forEach(box => {
        const positionPlanet = box.getAttribute(`position`);
        if (positionPlanet) {
          if (position.x < positionPlanet.x + 3 &&  position.x > positionPlanet.x - 3  && position.y < positionPlanet.y + 3 &&  position.y > positionPlanet.y - 3 && position.z < positionPlanet.z + 3 &&  position.z > positionPlanet.z - 3) {
            console.log(`raak`);
            score += 1;
            textElement.setAttribute(`value`, `Score: ${score}`);
            box.parentNode.removeChild(box);
            bullet.parentNode.removeChild(bullet);
          }
        }
      });
    }
  });

  document.querySelectorAll(`.planet`).forEach(box => {
    const scale = box.getAttribute(`scale`);
    if (scale) {
      if (scale.x <= 1) {
        const newScale = scale.x + 0.24;
        box.setAttribute(`scale`, `${newScale} ${newScale} ${newScale}`);
      }
    }

    const position = box.getAttribute(`position`);
    if (position) {
      const boxChange = calculateBoxChange(box.classList[0]);
      box.setAttribute(`position`, `${position.x + boxChange.xChange + changes.xChange} ${position.y - changes.yChange} ${position.z + boxChange.zChange + changes.zChange}`);

      if (position.x > 100 || position.z > 100 || position.x < - 100 || position.z < - 100 || position.y > 100 || position.y < - 100) {
        box.parentNode.removeChild(box);
      }

      if (position.x < 3 && position.x > - 3 && position.z < 3 && position.z > - 3 && position.y < 3 && position.y > - 3) {
        box.parentNode.removeChild(box);
        centertext.setAttribute(`value`, `dood`);
        dead = true;

        setTimeout(() => {
          console.log(`restart`);
          restart();
        }, 1000);
      }
    }
  });

  if (dead === false) {
    requestAnimationFrame(update);
  }
};

const shoot = direction => {
  const bullet = document.createElement(`a-sphere`);
  bullet.setAttribute(`color`, `#FC0D1C`);
  bullet.setAttribute(`radius`, `0.3`);

  bullet.classList.add(`bullet`);
  bullet.dataset.xChange = direction.xChange;
  bullet.dataset.yChange = direction.yChange;
  bullet.dataset.zChange = direction.zChange;
  document.querySelector(`a-scene`).appendChild(bullet);
};

const generateNewBox = () => {
  const box = document.createElement(`a-sphere`);
  box.setAttribute(`src`, `#texture`);


  const direction = Math.floor(Math.random() * 360);
  box.classList.add(direction);
  box.classList.add(`planet`);

  const height = Math.floor(Math.random() * 200) - 100;

  box.setAttribute(`radius`, 3);

  box.setAttribute(`scale`, `0 0 0`);


  const position = Math.floor(Math.random() * 4);
  if (position === 0) {
    box.setAttribute(`position`, `100 ${height} ${(Math.random() * 200) - 100}`);
  } else if (position === 1) {
    box.setAttribute(`position`, `-100 ${height} ${(Math.random() * 200) - 100}`);
  } else if (position === 2) {
    box.setAttribute(`position`, `${(Math.random() * 200) - 100} ${height} -100`);
  } else {
    box.setAttribute(`position`, `${(Math.random() * 200) - 100} ${height} 100`);
  }

  document.querySelector(`.parent`).appendChild(box);
};

const calculateBoxChange = direction => {

  const speed = 0.3;

  let xChange = 0;
  let zChange = 0;

  if (direction === 0) {
    //Z++
    zChange = speed;
    //X0
  } else if (direction < 90) {
    //Z++
    zChange = (90 - direction) / 90 * speed;
    //X++
    xChange = direction / 90 * speed;
  } else if (direction === 90) {
    //Z0
    //X++
    xChange = speed;
  } else if (direction < 180) {
    //Z--
    zChange = - ((direction - 90) / 90 * speed);
    //X++
    xChange = (Math.abs(direction - 180)) / 90 * speed;
  } else if (direction === 180) {
    //Z--
    zChange = - speed;
    //X0
  } else if (direction < 270) {
    //Z--
    zChange = - ((270 - direction) / 90 * speed);
    //X--
    xChange = - ((direction - 180) / 90 * speed);
  } else if (direction === 270) {
    //Z0
    //X--
    xChange = - speed;
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

const calculateMovement = () => {
  if (planespeed < 3) {
    planespeed += 0.01;
    speedtext.setAttribute(`value`, Math.round(planespeed * 100) / 100);
  }

  const cameraPosition = document.querySelector(`a-camera`).components.rotation.data;
  const cameraPositionY = Math.floor(Math.abs(cameraPosition.y % 360));
  const cameraPositionX = Math.floor(cameraPosition.x % 360);

  let xChange = 0;
  let zChange = 0;

  if (cameraPositionY === 0) {
    //Z++
    zChange = planespeed;
    //X0
  } else if (cameraPositionY < 90) {
    //Z++
    zChange = (90 - cameraPositionY) / 90 * planespeed;
    //X++
    xChange = cameraPositionY / 90 * planespeed;
  } else if (cameraPositionY === 90) {
    //Z0
    //X++
    xChange = planespeed;
  } else if (cameraPositionY < 180) {
    //Z--
    zChange = - ((cameraPositionY - 90) / 90 * planespeed);
    //X++
    xChange = (Math.abs(cameraPositionY - 180)) / 90 * planespeed;
  } else if (cameraPositionY === 180) {
    //Z--
    zChange = - planespeed;
    //X0
  } else if (cameraPositionY < 270) {
    //Z--
    zChange = - ((270 - cameraPositionY) / 90 * planespeed);
    //X--
    xChange = - ((cameraPositionY - 180) / 90 * planespeed);
  } else if (cameraPositionY === 270) {
    //Z0
    //X--
    xChange = - planespeed;
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

init();
