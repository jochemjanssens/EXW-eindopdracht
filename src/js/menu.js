const rightArrow = document.querySelector(`.arrow-right`);
const leftArrow = document.querySelector(`.arrow-left`);

const titel = document.querySelector(`.titel`);
const rules = document.querySelector(`.rules`);
const instructionsRight = document.querySelector(`.instructions-right`);
const instructionsLeft = document.querySelector(`.instructions-left`);
const arrowRight = document.querySelector(`.arrow-right`);

const arrowLeft = document.querySelector(`.arrow-left`);
const playTitle = document.querySelector(`.playTitle`);
let vrButton;

const init = () => {

  setTimeout(() => {
    vrButton = document.querySelector(`.a-enter-vr-button`);
    vrButton.classList.add(`invisible`);
  }, 0);

  rightArrow.addEventListener(`click`, rightArrowClicked);
  leftArrow.addEventListener(`click`, leftArrowClicked);
};

const rightArrowClicked = () => {

  titel.classList.add(`invisible`);
  rules.classList.add(`invisible`);
  instructionsRight.classList.add(`invisible`);
  instructionsLeft.classList.add(`invisible`);
  arrowRight.classList.add(`invisible`);

  arrowLeft.classList.remove(`invisible`);
  playTitle.classList.remove(`invisible`);
  vrButton.classList.remove(`invisible`);

};

const leftArrowClicked = () => {

  titel.classList.remove(`invisible`);
  rules.classList.remove(`invisible`);
  instructionsRight.classList.remove(`invisible`);
  instructionsLeft.classList.remove(`invisible`);
  arrowRight.classList.remove(`invisible`);

  arrowLeft.classList.add(`invisible`);
  playTitle.classList.add(`invisible`);
  vrButton.classList.add(`invisible`);
};

export default () => {
  init();
};
