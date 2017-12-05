const init = () => {
  for (let i = 0;i < 50;i ++) {
    generateNewBox();
  }

  checkAudio();

  //zorg ervoor dat je jezelf kan voorbereiden
  setTimeout(() => {
    update();
  }, 3000);
};

let dead = false;
let analyser, frequencyArray;
let isShooting = false;

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

const update = () => {
  generateNewBox();

  const changes = calculateMovement();
  if (analyser) {
    analyser.getByteFrequencyData(frequencyArray);
    if (frequencyArray[0] > 50 && isShooting === false) {
      shoot(changes);
      console.log(`shoot`);
      isShooting = true;
    } else if (frequencyArray[0] < 50 && isShooting === true) {
      isShooting = false;
    }
  }

  document.querySelectorAll(`.bullet`).forEach(bullet => {
    const position = bullet.getAttribute(`position`);
    if (position) {
      bullet.setAttribute(`position`, `${position.x - (bullet.dataset.xChange * 2)} ${position.y + (bullet.dataset.yChange * 2)} ${position.z - (bullet.dataset.zChange * 2)}`);

      if (position.x > 100 || position.z > 100 || position.x < - 100 || position.z < - 100 || position.y > 100 || position.y < - 100) {
        bullet.parentNode.removeChild(bullet);
      }

      //😰 collision detection
      document.querySelectorAll(`a-sphere`).forEach(box => {
        const positionPlanet = box.getAttribute(`position`);
        if (positionPlanet) {
          if (position.x < positionPlanet.x + 3 &&  position.x > positionPlanet.x - 3  && position.y < positionPlanet.y + 3 &&  position.y > positionPlanet.y - 3 && position.z < positionPlanet.z + 3 &&  position.z > positionPlanet.z - 3) {
            console.log(`raak`);
            box.setAttribute(`color`, `red`);
            //box.parentNode.removeChild(box);
          }
        }
      });
    }
  });

  document.querySelectorAll(`a-sphere`).forEach(box => {
    const position = box.getAttribute(`position`);
    if (position) {
      const boxChange = calculateBoxChange(box.classList[0]);
      box.setAttribute(`position`, `${position.x + boxChange.xChange + changes.xChange} ${position.y - changes.yChange} ${position.z + boxChange.zChange + changes.zChange}`);

      if (position.x > 100 || position.z > 100 || position.x < - 100 || position.z < - 100 || position.y > 100 || position.y < - 100) {
        box.parentNode.removeChild(box);
      }

      if (position.x < 3 && position.x > - 3 && position.z < 3 && position.z > - 3 && position.y < 3 && position.y > - 3) {
        console.log(box.classList[0]);
        dead = true;
      }
    }
  });

  if (dead === false) {
    requestAnimationFrame(update);
  }
};

const shoot = direction => {
  const bullet = document.createElement(`a-box`);
  bullet.setAttribute(`color`, `blue`);
  bullet.setAttribute(`width`, `0.4`);
  bullet.setAttribute(`height`, `0.4`);
  bullet.setAttribute(`depth`, `0.4`);

  bullet.classList.add(`bullet`);
  bullet.dataset.xChange = direction.xChange;
  bullet.dataset.yChange = direction.yChange;
  bullet.dataset.zChange = direction.zChange;
  document.querySelector(`a-scene`).appendChild(bullet);
};

const generateNewBox = () => {
  const box = document.createElement(`a-sphere`);
  box.setAttribute(`src`, `assets/texture.jpg`);


  const direction = Math.floor(Math.random() * 360);
  box.classList.add(direction);

  const height = Math.floor(Math.random() * 200) - 100;

  const size = Math.floor(Math.random() * 3) + 1;
  box.setAttribute(`radius`, size);

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

  const speed = 0.05;

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
  const cameraPosition = document.querySelector(`a-camera`).components.rotation.data;
  const cameraPositionY = Math.floor(Math.abs(cameraPosition.y % 360));
  const cameraPositionX = Math.floor(cameraPosition.x % 360);

  const speed = 0.2;

  let xChange = 0;
  let zChange = 0;

  if (cameraPositionY === 0) {
    //Z++
    zChange = speed;
    //X0
  } else if (cameraPositionY < 90) {
    //Z++
    zChange = (90 - cameraPositionY) / 90 * speed;
    //X++
    xChange = cameraPositionY / 90 * speed;
  } else if (cameraPositionY === 90) {
    //Z0
    //X++
    xChange = speed;
  } else if (cameraPositionY < 180) {
    //Z--
    zChange = - ((cameraPositionY - 90) / 90 * speed);
    //X++
    xChange = (Math.abs(cameraPositionY - 180)) / 90 * speed;
  } else if (cameraPositionY === 180) {
    //Z--
    zChange = - speed;
    //X0
  } else if (cameraPositionY < 270) {
    //Z--
    zChange = - ((270 - cameraPositionY) / 90 * speed);
    //X--
    xChange = - ((cameraPositionY - 180) / 90 * speed);
  } else if (cameraPositionY === 270) {
    //Z0
    //X--
    xChange = - speed;
  } else if (cameraPositionY < 360) {
    //Z++
    zChange = (cameraPositionY - 270) / 90 * speed;
    //X--
    xChange = - ((360 - cameraPositionY) / 90 * speed);
  }

  const yChange = (cameraPositionX / 90);

  return {
    xChange: xChange,
    zChange: zChange,
    yChange: yChange
  };
};

init();
