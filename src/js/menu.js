let rightArrow, leftArrow, title, rules, instructionsRight, instructionsLeft, arrowRight, arrowLeft, playTitle, vrButton;

const init = () => {
  rightArrow = document.querySelector(`.arrow-right`);
  leftArrow = document.querySelector(`.arrow-left`);

  title = document.querySelector(`.title`);
  rules = document.querySelector(`.rules`);
  instructionsRight = document.querySelector(`.instructions-right`);
  instructionsLeft = document.querySelector(`.instructions-left`);
  arrowRight = document.querySelector(`.arrow-right`);

  arrowLeft = document.querySelector(`.arrow-left`);
  playTitle = document.querySelector(`.playTitle`);

  setTimeout(() => {
    vrButton = document.querySelector(`.a-enter-vr-button`);
    vrButton.classList.add(`invisible`);
  }, 0);

  rightArrow.addEventListener(`click`, rightArrowClicked);
  leftArrow.addEventListener(`click`, leftArrowClicked);
};

const rightArrowClicked = () => {

  title.classList.add(`invisible`);
  rules.classList.add(`invisible`);
  instructionsRight.classList.add(`invisible`);
  instructionsLeft.classList.add(`invisible`);
  arrowRight.classList.add(`invisible`);

  arrowLeft.classList.remove(`invisible`);
  playTitle.classList.remove(`invisible`);
  vrButton.classList.remove(`invisible`);

};

const leftArrowClicked = () => {

  title.classList.remove(`invisible`);
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
